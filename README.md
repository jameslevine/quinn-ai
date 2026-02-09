# Quinn - AI Personal Assistant

> "Quinn knows what to do"

An AI personal assistant that actually **DOES** things for you, not just suggests.

## Overview

Quinn is an AI-powered personal assistant that can:

- 📧 **Manage emails** - Read, categorize, draft, and send emails on your behalf
- 📞 **Make phone calls** - Book appointments, handle customer service, negotiate bills
- 🛒 **Order food & groceries** - Meal planning, grocery shopping, food delivery
- 💰 **Manage finances** - Budget tracking, bill management, spending controls
- 📅 **Organize your life** - Social planning, appointments, travel booking

All with **human oversight and approval** - you stay in control.

## Tech Stack

### Backend

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: DynamoDB
- **Authentication**: Amazon Cognito
- **AI/LLM**: AWS Bedrock (Claude models)
- **Infrastructure**: AWS Lambda + API Gateway
- **IaC**: CloudFormation (SAM CLI)

### Web Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: MUI (Material UI)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Styling**: Emotion

### Mobile App

- **Framework**: Expo SDK with React Native
- **UI Library**: React Native Paper
- **Navigation**: Expo Router

### Infrastructure

- **Cloud**: AWS (eu-west-2 London)
- **CI/CD**: GitHub Actions
- **Monitoring**: CloudWatch

## Project Structure

```
quinn/
├── backend/                 # Express Lambda backend
├── frontend/                # React web application
├── mobile/                  # Expo mobile application
├── infrastructure/          # CloudFormation templates
├── shared/                  # Shared types and utilities
├── docs/                    # Documentation
└── .github/                 # CI/CD workflows
```

## Getting Started

### Prerequisites

- Node.js 20+
- AWS CLI configured
- SAM CLI installed
- Expo CLI (for mobile development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/quinn.git
cd quinn

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development
npm run dev
```

### Development Commands

```bash
# Start all services in development
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Start mobile only
npm run dev:mobile

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build

# Deploy to dev environment
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

## Documentation

- [Architecture Overview](./docs/architecture/system-overview.md)
- [API Documentation](./docs/architecture/api-design.md)
- [Data Model](./docs/architecture/data-model.md)
- [Security](./docs/architecture/security.md)

### Phase Documentation

- [Phase 1: Foundation](./docs/phases/phase-1-foundation.md)
- [Phase 2: Communication](./docs/phases/phase-2-communication.md)
- [Phase 3: Money](./docs/phases/phase-3-money.md)
- [Phase 4: Food](./docs/phases/phase-4-food.md)
- [Phase 5: Life](./docs/phases/phase-5-life.md)

## Roadmap

| Phase | Weeks | Focus                         | Status         |
| ----- | ----- | ----------------------------- | -------------- |
| 1     | 1-8   | Foundation (Email + Approval) | 🚧 In Progress |
| 2     | 9-14  | Communication (Phone Calls)   | ⏳ Planned     |
| 3     | 15-20 | Money (Banking + Budget)      | ⏳ Planned     |
| 4     | 21-26 | Food (Meals + Ordering)       | ⏳ Planned     |
| 5     | 27-32 | Life (Social + Travel)        | ⏳ Planned     |

## Contributing

This is currently a solo project. Contribution guidelines will be added when the team expands.

## License

Proprietary - All rights reserved.

---

Built with ❤️ for busy people who want their time back.
