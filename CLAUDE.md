# Quinn - AI Personal Assistant SaaS

## Overview
Quinn is a personal assistant SaaS that actually does things. Monorepo with backend, frontend, and infrastructure packages managed by pnpm workspaces.

## Tech Stack
- **Backend**: Express.js + TypeScript, deployed as AWS Lambda via `serverless-http`
- **Frontend**: React 19 + TypeScript + Vite 7, MUI v5, Zustand, TanStack React Query v5
- **Infrastructure**: AWS SAM (CloudFormation), nested stacks in `infrastructure/nested-stacks/`
- **Auth**: AWS Cognito (backend uses `aws-jwt-verify`, frontend uses `@aws-amplify/ui-react`)
- **Database**: DynamoDB
- **AI**: AWS Bedrock (Claude)
- **Package manager**: pnpm

## Common Commands
```bash
pnpm install                      # Install all dependencies
pnpm --filter backend dev         # Run backend dev server
pnpm --filter frontend dev        # Run frontend dev server
pnpm --filter backend test        # Run backend tests (Jest)
pnpm --filter frontend test       # Run frontend tests (Vitest)
pnpm --filter backend build       # Build backend
pnpm --filter frontend build      # Build frontend
pnpm --filter backend lint        # Lint backend
pnpm --filter frontend lint       # Lint frontend
pnpm run format                   # Format all files with Prettier
cd infrastructure && sam build && sam deploy  # Deploy infrastructure
```

## Code Conventions
- **Formatting**: Prettier — double quotes, 2-space indent, 100 char print width, trailing commas (es5), LF line endings
- **Commits**: Conventional commits enforced by commitlint + husky. Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert. Scopes: backend, frontend, mobile, shared, infra, docs, ci, deps, config, auth, approval, email, voice, banking, food, social, travel. Subject must be lower-case, max 72 chars.
- **TypeScript**: Strict mode, ES2022 target, NodeNext modules
- **Node**: Requires >=20.0.0

## Project Structure
```
backend/src/
  index.ts              # Express app entry + Lambda handler
  adapters/             # DynamoDB data access layer
  routes/               # Express route handlers
  lib/                  # External service integrations (Gmail, Plaid, AI, etc.)
  middleware/            # Auth, validation, error handling, logging
  handlers/             # Lambda-specific handlers
  __tests__/            # Jest tests

frontend/src/
  pages/                # Page components
  hooks/                # Custom React hooks (useBanking, useChat, etc.)
  components/           # Shared UI components
  services/             # API client
  store/                # Zustand stores

infrastructure/
  template.yaml         # Main SAM template
  nested-stacks/        # Nested CloudFormation stacks
  samconfig.toml        # SAM deploy config
```

## Environment
- AWS region: eu-west-2
- Environment variables: see `.env.example` at project root
- Never read or commit `.env`, `.env.local`, or `frontend/.env` files
