# Phase 1: Foundation (Weeks 1-8)

## Overview

Phase 1 establishes the core infrastructure and delivers the first user-facing capability: **Email Management with Approval Workflow**.

## Goals

1. Set up complete development infrastructure
2. Implement user authentication and onboarding
3. Build the approval engine (core of Quinn)
4. Deliver email management capability
5. Create basic web and mobile interfaces

---

## Week 1-2: Project Setup & Infrastructure

### Objectives

- Initialize monorepo with all tooling
- Deploy AWS infrastructure (dev environment)
- Set up CI/CD pipelines
- Configure authentication

### Deliverables

#### 1.1 Monorepo Setup

```
quinn/
├── backend/           # Express + TypeScript
├── frontend/          # React + Vite
├── mobile/            # Expo
├── shared/            # Shared types
├── infrastructure/    # CloudFormation
├── docs/              # Documentation
└── .github/           # CI/CD
```

**Tasks:**

- [ ] Initialize npm workspaces
- [ ] Configure TypeScript (base + per-package)
- [ ] Set up ESLint + Prettier
- [ ] Configure Husky + commitlint
- [ ] Create shared types package

#### 1.2 Backend Setup

```
backend/
├── src/
│   ├── adapters/      # DynamoDB operations
│   ├── controllers/   # Route handlers
│   ├── routes/        # Express routes
│   ├── middleware/    # Auth, validation
│   ├── models/        # Joi schemas
│   ├── lib/           # External services
│   ├── services/      # Business logic
│   ├── types/         # TypeScript types
│   ├── utils/         # Utilities
│   └── index.ts       # Entry point
├── tests/
├── package.json
└── tsconfig.json
```

**Tasks:**

- [ ] Initialize Express with TypeScript
- [ ] Configure SAM CLI
- [ ] Set up local development (sam local)
- [ ] Create health check endpoint
- [ ] Configure CORS and middleware

#### 1.3 Frontend Setup

```
frontend/
├── src/
│   ├── assets/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── i18n/
│   ├── pages/
│   ├── services/
│   ├── store/
│   └── styles/
├── package.json
└── vite.config.ts
```

**Tasks:**

- [ ] Initialize React with Vite
- [ ] Configure MUI theme
- [ ] Set up routing (React Router)
- [ ] Configure i18n (react-i18next)
- [ ] Create base layout components

#### 1.4 Mobile Setup

```
mobile/
├── src/
│   ├── assets/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   └── store/
├── app.json
└── package.json
```

**Tasks:**

- [ ] Initialize Expo project
- [ ] Configure React Native Paper
- [ ] Set up Expo Router
- [ ] Configure push notifications
- [ ] Create base navigation structure

#### 1.5 Infrastructure

```yaml
# CloudFormation Stack Structure
main.yaml
├── cognito.yaml       # User authentication
├── api.yaml           # API Gateway + Lambda
├── dynamodb.yaml      # Database tables
├── s3-cloudfront.yaml # Frontend hosting
└── monitoring.yaml    # CloudWatch
```

**Tasks:**

- [ ] Create Cognito User Pool
- [ ] Create API Gateway + Lambda
- [ ] Create DynamoDB tables
- [ ] Create S3 bucket + CloudFront
- [ ] Configure CloudWatch logging

#### 1.6 CI/CD Pipelines

```yaml
# GitHub Actions Workflows
.github/workflows/
├── pr-checks.yml      # Lint, test, build
├── deploy-dev.yml     # Deploy to dev
└── deploy-prod.yml    # Deploy to prod
```

**Tasks:**

- [ ] Create PR checks workflow
- [ ] Create dev deployment workflow
- [ ] Create prod deployment workflow
- [ ] Configure environment secrets
- [ ] Set up deployment notifications

### Success Criteria

- [ ] All packages build successfully
- [ ] Dev environment deployed to AWS
- [ ] CI/CD pipelines working
- [ ] Health check endpoint responding
- [ ] Frontend accessible via CloudFront

---

## Week 3-4: Core Backend Services

### Objectives

- Implement user management
- Build the approval engine
- Create notification service
- Set up audit logging

### Deliverables

#### 2.1 User Management

**API Endpoints:**

```
GET    /users/me              # Get current user
PATCH  /users/me              # Update profile
GET    /users/me/preferences  # Get preferences
PATCH  /users/me/preferences  # Update preferences
DELETE /users/me              # Delete account
```

**Tasks:**

- [ ] Create user adapter (DynamoDB)
- [ ] Implement user controller
- [ ] Create user routes
- [ ] Add Joi validation schemas
- [ ] Implement preferences management

#### 2.2 Approval Engine

The approval engine is the heart of Quinn:

```typescript
// Core approval flow
interface ApprovalEngine {
  // Create approval request
  createApproval(action: Action): Promise<Approval>;

  // Process user response
  respondToApproval(approvalId: string, response: ApprovalResponse): Promise<void>;

  // Check for auto-approval
  checkAutoApproval(approval: Approval): Promise<boolean>;

  // Handle expiration
  handleExpiredApprovals(): Promise<void>;

  // Get pending approvals
  getPendingApprovals(userId: string): Promise<Approval[]>;
}
```

**Tasks:**

- [ ] Create approval adapter
- [ ] Implement approval service
- [ ] Create approval controller
- [ ] Add approval routes
- [ ] Implement auto-approval logic
- [ ] Add expiration handling

#### 2.3 Action Management

```typescript
// Action lifecycle
interface ActionService {
  // Create new action
  createAction(userId: string, actionData: CreateActionInput): Promise<Action>;

  // Execute approved action
  executeAction(actionId: string): Promise<ActionResult>;

  // Cancel action
  cancelAction(actionId: string): Promise<void>;

  // Get action status
  getActionStatus(actionId: string): Promise<ActionStatus>;
}
```

**Tasks:**

- [ ] Create action adapter
- [ ] Implement action service
- [ ] Create action controller
- [ ] Add action routes
- [ ] Implement action execution framework

#### 2.4 Notification Service

```typescript
// Multi-channel notifications
interface NotificationService {
  // Send notification
  send(userId: string, notification: Notification): Promise<void>;

  // Send via specific channel
  sendPush(userId: string, message: PushMessage): Promise<void>;
  sendEmail(userId: string, email: EmailMessage): Promise<void>;
  sendSMS(userId: string, sms: SMSMessage): Promise<void>;
}
```

**Tasks:**

- [ ] Create notification service
- [ ] Implement push notifications (Expo)
- [ ] Implement email notifications (SES)
- [ ] Implement SMS notifications (future - Twilio)
- [ ] Add notification preferences

#### 2.5 Audit Service

```typescript
// Audit logging
interface AuditService {
  // Log event
  log(event: AuditEvent): Promise<void>;

  // Query logs
  query(userId: string, filters: AuditFilters): Promise<AuditLog[]>;
}
```

**Tasks:**

- [ ] Create audit adapter
- [ ] Implement audit service
- [ ] Add audit middleware
- [ ] Create audit query endpoint

### Success Criteria

- [ ] User CRUD operations working
- [ ] Approval workflow functional
- [ ] Actions can be created and executed
- [ ] Notifications sending (at least email)
- [ ] Audit logs being recorded

---

## Week 5-6: Email Integration

### Objectives

- Integrate Gmail and Outlook
- Implement email sync and categorization
- Build AI-powered draft generation
- Create email sending with approval

### Deliverables

#### 3.1 Gmail Integration

```typescript
interface GmailService {
  // OAuth
  getAuthUrl(userId: string): string;
  handleCallback(userId: string, code: string): Promise<void>;

  // Sync
  syncEmails(userId: string): Promise<Email[]>;

  // Actions
  sendEmail(userId: string, email: EmailDraft): Promise<void>;
  markAsRead(userId: string, emailId: string): Promise<void>;
}
```

**Tasks:**

- [ ] Set up Google Cloud project
- [ ] Implement OAuth flow
- [ ] Create Gmail API client
- [ ] Implement email sync
- [ ] Implement email sending
- [ ] Store tokens securely

#### 3.2 Outlook Integration

```typescript
interface OutlookService {
  // OAuth
  getAuthUrl(userId: string): string;
  handleCallback(userId: string, code: string): Promise<void>;

  // Sync
  syncEmails(userId: string): Promise<Email[]>;

  // Actions
  sendEmail(userId: string, email: EmailDraft): Promise<void>;
}
```

**Tasks:**

- [ ] Set up Azure AD app
- [ ] Implement OAuth flow
- [ ] Create Microsoft Graph client
- [ ] Implement email sync
- [ ] Implement email sending

#### 3.3 Email Categorization

```typescript
interface EmailCategorizationService {
  // Categorize single email
  categorize(email: Email): Promise<EmailCategory>;

  // Batch categorization
  categorizeBatch(emails: Email[]): Promise<Map<string, EmailCategory>>;

  // AI analysis
  analyzeEmail(email: Email): Promise<EmailAnalysis>;
}
```

**Tasks:**

- [ ] Create categorization rules
- [ ] Implement AI categorization (Bedrock)
- [ ] Add priority detection
- [ ] Implement sentiment analysis
- [ ] Store categorization results

#### 3.4 AI Draft Generation

```typescript
interface DraftGenerationService {
  // Generate reply draft
  generateReply(email: Email, instructions?: string): Promise<EmailDraft>;

  // Generate new email
  generateEmail(prompt: string, context?: UserContext): Promise<EmailDraft>;

  // Improve draft
  improveDraft(draft: EmailDraft, feedback: string): Promise<EmailDraft>;
}
```

**Tasks:**

- [ ] Create Bedrock client
- [ ] Implement prompt templates
- [ ] Add user style learning
- [ ] Create draft generation endpoint
- [ ] Implement draft improvement

#### 3.5 Email API Endpoints

```
GET    /emails                    # List emails
GET    /emails/:emailId           # Get email details
POST   /emails/:emailId/draft-reply  # Generate draft
POST   /emails/:emailId/categorize   # Categorize email
POST   /emails/sync               # Trigger sync
```

**Tasks:**

- [ ] Create email controller
- [ ] Add email routes
- [ ] Implement pagination
- [ ] Add filtering and search

### Success Criteria

- [ ] Gmail OAuth working
- [ ] Outlook OAuth working
- [ ] Emails syncing to DynamoDB
- [ ] AI categorization working
- [ ] Draft generation working
- [ ] Email sending with approval

---

## Week 7-8: Frontend & Mobile MVP

### Objectives

- Build web dashboard
- Create mobile app screens
- Implement approval workflow UI
- Add settings and preferences

### Deliverables

#### 4.1 Web Dashboard

**Pages:**

```
/login              # Authentication
/register           # Sign up
/forgot-password    # Password reset
/dashboard          # Main dashboard
/approvals          # Approval queue
/emails             # Email management
/settings           # User settings
/history            # Action history
```

**Tasks:**

- [ ] Implement authentication pages
- [ ] Create dashboard layout
- [ ] Build approval queue component
- [ ] Create email list and detail views
- [ ] Implement settings pages
- [ ] Add action history view

#### 4.2 Dashboard Components

```
components/
├── atoms/
│   ├── Button/
│   ├── Input/
│   ├── Badge/
│   └── Avatar/
├── molecules/
│   ├── ApprovalCard/
│   ├── EmailPreview/
│   ├── ActionItem/
│   └── NotificationBell/
└── organisms/
    ├── ApprovalQueue/
    ├── EmailList/
    ├── Sidebar/
    └── Header/
```

**Tasks:**

- [ ] Create atomic components
- [ ] Build approval card component
- [ ] Create email preview component
- [ ] Implement sidebar navigation
- [ ] Add notification bell

#### 4.3 Mobile App Screens

**Screens:**

```
screens/
├── Auth/
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── ForgotPasswordScreen
├── Dashboard/
│   └── DashboardScreen
├── Approvals/
│   ├── ApprovalListScreen
│   └── ApprovalDetailScreen
├── Emails/
│   ├── EmailListScreen
│   └── EmailDetailScreen
└── Settings/
    └── SettingsScreen
```

**Tasks:**

- [ ] Implement auth screens
- [ ] Create dashboard screen
- [ ] Build approval list and detail
- [ ] Create email screens
- [ ] Implement settings screen

#### 4.4 State Management

```typescript
// Zustand stores
interface AppStore {
  // User state
  user: User | null;
  preferences: UserPreferences | null;

  // Approvals
  pendingApprovals: Approval[];

  // Actions
  recentActions: Action[];

  // UI state
  sidebarOpen: boolean;
  theme: "light" | "dark";
}
```

**Tasks:**

- [ ] Create user store
- [ ] Create approvals store
- [ ] Create actions store
- [ ] Implement persistence
- [ ] Add optimistic updates

#### 4.5 API Integration

```typescript
// TanStack Query hooks
const useApprovals = () =>
  useQuery({
    queryKey: ["approvals"],
    queryFn: () => api.get("/approvals"),
  });

const useRespondToApproval = () =>
  useMutation({
    mutationFn: (data) => api.post(`/approvals/${data.id}/respond`, data),
    onSuccess: () => queryClient.invalidateQueries(["approvals"]),
  });
```

**Tasks:**

- [ ] Create API client
- [ ] Implement auth interceptor
- [ ] Create query hooks
- [ ] Create mutation hooks
- [ ] Add error handling

### Success Criteria

- [ ] Web app fully functional
- [ ] Mobile app basic functionality
- [ ] Approval workflow working end-to-end
- [ ] Email management working
- [ ] Settings configurable
- [ ] Push notifications working

---

## Testing Requirements

### Unit Tests

- [ ] User service tests
- [ ] Approval engine tests
- [ ] Action service tests
- [ ] Email service tests
- [ ] Notification service tests

### Integration Tests

- [ ] API endpoint tests
- [ ] OAuth flow tests
- [ ] Email sync tests
- [ ] Approval workflow tests

### E2E Tests

- [ ] User registration flow
- [ ] Email connection flow
- [ ] Approval workflow flow
- [ ] Settings update flow

---

## Definition of Done

Phase 1 is complete when:

1. ✅ Infrastructure deployed and stable
2. ✅ User can register and authenticate
3. ✅ User can connect Gmail or Outlook
4. ✅ Emails sync and display in app
5. ✅ AI can categorize emails
6. ✅ AI can generate draft replies
7. ✅ User can approve/reject email actions
8. ✅ Approved emails are sent
9. ✅ All actions are audited
10. ✅ Web and mobile apps functional

---

## Risk Mitigation

| Risk               | Mitigation                                      |
| ------------------ | ----------------------------------------------- |
| OAuth complexity   | Start with Gmail only, add Outlook later        |
| AI quality         | Use Claude 3 Haiku for speed, upgrade if needed |
| Mobile delays      | Prioritize web, mobile can follow               |
| Integration issues | Build mock services for testing                 |

---

## Next Phase Preview

**Phase 2: Communication (Weeks 9-14)**

- Phone call capability via Twilio
- Voice synthesis with Amazon Polly
- Advanced email automation
- SMS interaction
