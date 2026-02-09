# Phase 3: Money (Weeks 15-20)

## Overview

Phase 3 adds financial capabilities, enabling Quinn to track spending, manage budgets, and make payments from a dedicated spending account.

## Goals

1. Integrate Open Banking (TrueLayer/Plaid)
2. Implement transaction categorization
3. Build budget tracking and alerts
4. Connect spending account (Monzo/Revolut)
5. Enable bill payment automation

---

## Week 15-16: Open Banking Integration

### Objectives

- Integrate TrueLayer for UK banks
- Implement bank account connection flow
- Build transaction sync pipeline
- Create transaction categorization

### Deliverables

#### 3.1 TrueLayer Integration

```typescript
interface OpenBankingService {
  // Connection
  getAuthUrl(userId: string, provider: string): string;
  handleCallback(userId: string, code: string): Promise<void>;

  // Accounts
  getAccounts(userId: string): Promise<BankAccount[]>;
  getBalance(accountId: string): Promise<Balance>;

  // Transactions
  getTransactions(accountId: string, dateRange: DateRange): Promise<Transaction[]>;
  syncTransactions(userId: string): Promise<SyncResult>;
}
```

**Tasks:**

- [ ] Set up TrueLayer account
- [ ] Implement OAuth flow
- [ ] Create account listing
- [ ] Implement transaction sync
- [ ] Add balance tracking

#### 3.2 Transaction Categorization

```typescript
interface TransactionCategorizationService {
  // Categorize
  categorize(transaction: Transaction): Promise<Category>;
  categorizeBatch(transactions: Transaction[]): Promise<Map<string, Category>>;

  // Learning
  updateCategory(transactionId: string, category: Category): Promise<void>;
  trainOnUserFeedback(userId: string): Promise<void>;
}

type Category =
  | "groceries"
  | "dining"
  | "transport"
  | "utilities"
  | "entertainment"
  | "shopping"
  | "health"
  | "travel"
  | "subscriptions"
  | "income"
  | "transfer"
  | "other";
```

**Tasks:**

- [ ] Create categorization rules
- [ ] Implement AI categorization
- [ ] Add merchant mapping
- [ ] Build learning from corrections
- [ ] Store categorization results

---

## Week 17-18: Spending Account Integration

### Objectives

- Integrate Monzo/Revolut APIs
- Implement spending controls
- Build transaction approval workflow
- Create real-time balance tracking

### Deliverables

#### 3.3 Spending Account Service

```typescript
interface SpendingAccountService {
  // Connection
  connect(userId: string, provider: "monzo" | "revolut"): Promise<void>;
  disconnect(userId: string): Promise<void>;

  // Balance
  getBalance(userId: string): Promise<Balance>;

  // Transactions
  getTransactions(userId: string, filters: TransactionFilters): Promise<Transaction[]>;

  // Payments
  initiatePayment(userId: string, payment: PaymentRequest): Promise<Payment>;

  // Controls
  setSpendingLimits(userId: string, limits: SpendingLimits): Promise<void>;
  pauseSpending(userId: string): Promise<void>;
  resumeSpending(userId: string): Promise<void>;
}
```

**Tasks:**

- [ ] Integrate Monzo API
- [ ] Integrate Revolut API
- [ ] Implement payment initiation
- [ ] Add spending controls
- [ ] Create real-time webhooks

#### 3.4 Spending Controls

```typescript
interface SpendingLimits {
  perTransaction: number;
  daily: number;
  weekly: number;
  monthly: number;
  byCategory: Record<Category, number>;
}

interface SpendingControlService {
  // Validation
  validateTransaction(
    userId: string,
    amount: number,
    category: Category
  ): Promise<ValidationResult>;

  // Alerts
  checkLimits(userId: string): Promise<LimitStatus[]>;
  sendAlert(userId: string, alert: SpendingAlert): Promise<void>;
}
```

**Tasks:**

- [ ] Implement limit validation
- [ ] Create pre-transaction checks
- [ ] Build alert system
- [ ] Add spending pause feature
- [ ] Create limit management UI

---

## Week 19-20: Budget Management

### Objectives

- Build budget creation and tracking
- Implement spending alerts
- Create financial reports
- Add bill management

### Deliverables

#### 3.5 Budget Service

```typescript
interface BudgetService {
  // Budget management
  createBudget(userId: string, budget: BudgetInput): Promise<Budget>;
  updateBudget(budgetId: string, updates: BudgetUpdate): Promise<Budget>;
  deleteBudget(budgetId: string): Promise<void>;

  // Tracking
  getBudgetStatus(userId: string): Promise<BudgetStatus[]>;
  getSpendingByCategory(userId: string, period: Period): Promise<CategorySpending[]>;

  // Alerts
  checkBudgetAlerts(userId: string): Promise<BudgetAlert[]>;
}

interface Budget {
  budgetId: string;
  userId: string;
  name: string;
  period: "weekly" | "monthly";
  categories: BudgetCategory[];
  totalLimit: number;
  startDate: string;
}
```

**Tasks:**

- [ ] Create budget data model
- [ ] Implement budget CRUD
- [ ] Build spending tracking
- [ ] Add budget alerts
- [ ] Create budget UI

#### 3.6 Financial Reports

```typescript
interface ReportService {
  // Reports
  generateWeeklyReport(userId: string): Promise<WeeklyReport>;
  generateMonthlyReport(userId: string): Promise<MonthlyReport>;

  // Insights
  getSpendingInsights(userId: string): Promise<SpendingInsight[]>;
  getSavingsSuggestions(userId: string): Promise<SavingSuggestion[]>;
}

interface WeeklyReport {
  period: DateRange;
  totalSpent: number;
  byCategory: CategorySpending[];
  comparedToLastWeek: number; // percentage
  budgetStatus: BudgetStatus[];
  insights: string[];
}
```

**Tasks:**

- [ ] Create report templates
- [ ] Implement weekly reports
- [ ] Implement monthly reports
- [ ] Add spending insights
- [ ] Build savings suggestions

#### 3.7 Bill Management

```typescript
interface BillService {
  // Detection
  detectRecurringBills(userId: string): Promise<Bill[]>;

  // Management
  addBill(userId: string, bill: BillInput): Promise<Bill>;
  updateBill(billId: string, updates: BillUpdate): Promise<Bill>;

  // Reminders
  getUpcomingBills(userId: string, days: number): Promise<Bill[]>;
  sendBillReminder(userId: string, bill: Bill): Promise<void>;

  // Payments
  scheduleBillPayment(billId: string, date: string): Promise<void>;
  payBill(billId: string): Promise<PaymentResult>;
}
```

**Tasks:**

- [ ] Implement bill detection
- [ ] Create bill tracking
- [ ] Add payment reminders
- [ ] Build bill payment automation
- [ ] Create bill management UI

---

## API Endpoints

### Banking API

```
GET    /banking/accounts           # List connected accounts
POST   /banking/connect            # Connect bank account
DELETE /banking/accounts/:id       # Disconnect account
GET    /banking/transactions       # List transactions
POST   /banking/sync               # Sync transactions
```

### Budget API

```
GET    /budgets                    # List budgets
POST   /budgets                    # Create budget
GET    /budgets/:id                # Get budget details
PATCH  /budgets/:id                # Update budget
DELETE /budgets/:id                # Delete budget
GET    /budgets/status             # Get budget status
```

### Spending API

```
GET    /spending/balance           # Get spending account balance
GET    /spending/transactions      # List spending transactions
POST   /spending/limits            # Set spending limits
POST   /spending/pause             # Pause spending
POST   /spending/resume            # Resume spending
```

### Bills API

```
GET    /bills                      # List bills
POST   /bills                      # Add bill
PATCH  /bills/:id                  # Update bill
DELETE /bills/:id                  # Delete bill
POST   /bills/:id/pay              # Pay bill
```

---

## Success Criteria

- [ ] Open Banking connection working
- [ ] Transactions syncing correctly
- [ ] Categorization accurate (>90%)
- [ ] Spending account connected
- [ ] Spending limits enforced
- [ ] Budgets tracking correctly
- [ ] Reports generating
- [ ] Bill reminders working

---

## Risk Mitigation

| Risk                  | Mitigation                                  |
| --------------------- | ------------------------------------------- |
| Bank API downtime     | Cache recent data, show stale indicator     |
| Categorization errors | Allow user corrections, learn from feedback |
| Payment failures      | Implement retry logic, notify user          |
| Regulatory issues     | Partner with regulated entities             |

---

## Next Phase Preview

**Phase 4: Food (Weeks 21-26)**

- Meal planning and recipes
- Grocery shopping automation
- Food delivery integration
- Nutrition tracking
