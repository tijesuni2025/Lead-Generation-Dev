# Bluestarai LeadGen Pro

AI-Powered Lead Management Platform by BluestarAI World Inc.

[![Deploy Status](https://github.com/bluestarai/leadgen-platform/actions/workflows/ci-cd.yaml/badge.svg)](https://github.com/bluestarai/leadgen-platform/actions)

## Overview

Modern, AI-powered lead management platform built with React 19, Vite, and Tailwind CSS.

### Key Features

- **Smart Lead Scoring** - AI-powered lead prioritization
- **Pipeline Management** - Visual pipeline tracking
- **AI Lead Analyst** - Claude-powered sales assistant
- **Multi-format Export** - CSV, Excel, JSON, PDF
- **Role-based Access** - Admin and client dashboards

## Tech Stack

React 19 | Vite 6 | Tailwind CSS 3 | AWS S3 | GitHub Actions

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

**Demo**: admin@bluestarai.world / admin123

## Structure

```
├── .github/workflows/    # CI/CD pipeline
├── docker/               # Nginx configs
├── infrastructure/       # Terraform IaC
├── scripts/              # DevOps scripts
└── src/                  # Application code
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run deploy:dev` | Deploy to dev |
| `npm run deploy:staging` | Deploy to staging |
| `npm run deploy:prod` | Deploy to production |
| `npm run docker:dev` | Docker development |
| `npm run docker:preview` | Docker preview |
| `npm run security` | Security scan |

## Docker

```bash
npm run docker:dev      # Development with hot reload
npm run docker:preview  # Production preview at :8080
```

## Deployment

GitHub Actions auto-deploys:
- `develop` → Staging
- `main` → Production

Manual: `./scripts/deploy.sh [dev|staging|production]`

### Required Secrets

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Security

```bash
npm run security  # Run comprehensive scan
```
