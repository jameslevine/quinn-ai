// Tests for integrations routes - Happy and Sad paths

// Mock the adapters
const mockGetDbIntegrationsByUserId = jest.fn();
const mockGetDbIntegrationByType = jest.fn();
const mockUpsertDbIntegration = jest.fn();
const mockDeleteDbIntegration = jest.fn();
const mockGetOrCreateDbUser = jest.fn();
const mockGetGmailAuthUrl = jest.fn();

jest.mock("../../adapters/integrations", () => ({
  getDbIntegrationsByUserId: mockGetDbIntegrationsByUserId,
  getDbIntegrationByType: mockGetDbIntegrationByType,
  upsertDbIntegration: mockUpsertDbIntegration,
  deleteDbIntegration: mockDeleteDbIntegration,
}));

jest.mock("../../adapters/users", () => ({
  getOrCreateDbUser: mockGetOrCreateDbUser.mockResolvedValue({
    userId: "test-user-id",
    email: "test@example.com",
  }),
}));

jest.mock("../../lib/gmail", () => ({
  getGmailAuthUrl: mockGetGmailAuthUrl.mockReturnValue("https://accounts.google.com/oauth"),
  exchangeCodeForTokens: jest.fn(),
  getGmailUserEmail: jest.fn(),
}));

// Import routes after mocking
import express from "express";
import { integrationsRouter } from "../../routes/integrations";

const app = express();
app.use(express.json());

// Add middleware to set req.user for all requests
app.use((req, _res, next) => {
  req.user = { sub: "test-user-id", email: "test@example.com" };
  next();
});

app.use("/integrations", integrationsRouter);

const request = require("supertest");

// Helper to create mock integration
const createMockIntegration = (overrides = {}) => ({
  integrationId: "int-123",
  userId: "test-user-id",
  type: "gmail",
  status: "active",
  email: "user@gmail.com",
  accessToken: "access-token",
  refreshToken: "refresh-token",
  tokenExpiry: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastSyncAt: new Date().toISOString(),
  ...overrides,
});

describe("Integrations Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrCreateDbUser.mockResolvedValue({
      userId: "test-user-id",
      email: "test@example.com",
    });
  });

  // ==========================================
  // GET /integrations/gmail/auth - Get Gmail Auth URL
  // ==========================================
  describe("GET /integrations/gmail/auth", () => {
    describe("Happy Paths", () => {
      it("should return 200 with auth URL", async () => {
        const response = await request(app)
          .get("/integrations/gmail/auth")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.authUrl).toBeDefined();
      });
    });

    describe("Sad Paths", () => {
      it("should return 500 when error generating auth URL", async () => {
        mockGetGmailAuthUrl.mockImplementationOnce(() => {
          throw new Error("Failed to generate URL");
        });

        const response = await request(app)
          .get("/integrations/gmail/auth")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
      });
    });
  });

  // ==========================================
  // GET /integrations - Get All Integrations
  // ==========================================
  describe("GET /integrations", () => {
    describe("Happy Paths", () => {
      it("should return 200 with integrations list", async () => {
        const mockIntegrations = [
          createMockIntegration({ type: "gmail" }),
          createMockIntegration({ type: "plaid", integrationId: "int-456" }),
        ];
        mockGetDbIntegrationsByUserId.mockResolvedValueOnce(mockIntegrations);

        const response = await request(app)
          .get("/integrations")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
      });

      it("should return 200 with empty array when no integrations", async () => {
        mockGetDbIntegrationsByUserId.mockResolvedValueOnce([]);

        const response = await request(app)
          .get("/integrations")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
      });

      it("should not expose sensitive data like tokens", async () => {
        const mockIntegrations = [createMockIntegration()];
        mockGetDbIntegrationsByUserId.mockResolvedValueOnce(mockIntegrations);

        const response = await request(app)
          .get("/integrations")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data[0].accessToken).toBeUndefined();
        expect(response.body.data[0].refreshToken).toBeUndefined();
      });
    });

    describe("Sad Paths", () => {
      it("should return 500 when database error occurs", async () => {
        mockGetDbIntegrationsByUserId.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .get("/integrations")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe("INTERNAL_ERROR");
      });
    });
  });

  // ==========================================
  // GET /integrations/:type - Get Integration by Type
  // ==========================================
  describe("GET /integrations/:type", () => {
    describe("Happy Paths", () => {
      it("should return 200 with integration when found", async () => {
        const mockIntegration = createMockIntegration({ type: "gmail" });
        mockGetDbIntegrationByType.mockResolvedValueOnce(mockIntegration);

        const response = await request(app)
          .get("/integrations/gmail")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.type).toBe("gmail");
      });

      it("should not expose sensitive data", async () => {
        const mockIntegration = createMockIntegration();
        mockGetDbIntegrationByType.mockResolvedValueOnce(mockIntegration);

        const response = await request(app)
          .get("/integrations/gmail")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data.accessToken).toBeUndefined();
        expect(response.body.data.refreshToken).toBeUndefined();
      });
    });

    describe("Sad Paths", () => {
      it("should return 404 when integration not found", async () => {
        mockGetDbIntegrationByType.mockResolvedValueOnce(null);

        const response = await request(app)
          .get("/integrations/gmail")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
      });

      it("should return 500 when database error occurs", async () => {
        mockGetDbIntegrationByType.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .get("/integrations/gmail")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
      });
    });
  });

  // ==========================================
  // DELETE /integrations/:type - Disconnect Integration
  // ==========================================
  describe("DELETE /integrations/:type", () => {
    describe("Happy Paths", () => {
      it("should return 200 when integration disconnected", async () => {
        mockDeleteDbIntegration.mockResolvedValueOnce(undefined);

        const response = await request(app)
          .delete("/integrations/gmail")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain("disconnected");
      });

      it("should call deleteDbIntegration with correct params", async () => {
        mockDeleteDbIntegration.mockResolvedValueOnce(undefined);

        await request(app).delete("/integrations/plaid").set("Authorization", "Bearer test-token");

        expect(mockDeleteDbIntegration).toHaveBeenCalledWith("test-user-id", "plaid");
      });
    });

    describe("Sad Paths", () => {
      it("should return 500 when database error occurs", async () => {
        mockDeleteDbIntegration.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .delete("/integrations/gmail")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
      });
    });
  });
});
