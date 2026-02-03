#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="bluestarai-leadgen"
CONTAINER_NAME="leadgen-app"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  dev           Start development server with hot reload"
    echo "  build         Build production Docker image"
    echo "  preview       Run production build locally"
    echo "  stop          Stop all running containers"
    echo "  clean         Remove containers and images"
    echo "  logs          Show container logs"
    echo "  shell         Open shell in running container"
    echo ""
}

cmd_dev() {
    log_info "Starting development server..."
    cd "$PROJECT_ROOT"
    
    docker compose up app-dev --build
}

cmd_build() {
    log_info "Building production image..."
    cd "$PROJECT_ROOT"
    
    VERSION="${1:-$(date +'%Y.%m.%d')-$(git rev-parse --short HEAD 2>/dev/null || echo 'local')}"
    
    docker build \
        --build-arg VITE_APP_VERSION="$VERSION" \
        --build-arg VITE_BUILD_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        -t "$IMAGE_NAME:$VERSION" \
        -t "$IMAGE_NAME:latest" \
        .
    
    log_success "Image built: $IMAGE_NAME:$VERSION"
    
    # Show image size
    docker images "$IMAGE_NAME:latest" --format "Size: {{.Size}}"
}

cmd_preview() {
    log_info "Starting production preview..."
    cd "$PROJECT_ROOT"
    
    # Build if needed
    if ! docker images "$IMAGE_NAME:latest" --format "{{.Repository}}" | grep -q "$IMAGE_NAME"; then
        cmd_build
    fi
    
    docker compose up app-preview --build -d
    
    log_success "Preview running at http://localhost:8080"
    log_info "Run '$0 logs' to see output"
}

cmd_stop() {
    log_info "Stopping containers..."
    cd "$PROJECT_ROOT"
    
    docker compose down
    
    log_success "Containers stopped"
}

cmd_clean() {
    log_info "Cleaning up Docker resources..."
    
    docker compose down 2>/dev/null || true
    
    docker rm -f $(docker ps -a -q --filter "name=$CONTAINER_NAME") 2>/dev/null || true
    
    docker rmi $(docker images "$IMAGE_NAME" -q) 2>/dev/null || true
    
    docker image prune -f
    
    log_success "Cleanup complete"
}

cmd_logs() {
    CONTAINER="${1:-app-preview}"
    cd "$PROJECT_ROOT"
    
    docker compose logs -f "$CONTAINER"
}

cmd_shell() {
    CONTAINER="${1:-app-preview}"
    cd "$PROJECT_ROOT"
    
    docker compose exec "$CONTAINER" /bin/sh
}

# Main
case "${1:-}" in
    dev)
        cmd_dev
        ;;
    build)
        cmd_build "${2:-}"
        ;;
    preview)
        cmd_preview
        ;;
    stop)
        cmd_stop
        ;;
    clean)
        cmd_clean
        ;;
    logs)
        cmd_logs "${2:-}"
        ;;
    shell)
        cmd_shell "${2:-}"
        ;;
    ""|help|--help|-h)
        show_usage
        ;;
    *)
        log_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac
