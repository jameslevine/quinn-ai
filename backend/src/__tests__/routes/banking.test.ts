// Tests for banking routes - Happy and Sad paths

// Mock the adapters
const mockGetOrCreateDbUser = jest.fn();
const mockCreateDbBankConnection = jest.fn();
const mockGetDbBankConnectionsByUserId = jest.fn();
const mockGetDbBankConnectionById = jest.fn();
const mockDeleteDbBankConnection = jest.fn();
const mockGetDbBankAccountsByUserId = jest.fn();
const mockGetDbTransactionsByUserId = jest.fn();

jest.mock("../../adapters/users", () => ({
  getOrCreateDbUser: mockGetOrCreateDbUser.mockResolvedValue({
    userId: "test-user-id",
    email: "test@example.com",
  }),
}));

jest.mock("../../adapters/banking", () => ({
  createDbBankConnection: mockCreateDbBankConnection,
  getDbBankConnectionsByUserId: mockGetDbBankConnectionsByUserId,
  getDbBankConnectionById: mockGetDbBankConnectionById,
  deleteDbBankConnection: mockDeleteDbBankConnection,
  updateDbBankConnectionSyncCursor: jest.fn(),
  upsertDbBankAccount: jest.fn(),
  getDbBankAccountsByUserId: mockGetDbBankAccountsByUserId,
  upsertDbTransaction: jest.fn(),
  getDbTransactionsByUserId: mockGetDbTransactionsByUserId,
  deleteDbTransactionByPlaidId: jest.fn(),
}));

jest.mock("../../lib/plaid", () => ({
  createLinkToken: jest.fn().mockResolvedValue("link-token-123"),
  exchangePublicToken: jest
    .fn()
    .mockResolvedValue({ accessToken: "access-123", itemId: "item-123" }),
  getAccounts: jest.fn().mockResolvedValue([]),
  getInstitution: jest.fn().mockResolvedValue({ name: "Test Bank", logo: "logo.png" }),
  removeItem: jest.fn(),
  syncTransactions: jest
    .fn()
    .mockResolvedValue({ added: [], modified: [], removed: [], hasMore: false }),
}));

// Import routes after mocking
import express from "express";
import { bankingRouter } from "../../routes/banking";

const app = express();
app.use(express.json());

// Add middleware to set req.user for all requests
app.use((req, _res, next) => {
  req.user = { sub: "test-user-id", email: "test@example.com" };
  next();
});

app.use("/banking", bankingRouter);

const request = require("supertest");

// Helper functions
const createMockConnection = (overrides = {}) => ({
  connectionId: "conn-123",
  userId: "test-user-id",
  plaidItemId: "item-123",
  accessToken: "access-token",
  institutionId: "inst-123",
  institutionName: "Test Bank",
  institutionLogo: "logo.png",
  status: "active",
  createdAt: new Date().toISOString(),
  ...overrides,
});

const createMockAccount = (overrides = {}) => ({
  accountId: "acct-123",
  userId: "test-user-id",
  connectionId: "conn-123",
  plaidAccountId: "plaid-acct-123",
  name: "Checking Account",
  type: "depository",
  subtype: "checking",
  currentBalance: 1000,
  availableBalance: 950,
  isHidden: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const createMockTransaction = (overrides = {}) => ({
  transactionId: "tx-123",
  userId: "test-user-id",
  accountId: "acct-123",
  plaidTransactionId: "plaid-tx-123",
  amount: 50,
  date: "2026-02-10",
  name: "Coffee Shop",
  category: ["Food and Drink", "Coffee"],
  pending: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("Banking Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrCreateDbUser.mockResolvedValue({
      userId: "test-user-id",
      email: "test@example.com",
    });
  });

  describe("POST /banking/link-token", () => {
    it("should return 200 with link token", async () => {
      const response = await request(app)
        .post("/banking/link-token")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.linkToken).toBeDefined();
    });
  });

  describe("POST /banking/connect", () => {
    it("should return 200 when bank connected", async () => {
      mockCreateDbBankConnection.mockResolvedValueOnce(createMockConnection());

      const response = await request(app)
        .post("/banking/connect")
        .set("Authorization", "Bearer test-token")
        .send({ publicToken: "public-token-123", institutionId: "inst-123" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 400 when publicToken is missing", async () => {
      const response = await request(app)
        .post("/banking/connect")
        .set("Authorization", "Bearer test-token")
        .send({ institutionId: "inst-123" });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /banking/connections", () => {
    it("should return 200 with connections list", async () => {
      mockGetDbBankConnectionsByUserId.mockResolvedValueOnce([createMockConnection()]);

      const response = await request(app)
        .get("/banking/connections")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe("DELETE /banking/connections/:connectionId", () => {
    it("should return 200 when bank disconnected", async () => {
      mockGetDbBankConnectionById.mockResolvedValueOnce(createMockConnection());
      mockDeleteDbBankConnection.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .delete("/banking/connections/conn-123")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
    });

    it("should return 404 when connection not found", async () => {
      mockGetDbBankConnectionById.mockResolvedValueOnce(null);

      const response = await request(app)
        .delete("/banking/connections/nonexistent")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(404);
    });
  });

  describe("GET /banking/accounts", () => {
    it("should return 200 with accounts list", async () => {
      mockGetDbBankAccountsByUserId.mockResolvedValueOnce([createMockAccount()]);

      const response = await request(app)
        .get("/banking/accounts")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe("GET /banking/transactions", () => {
    it("should return 200 with transactions list", async () => {
      mockGetDbTransactionsByUserId.mockResolvedValueOnce([createMockTransaction()]);

      const response = await request(app)
        .get("/banking/transactions")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe("GET /banking/spending/summary", () => {
    it("should return 200 with spending summary", async () => {
      mockGetDbTransactionsByUserId.mockResolvedValueOnce([
        createMockTransaction({ amount: 50, category: ["Food and Drink"] }),
        createMockTransaction({ amount: 100, category: ["Shopping"] }),
      ]);

      const response = await request(app)
        .get("/banking/spending/summary")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.data.totalSpending).toBe(150);
    });
  });
});
