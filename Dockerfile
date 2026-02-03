
FROM node:18-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./

RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_APP_VERSION=latest
ARG VITE_BUILD_TIME
ARG VITE_API_URL

ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_BUILD_TIME=$VITE_BUILD_TIME
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build
FROM nginx:alpine AS runner

RUN apk add --no-cache curl

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nextjs:nodejs /var/run/nginx.pid

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

EXPOSE 80

LABEL org.opencontainers.image.title="Bluestarai LeadGen Pro"
LABEL org.opencontainers.image.description="AI-Powered Lead Management Platform"
LABEL org.opencontainers.image.vendor="BluestarAI World Inc."
LABEL org.opencontainers.image.version="${VITE_APP_VERSION}"

CMD ["nginx", "-g", "daemon off;"]
