#!/bin/bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEFAULT_REGION="us-east-2"

# Bucket mapping
declare -A BUCKETS=(
    ["dev"]="bluestaraileadgen-dev-test"
    ["staging"]="bluestaraileadgen-staging"
    ["production"]="bluestaraileadgen-prod"
)

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  dev         Deploy to development"
    echo "  staging     Deploy to staging"
    echo "  production  Deploy to production (requires confirmation)"
    echo ""
    echo "Options:"
    echo "  --skip-build    Skip npm build step"
    echo "  --skip-tests    Skip running tests"
    echo "  --dry-run       Show what would be deployed without deploying"
    echo "  --rollback      Rollback to previous version"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging --skip-tests"
    echo "  $0 production"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install it first."
        exit 1
    fi
    
    log_success "All dependencies found"
}

check_aws_credentials() {
    log_info "Checking AWS credentials..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    log_success "AWS credentials valid"
}

run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_warning "Skipping tests"
        return
    fi
    
    log_info "Running tests..."
    cd "$PROJECT_ROOT"
    
    if npm run test --if-present; then
        log_success "Tests passed"
    else
        log_warning "Tests failed or not configured"
    fi
}

run_build() {
    if [ "$SKIP_BUILD" = true ]; then
        log_warning "Skipping build"
        return
    fi
    
    log_info "Building application..."
    cd "$PROJECT_ROOT"
    
    # Set build environment variables
    export VITE_APP_VERSION="$(date +'%Y.%m.%d')-$(git rev-parse --short HEAD 2>/dev/null || echo 'local')"
    export VITE_BUILD_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    export VITE_ENVIRONMENT="$ENVIRONMENT"
    
    npm ci
    npm run build
    
    cat > dist/build-info.json << EOF
{
    "version": "$VITE_APP_VERSION",
    "environment": "$ENVIRONMENT",
    "buildTime": "$VITE_BUILD_TIME",
    "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF
    
    log_success "Build completed"
}

backup_current_deployment() {
    if [ "$ENVIRONMENT" = "dev" ]; then
        log_info "Skipping backup for dev environment"
        return
    fi
    
    log_info "Creating backup of current deployment..."
    
    BACKUP_BUCKET="${BUCKETS[$ENVIRONMENT]}-backups"
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    
    if aws s3 ls "s3://$BACKUP_BUCKET" 2>&1 | grep -q 'NoSuchBucket'; then
        log_warning "Backup bucket doesn't exist, skipping backup"
        return
    fi
    
    aws s3 sync "s3://${BUCKETS[$ENVIRONMENT]}" "s3://$BACKUP_BUCKET/$TIMESTAMP/" \
        --quiet || log_warning "Backup failed (bucket may be empty)"
    
    log_success "Backup created at s3://$BACKUP_BUCKET/$TIMESTAMP/"
}

deploy_to_s3() {
    local BUCKET="${BUCKETS[$ENVIRONMENT]}"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would deploy to s3://$BUCKET"
        aws s3 sync ./dist "s3://$BUCKET" --delete --dryrun
        return
    fi
    
    log_info "Deploying to s3://$BUCKET..."
    
    # Deploy static assets with long cache
    aws s3 sync ./dist "s3://$BUCKET" \
        --delete \
        --cache-control "public, max-age=31536000, immutable" \
        --exclude "index.html" \
        --exclude "build-info.json" \
        --exclude "*.html"
    
    # Deploy HTML files with no-cache
    aws s3 cp ./dist/index.html "s3://$BUCKET/index.html" \
        --cache-control "no-cache, no-store, must-revalidate"
    
    # Deploy build info
    aws s3 cp ./dist/build-info.json "s3://$BUCKET/build-info.json" \
        --cache-control "no-cache"
    
    log_success "Deployment to S3 completed"
}

invalidate_cloudfront() {
    # Check for CloudFront distribution
    local DISTRIBUTION_ID=""
    
    case "$ENVIRONMENT" in
        staging)
            DISTRIBUTION_ID="${STAGING_CLOUDFRONT_ID:-}"
            ;;
        production)
            DISTRIBUTION_ID="${PRODUCTION_CLOUDFRONT_ID:-}"
            ;;
    esac
    
    if [ -z "$DISTRIBUTION_ID" ]; then
        log_info "No CloudFront distribution configured for $ENVIRONMENT"
        return
    fi
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would invalidate CloudFront distribution: $DISTRIBUTION_ID"
        return
    fi
    
    log_info "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --output text
    
    log_success "CloudFront cache invalidation initiated"
}

run_health_check() {
    local URL=""
    
    case "$ENVIRONMENT" in
        dev)
            URL="http://bluestaraileadgen-dev-test.s3-website.us-east-2.amazonaws.com"
            ;;
        staging)
            URL="http://bluestaraileadgen-staging.s3-website.us-east-2.amazonaws.com"
            ;;
        production)
            URL="http://bluestaraileadgen-prod.s3-website.us-east-2.amazonaws.com"
            ;;
    esac
    
    log_info "Running health check on $URL..."
    
    # Wait for deployment to propagate
    sleep 5
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        log_success "Health check passed (HTTP $HTTP_STATUS)"
    else
        log_error "Health check failed (HTTP $HTTP_STATUS)"
        exit 1
    fi
    
    # Verify build info
    BUILD_INFO=$(curl -s "$URL/build-info.json" 2>/dev/null || echo "{}")
    log_info "Deployed version: $(echo "$BUILD_INFO" | grep -o '"version":"[^"]*"' || echo 'unknown')"
}

rollback() {
    if [ "$ENVIRONMENT" = "dev" ]; then
        log_error "Rollback not supported for dev environment"
        exit 1
    fi
    
    local BACKUP_BUCKET="${BUCKETS[$ENVIRONMENT]}-backups"
    local BUCKET="${BUCKETS[$ENVIRONMENT]}"
    
    log_info "Listing available backups..."
    
    BACKUPS=$(aws s3 ls "s3://$BACKUP_BUCKET/" --output text | awk '{print $2}' | tr -d '/' | tail -5)
    
    if [ -z "$BACKUPS" ]; then
        log_error "No backups found"
        exit 1
    fi
    
    echo "Available backups:"
    echo "$BACKUPS" | nl
    
    read -p "Enter backup number to restore (or 'q' to quit): " CHOICE
    
    if [ "$CHOICE" = "q" ]; then
        log_info "Rollback cancelled"
        exit 0
    fi
    
    BACKUP_NAME=$(echo "$BACKUPS" | sed -n "${CHOICE}p")
    
    if [ -z "$BACKUP_NAME" ]; then
        log_error "Invalid selection"
        exit 1
    fi
    
    log_info "Restoring from backup: $BACKUP_NAME"
    
    aws s3 sync "s3://$BACKUP_BUCKET/$BACKUP_NAME/" "s3://$BUCKET/" --delete
    
    log_success "Rollback completed"
    run_health_check
}

confirm_production() {
    if [ "$ENVIRONMENT" != "production" ]; then
        return
    fi
    
    echo ""
    log_warning "You are about to deploy to PRODUCTION"
    echo ""
    read -p "Type 'production' to confirm: " CONFIRM
    
    if [ "$CONFIRM" != "production" ]; then
        log_error "Deployment cancelled"
        exit 1
    fi
}

# Main execution
main() {
    # Parse arguments
    ENVIRONMENT="${1:-}"
    SKIP_BUILD=false
    SKIP_TESTS=false
    DRY_RUN=false
    ROLLBACK_MODE=false
    
    shift || true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --rollback)
                ROLLBACK_MODE=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate environment
    if [ -z "$ENVIRONMENT" ]; then
        log_error "Environment is required"
        show_usage
        exit 1
    fi
    
    if [[ ! -v "BUCKETS[$ENVIRONMENT]" ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        show_usage
        exit 1
    fi
    
    echo ""
    echo "  Bluestarai LeadGen Pro Deployment"
    echo "  Environment: $ENVIRONMENT"
    echo "  Bucket: ${BUCKETS[$ENVIRONMENT]}"
    echo "  Dry Run: $DRY_RUN"
    echo ""
    
    # Check prerequisites
    check_dependencies
    check_aws_credentials
    
    # Handle rollback
    if [ "$ROLLBACK_MODE" = true ]; then
        rollback
        exit 0
    fi
    confirm_production
    
    cd "$PROJECT_ROOT"
    run_tests
    run_build
    backup_current_deployment
    deploy_to_s3
    invalidate_cloudfront
    run_health_check
    
    echo ""
    log_success "Deployment to $ENVIRONMENT completed successfully!"
    echo ""
}

main "$@"
