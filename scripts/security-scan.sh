#!/bin/bash

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="$PROJECT_ROOT/security-reports"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; }

# Create reports directory
mkdir -p "$REPORT_DIR"

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

record_result() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ "$1" = "pass" ]; then
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    elif [ "$1" = "warn" ]; then
        WARNINGS=$((WARNINGS + 1))
    else
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

echo ""
echo "  Bluestarai LeadGen Security Scan"
echo "  Started: $(date)"
echo ""

# NPM AUDIT
log_info "Running npm audit..."

cd "$PROJECT_ROOT"

if npm audit --production > "$REPORT_DIR/npm-audit-$TIMESTAMP.txt" 2>&1; then
    log_success "No vulnerabilities found in production dependencies"
    record_result "pass"
else
    VULN_COUNT=$(npm audit --production --json 2>/dev/null | grep -c '"severity"' || echo "0")
    CRITICAL=$(npm audit --production --json 2>/dev/null | grep -c '"critical"' || echo "0")
    HIGH=$(npm audit --production --json 2>/dev/null | grep -c '"high"' || echo "0")
    
    if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
        log_error "Found critical/high vulnerabilities: Critical=$CRITICAL, High=$HIGH"
        record_result "fail"
    else
        log_warning "Found low/moderate vulnerabilities (see report)"
        record_result "warn"
    fi
fi

# SECRET SCANNING
log_info "Scanning for exposed secrets..."

SECRETS_FOUND=0

# Common secret patterns
PATTERNS=(
    'AKIA[0-9A-Z]{16}'                    # AWS Access Key
    'password\s*=\s*["\x27][^"\x27]+'     # Password assignments
    'api[_-]?key\s*=\s*["\x27][^"\x27]+'  # API keys
    'secret\s*=\s*["\x27][^"\x27]+'       # Secrets
    'token\s*=\s*["\x27][^"\x27]+'        # Tokens
    'private[_-]?key'                      # Private keys
)

for pattern in "${PATTERNS[@]}"; do
    MATCHES=$(grep -rn --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.env*" -E "$pattern" "$PROJECT_ROOT/src" 2>/dev/null | grep -v "node_modules" | grep -v ".example" || true)
    
    if [ -n "$MATCHES" ]; then
        echo "$MATCHES" >> "$REPORT_DIR/secrets-scan-$TIMESTAMP.txt"
        SECRETS_FOUND=$((SECRETS_FOUND + 1))
    fi
done

if [ "$SECRETS_FOUND" -gt 0 ]; then
    log_error "Potential secrets found in code (see report)"
    record_result "fail"
else
    log_success "No exposed secrets detected"
    record_result "pass"
fi

# DEPENDENCY LICENSE CHECK
log_info "Checking dependency licenses..."

BANNED_LICENSES=("GPL-3.0" "AGPL-3.0" "SSPL" "BUSL")
LICENSE_ISSUES=0

if [ -f "$PROJECT_ROOT/package.json" ]; then
    PROJECT_LICENSE=$(grep -o '"license":\s*"[^"]*"' "$PROJECT_ROOT/package.json" | cut -d'"' -f4 || echo "unknown")
    log_info "Project license: $PROJECT_LICENSE"
fi

for license in "${BANNED_LICENSES[@]}"; do
    if grep -r "$license" "$PROJECT_ROOT/node_modules/"*/package.json 2>/dev/null | head -5 > /dev/null; then
        log_warning "Found potentially incompatible license: $license"
        LICENSE_ISSUES=$((LICENSE_ISSUES + 1))
    fi
done 2>/dev/null || true

if [ "$LICENSE_ISSUES" -gt 0 ]; then
    log_warning "License review recommended"
    record_result "warn"
else
    log_success "No license issues detected"
    record_result "pass"
fi

# ENVIRONMENT FILE CHECK
log_info "Checking environment files..."

ENV_ISSUES=0

# Check if .env files are gitignored
if [ -f "$PROJECT_ROOT/.gitignore" ]; then
    if ! grep -q "\.env" "$PROJECT_ROOT/.gitignore"; then
        log_warning ".env files may not be gitignored"
        ENV_ISSUES=$((ENV_ISSUES + 1))
    fi
fi

# Check for committed .env files
if git -C "$PROJECT_ROOT" ls-files --error-unmatch .env .env.local .env.production 2>/dev/null; then
    log_error ".env files are tracked by git"
    ENV_ISSUES=$((ENV_ISSUES + 1))
fi 2>/dev/null || true

if [ "$ENV_ISSUES" -gt 0 ]; then
    log_warning "Environment file security issues found"
    record_result "warn"
else
    log_success "Environment files properly secured"
    record_result "pass"
fi

# SECURITY HEADERS CHECK (for Nginx config)
log_info "Checking security headers configuration..."

HEADERS_MISSING=0
REQUIRED_HEADERS=(
    "X-Frame-Options"
    "X-Content-Type-Options"
    "X-XSS-Protection"
    "Content-Security-Policy"
    "Referrer-Policy"
)

if [ -f "$PROJECT_ROOT/docker/default.conf" ]; then
    for header in "${REQUIRED_HEADERS[@]}"; do
        if ! grep -q "$header" "$PROJECT_ROOT/docker/default.conf"; then
            log_warning "Missing security header: $header"
            HEADERS_MISSING=$((HEADERS_MISSING + 1))
        fi
    done
    
    if [ "$HEADERS_MISSING" -eq 0 ]; then
        log_success "All security headers configured"
        record_result "pass"
    else
        log_warning "$HEADERS_MISSING security headers missing"
        record_result "warn"
    fi
else
    log_info "Nginx config not found (using S3 hosting)"
    record_result "pass"
fi

# CODE QUALITY 
log_info "Running code quality checks..."

# Check for console.log statements
CONSOLE_LOGS=$(grep -rn "console\.log" "$PROJECT_ROOT/src" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l || echo "0")

if [ "$CONSOLE_LOGS" -gt 10 ]; then
    log_warning "Found $CONSOLE_LOGS console.log statements (consider removing for production)"
    record_result "warn"
else
    log_success "Console.log usage is acceptable"
    record_result "pass"
fi

# Check for TODO/FIXME comments
TODOS=$(grep -rn "TODO\|FIXME\|XXX\|HACK" "$PROJECT_ROOT/src" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l || echo "0")

if [ "$TODOS" -gt 0 ]; then
    log_info "Found $TODOS TODO/FIXME comments"
fi

# BUILD INTEGRITY CHECK
log_info "Checking build configuration..."

if [ -f "$PROJECT_ROOT/vite.config.js" ]; then
    # Check for sourcemap configuration
    if grep -q "sourcemap.*true" "$PROJECT_ROOT/vite.config.js" 2>/dev/null; then
        log_warning "Sourcemaps enabled - may expose source code in production"
        record_result "warn"
    else
        log_success "Sourcemaps properly configured"
        record_result "pass"
    fi
else
    log_info "Using default Vite configuration"
    record_result "pass"
fi

echo ""
echo "  Security Scan Summary"
echo ""
echo "  Total Checks:  $TOTAL_CHECKS"
echo -e "  ${GREEN}Passed:${NC}        $PASSED_CHECKS"
echo -e "  ${YELLOW}Warnings:${NC}      $WARNINGS"
echo -e "  ${RED}Failed:${NC}        $FAILED_CHECKS"
echo ""
echo "  Reports saved to: $REPORT_DIR"
echo "============================================"
echo ""
if [ "$FAILED_CHECKS" -gt 0 ]; then
    log_error "Security scan found critical issues"
    exit 1
else
    log_success "Security scan completed"
    exit 0
fi
