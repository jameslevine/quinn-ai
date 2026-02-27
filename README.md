# Quinn - AI Personal Assistant 🤖

An AI that actually DOES things for you, not just suggests.

**Live Demo:** https://d15e722gqobfql.cloudfront.net

---

## Overview

Quinn is an AI-powered personal assistant that goes beyond answering questions. Unlike Siri, Alexa, or ChatGPT, Quinn can:

- 📧 Manage and send emails on your behalf
- 💰 Track your finances and manage budgets
- 🍽️ Plan meals, create grocery lists, and order food
- 📅 Schedule appointments and manage your calendar
- ✈️ Plan travel with flights, hotels, and activities
- 🎁 Track gifts and special occasions
- ✅ All with human oversight and approval

## Tech Stack

### Frontend

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **UI Library:** Material UI (MUI)
- **State Management:** Zustand
- **Data Fetching:** TanStack Query
- **Authentication:** AWS Amplify

### Backend

- **Runtime:** Node.js with TypeScript
- **Framework:** Express
- **Deployment:** AWS Lambda + API Gateway
- **Database:** DynamoDB
- **Authentication:** Amazon Cognito

### Infrastructure

- **Cloud:** AWS (eu-west-2)
- **IaC:** SAM/CloudFormation
- **CDN:** CloudFront
- **Storage:** S3

---

## Project Structure

```
quinn/
├── backend/                 # Express API (Lambda)
│   ├── src/
│   │   ├── adapters/       # DynamoDB operations
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation
│   │   ├── lib/            # External services (Gmail, Plaid)
│   │   └── index.ts        # Entry point
│   └── dist/               # Compiled output
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # React Query hooks
│   │   ├── services/       # API client
│   │   ├── store/          # Zustand store
│   │   └── styles/         # Theme
│   └── dist/               # Build output
├── infrastructure/         # CloudFormation
│   ├── template.yaml       # SAM template
│   └── samconfig.toml      # SAM config
└── docs/                   # Documentation
    ├── phases/             # Phase completion docs
    └── architecture/       # Architecture docs
```

---

## Features

### Phase 1: Foundation ✅

- User authentication (Cognito)
- Action management system
- Approval workflow
- Dashboard with stats

### Phase 2: Communication ✅

- Gmail integration (OAuth)
- Email listing and viewing
- Email composition and sending
- Integration management

### Phase 3: Money Management ✅

- Plaid banking integration
- Account linking
- Transaction viewing
- Budget management

### Phase 4: Food Management ✅

- Recipe management
- Meal planning
- Grocery lists
- Food ordering (simulated)
- Dietary preferences

### Phase 5: Life Admin ✅

- Contact management
- Social event planning
- Appointment scheduling
- Travel planning
- Gift tracking

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- AWS CLI configured
- SAM CLI

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/quinn.git
cd quinn

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values
```

### Development

```bash
# Start backend locally
cd backend && pnpm run dev

# Start frontend locally
cd frontend && pnpm run dev
```

### Deployment

```bash
# Build backend
cd backend && pnpm run build

# Deploy infrastructure
cd infrastructure && sam build && sam deploy

# Build and deploy frontend
cd frontend && pnpm run build
aws s3 sync dist s3://quinn-frontend-dev-563146874500 --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E3IGBWGLKMYMIX --paths "/*"
```

---

## API Endpoints

### Authentication

All endpoints require a valid Cognito JWT token in the `Authorization` header.

### Core Endpoints

| Category     | Endpoints | Description                                   |
| ------------ | --------- | --------------------------------------------- |
| Health       | 1         | Health check                                  |
| Users        | 4         | User profile and preferences                  |
| Actions      | 5         | Action CRUD                                   |
| Approvals    | 4         | Approval workflow                             |
| Emails       | 4         | Email management                              |
| Integrations | 4         | OAuth integrations                            |
| Banking      | 9         | Accounts, transactions, budgets               |
| Food         | 22        | Recipes, meal plans, groceries, orders        |
| Life         | 25        | Contacts, events, appointments, travel, gifts |

**Total: 78 API endpoints**

---

## Environment Variables

### Backend

```bash
# AWS
AWS_REGION=eu-west-2
DYNAMODB_TABLE=quinn-main-dev

# Cognito
COGNITO_USER_POOL_ID=eu-west-2_xxxxx
COGNITO_CLIENT_ID=xxxxx

# Gmail
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REDIRECT_URI=https://api.example.com/integrations/gmail/callback

# Plaid
PLAID_CLIENT_ID=xxxxx
PLAID_SECRET=xxxxx
PLAID_ENV=sandbox
```

### Frontend

```bash
VITE_API_URL=https://api.example.com/dev
VITE_COGNITO_USER_POOL_ID=eu-west-2_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
VITE_COGNITO_REGION=eu-west-2
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CloudFront CDN                          │
│                   (d15e722gqobfql.cloudfront.net)           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                         S3 Bucket                            │
│                    (React SPA Assets)                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│              (8aqsagpkp6.execute-api.eu-west-2)             │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Lambda Function                           │
│                   (Express + TypeScript)                     │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   DynamoDB    │    │    Cognito    │    │  External     │
│   (Data)      │    │   (Auth)      │    │  APIs         │
└───────────────┘    └───────────────┘    └───────────────┘
                                                  │
                              ┌────────────────────┼────────────────────┐
                              │                    │                    │
                        ┌──────────┐         ┌──────────┐        ┌──────────┐
                        │  Gmail   │         │  Plaid   │        │  Future  │
                        │  API     │         │  API     │        │  APIs    │
                        └──────────┘         └──────────┘        └──────────┘
```

### Data Model (DynamoDB Single Table)

```
PK                    SK                      Entity
─────────────────────────────────────────────────────
USER#<userId>         PROFILE                 User profile
USER#<userId>         PREFERENCES             User preferences
USER#<userId>         ACTION#<actionId>       Action
USER#<userId>         INTEGRATION#<id>        Integration
USER#<userId>         BANK#<connectionId>     Bank connection
USER#<userId>         BUDGET#<budgetId>       Budget
USER#<userId>         RECIPE#<recipeId>       Recipe
USER#<userId>         MEALPLAN#<id>           Meal plan
USER#<userId>         GROCERYLIST#<id>        Grocery list
USER#<userId>         FOODORDER#<id>          Food order
USER#<userId>         CONTACT#<contactId>     Contact
USER#<userId>         EVENT#<eventId>         Social event
USER#<userId>         APPOINTMENT#<id>        Appointment
USER#<userId>         TRAVEL#<planId>         Travel plan
USER#<userId>         GIFT#<giftId>           Gift
```

---

## Roadmap

### Completed ✅ (MVP)

- [x] **Phase 1: Foundation** - User auth, actions, approvals
- [x] **Phase 2: Communication** - Email management with Gmail
- [x] **Phase 3: Money Management** - Banking with Plaid, budgets
- [x] **Phase 4: Food Management** - Recipes, meal plans, groceries
- [x] **Phase 5: Life Admin** - Contacts, events, appointments, travel, gifts

### Planned 📋

- [ ] **Phase 6: AI Brain** - LLM integration (OpenAI/Anthropic) for intelligent assistance, chat interface, email drafting
- [ ] **Phase 7: Phone Calls** - Twilio integration for making calls on user's behalf, voice synthesis, call scripting
- [ ] **Phase 8: Real Integrations** - Connect to actual services (Deliveroo, Ocado, OpenTable, Skyscanner, etc.)
- [ ] **Phase 9: Multi-Channel** - SMS, WhatsApp, Alexa, Google Assistant, push notifications
- [ ] **Phase 10: Testing & Quality** - Unit tests, E2E tests, CI/CD, monitoring, analytics

### Future Considerations

- [ ] **Mobile App** - React Native / Expo app
- [ ] **Dedicated Spending Account** - Monzo/Revolut integration
- [ ] **Bill Negotiation** - Automated bill reduction calls
- [ ] **Family Plans** - Multi-user households

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is proprietary software. All rights reserved.

---

## Support

For support, please contact the development team.
