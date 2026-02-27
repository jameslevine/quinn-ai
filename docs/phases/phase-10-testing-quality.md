# Phase 10: Testing & Quality 🧪

## Overview

Phase 10 establishes comprehensive testing infrastructure, monitoring, and quality assurance processes to ensure Quinn is reliable, secure, and performant.

**Status:** 📋 Planned  
**Estimated Duration:** 4-6 weeks

---

## Goals

1. Implement unit testing (Jest)
2. Add integration testing
3. Create E2E testing (Cypress)
4. Set up error monitoring (Sentry)
5. Implement analytics
6. Add performance monitoring
7. Create CI/CD pipelines

---

## Features

### 10.1 Unit Testing

**Objective:** Test individual functions and components in isolation

**Backend Testing:**

```typescript
// backend/src/__tests__/adapters/users.test.ts
describe("User Adapter", () => {
  describe("createUser", () => {
    it("should create a new user with valid data", async () => {
      const user = await createUser("user-123", {
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      });

      expect(user.userId).toBe("user-123");
      expect(user.email).toBe("test@example.com");
    });

    it("should throw error for duplicate user", async () => {
      await expect(createUser("existing-user", {})).rejects.toThrow("User already exists");
    });
  });
});
```

**Frontend Testing:**

```typescript
// frontend/src/__tests__/hooks/useActions.test.ts
describe("useActions", () => {
  it("should fetch user actions", async () => {
    const { result } = renderHook(() => useActions());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(3);
  });
});
```

**Tasks:**

- [ ] Set up Jest configuration
- [ ] Create test utilities and mocks
- [ ] Write adapter tests
- [ ] Write route handler tests
- [ ] Write React hook tests
- [ ] Write component tests
- [ ] Achieve 80%+ code coverage

### 10.2 Integration Testing

**Objective:** Test API endpoints and database interactions

**API Testing:**

```typescript
// backend/src/__tests__/integration/actions.test.ts
describe("Actions API", () => {
  let authToken: string;

  beforeAll(async () => {
    authToken = await getTestAuthToken();
  });

  describe("POST /actions", () => {
    it("should create a new action", async () => {
      const response = await request(app)
        .post("/actions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          type: "email",
          title: "Send follow-up email",
          metadata: { to: "test@example.com" },
        });

      expect(response.status).toBe(201);
      expect(response.body.actionId).toBeDefined();
    });

    it("should return 401 without auth", async () => {
      const response = await request(app).post("/actions").send({ type: "email" });

      expect(response.status).toBe(401);
    });
  });
});
```

**Tasks:**

- [ ] Set up test database (DynamoDB Local)
- [ ] Create test fixtures
- [ ] Write API integration tests
- [ ] Test authentication flows
- [ ] Test error handling
- [ ] Test rate limiting

### 10.3 E2E Testing

**Objective:** Test complete user flows in the browser

**Cypress Tests:**

```typescript
// frontend/cypress/e2e/auth.cy.ts
describe("Authentication", () => {
  it("should allow user to sign in", () => {
    cy.visit("/login");

    cy.get('[data-testid="email-input"]').type("test@example.com");
    cy.get('[data-testid="password-input"]').type("password123");
    cy.get('[data-testid="login-button"]').click();

    cy.url().should("include", "/dashboard");
    cy.get('[data-testid="user-menu"]').should("contain", "test@example.com");
  });

  it("should show error for invalid credentials", () => {
    cy.visit("/login");

    cy.get('[data-testid="email-input"]').type("wrong@example.com");
    cy.get('[data-testid="password-input"]').type("wrongpassword");
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="error-message"]').should("be.visible");
  });
});

// frontend/cypress/e2e/actions.cy.ts
describe("Actions", () => {
  beforeEach(() => {
    cy.login("test@example.com", "password123");
  });

  it("should create and approve an action", () => {
    cy.visit("/actions");

    // Create action
    cy.get('[data-testid="create-action-button"]').click();
    cy.get('[data-testid="action-type"]').select("email");
    cy.get('[data-testid="action-title"]').type("Send report");
    cy.get('[data-testid="submit-action"]').click();

    // Verify action created
    cy.get('[data-testid="action-list"]').should("contain", "Send report");

    // Approve action
    cy.visit("/approvals");
    cy.get('[data-testid="approve-button"]').first().click();
    cy.get('[data-testid="confirm-approve"]').click();

    // Verify approved
    cy.get('[data-testid="action-status"]').should("contain", "Approved");
  });
});
```

**Tasks:**

- [ ] Set up Cypress
- [ ] Create custom commands
- [ ] Write authentication tests
- [ ] Write action flow tests
- [ ] Write approval flow tests
- [ ] Write settings tests
- [ ] Set up visual regression testing

### 10.4 Error Monitoring

**Objective:** Track and alert on errors in production

**Sentry Integration:**

```typescript
// backend/src/lib/sentry.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [new Sentry.Integrations.Http({ tracing: true })],
});

// Error handler middleware
export const sentryErrorHandler = Sentry.Handlers.errorHandler();

// Capture custom errors
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}
```

**Frontend Sentry:**

```typescript
// frontend/src/lib/sentry.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
});
```

**Tasks:**

- [ ] Set up Sentry project
- [ ] Integrate Sentry in backend
- [ ] Integrate Sentry in frontend
- [ ] Configure error alerts
- [ ] Set up release tracking
- [ ] Create error dashboards

### 10.5 Analytics

**Objective:** Track user behavior and feature usage

**Analytics Events:**

```typescript
// frontend/src/lib/analytics.ts
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
}

export function trackEvent(event: AnalyticsEvent) {
  // Send to analytics provider
  analytics.track(event.name, {
    ...event.properties,
    timestamp: new Date().toISOString(),
  });
}

// Usage
trackEvent({
  name: "action_created",
  properties: {
    actionType: "email",
    source: "dashboard",
  },
});
```

**Key Metrics:**

- Daily/Monthly Active Users
- Actions created per user
- Approval rate
- Feature usage
- Conversion funnel
- Retention

**Tasks:**

- [ ] Set up analytics provider (Mixpanel/Amplitude)
- [ ] Define event taxonomy
- [ ] Implement event tracking
- [ ] Create analytics dashboards
- [ ] Set up funnel analysis
- [ ] Implement A/B testing framework

### 10.6 Performance Monitoring

**Objective:** Track and optimize application performance

**Backend Monitoring:**

```typescript
// backend/src/middleware/performance.ts
import { performance } from "perf_hooks";

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = performance.now();

  res.on("finish", () => {
    const duration = performance.now() - start;

    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }

    // Send to monitoring
    metrics.recordLatency(req.path, duration);
  });

  next();
};
```

**Frontend Monitoring:**

```typescript
// frontend/src/lib/performance.ts
import { getCLS, getFID, getLCP, getFCP, getTTFB } from "web-vitals";

function sendToAnalytics(metric: Metric) {
  analytics.track("web_vital", {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
getFCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

**Tasks:**

- [ ] Set up CloudWatch metrics
- [ ] Implement request latency tracking
- [ ] Add Web Vitals monitoring
- [ ] Create performance dashboards
- [ ] Set up alerting for degradation
- [ ] Implement performance budgets

### 10.7 CI/CD Pipelines

**Objective:** Automate testing and deployment

**GitHub Actions:**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Unit tests
        run: pnpm test

      - name: Build
        run: pnpm build

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: pnpm install

      - name: Cypress run
        uses: cypress-io/github-action@v6
        with:
          build: pnpm build
          start: pnpm preview

  deploy:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-2

      - name: Deploy backend
        run: |
          cd backend && pnpm build
          cd ../infrastructure && sam build && sam deploy --no-confirm-changeset

      - name: Deploy frontend
        run: |
          cd frontend && pnpm build
          aws s3 sync dist s3://quinn-frontend-dev-563146874500 --delete
          aws cloudfront create-invalidation --distribution-id E3IGBWGLKMYMIX --paths "/*"
```

**Tasks:**

- [ ] Create CI workflow
- [ ] Add linting checks
- [ ] Add type checking
- [ ] Add unit test job
- [ ] Add E2E test job
- [ ] Create deployment workflow
- [ ] Set up environment secrets
- [ ] Add PR checks

---

## Test Coverage Goals

| Area                | Target Coverage |
| ------------------- | --------------- |
| Backend Adapters    | 90%             |
| Backend Routes      | 85%             |
| Frontend Hooks      | 80%             |
| Frontend Components | 75%             |
| E2E Critical Paths  | 100%            |

---

## Monitoring Dashboards

### Application Health

- Request rate
- Error rate
- Latency (p50, p95, p99)
- Active users

### Business Metrics

- Actions created
- Approvals processed
- Feature usage
- User retention

### Infrastructure

- Lambda invocations
- DynamoDB capacity
- CloudFront cache hit rate
- API Gateway latency

---

## Success Criteria

- [ ] 80%+ unit test coverage
- [ ] All critical paths have E2E tests
- [ ] Error monitoring active
- [ ] Analytics tracking key events
- [ ] Performance budgets met
- [ ] CI/CD pipeline running
- [ ] < 1% error rate in production
- [ ] < 500ms p95 latency

---

## Dependencies

- Jest + React Testing Library
- Cypress
- Sentry account
- Analytics provider (Mixpanel/Amplitude)
- GitHub Actions
- AWS CloudWatch

---

## Risks & Mitigations

| Risk                 | Mitigation                      |
| -------------------- | ------------------------------- |
| Flaky tests          | Retry logic, stable selectors   |
| Slow CI pipeline     | Parallel jobs, caching          |
| Test data management | Fixtures, cleanup scripts       |
| Coverage gaps        | Regular audits, PR requirements |
| Alert fatigue        | Tuned thresholds, grouping      |
