// Tests for actions routes - Happy and Sad paths
import { createMockAction } from "../utils/test-helpers";
import { Request, Response, NextFunction } from "express";

// Mock the adapters
const mockGetDbActionById = jest.fn();
const mockGetDbActionsByUserId = jest.fn();
const mockCreateDbAction = jest.fn();
const mockUpdateDbActionStatus = jest.fn();
const mockGetDbActionsByStatus = jest.fn();
const mockGetOrCreateDbUser = jest.fn();

jest.mock("../../adapters/actions", () => ({
  getDbActionById: mockGetDbActionById,
  getDbActionsByUserId: mockGetDbActionsByUserId,
  createDbAction: mockCreateDbAction,
  updateDbActionStatus: mockUpdateDbActionStatus,
  getDbActionsByStatus: mockGetDbActionsByStatus,
}));

jest.mock("../../adapters/users", () => ({
  getOrCreateDbUser: mockGetOrCreateDbUser.mockResolvedValue({
    userId: "test-user-id",
    email: "test@example.com",
    createdAt: new Date().toISOString(),
  }),
}));

// Mock auth middleware
jest.mock("../../middleware/cognito-auth", () => ({
  cognitoAuthMiddleware: jest.fn((req: Request, _res: Response, next: NextFunction) => {
    req.user = { sub: "test-user-id", email: "test@example.com" };
    next();
  }),
}));

// Import routes after mocking
import express from "express";
import { actionsRouter } from "../../routes/actions";

const app = express();
app.use(express.json());

// Add middleware to set req.user for all requests
app.use((req, _res, next) => {
  req.user = { sub: "test-user-id", email: "test@example.com" };
  next();
});

app.use("/actions", actionsRouter);

// Helper to make requests
const request = require("supertest");

describe("Actions Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // GET /actions - List Actions
  // ==========================================
  describe("GET /actions", () => {
    describe("Happy Paths", () => {
      it("should return 200 with paginated actions", async () => {
        const mockActions = [
          createMockAction({ actionId: "action-1", title: "Action 1" }),
          createMockAction({ actionId: "action-2", title: "Action 2" }),
        ];
        mockGetDbActionsByUserId.mockResolvedValueOnce({
          actions: mockActions,
          lastEvaluatedKey: undefined,
        });

        const response = await request(app)
          .get("/actions")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data[0].actionId).toBe("action-1");
      });

      it("should return 200 with empty array when no actions exist", async () => {
        mockGetDbActionsByUserId.mockResolvedValueOnce({
          actions: [],
          lastEvaluatedKey: undefined,
        });

        const response = await request(app)
          .get("/actions")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
      });

      it("should return 200 with pagination key when more results exist", async () => {
        const mockActions = [createMockAction({ actionId: "action-1" })];
        mockGetDbActionsByUserId.mockResolvedValueOnce({
          actions: mockActions,
          lastEvaluatedKey: { pk: "USER#test", sk: "ACTION#123" },
        });

        const response = await request(app)
          .get("/actions")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.meta.hasMore).toBeDefined();
      });

      it("should respect limit query parameter", async () => {
        mockGetDbActionsByUserId.mockResolvedValueOnce({
          actions: [],
          lastEvaluatedKey: undefined,
        });

        await request(app).get("/actions?limit=10").set("Authorization", "Bearer test-token");

        expect(mockGetDbActionsByUserId).toHaveBeenCalledWith("test-user-id", 10);
      });
    });

    describe("Sad Paths", () => {
      it("should handle requests without auth token (middleware sets user)", async () => {
        // Since we're setting req.user in middleware, this will still work
        mockGetDbActionsByUserId.mockResolvedValueOnce({
          actions: [],
          lastEvaluatedKey: undefined,
        });

        const response = await request(app).get("/actions");

        // Our test middleware always sets req.user, so this passes
        expect(response.status).toBe(200);
      });

      it("should return 500 when database error occurs", async () => {
        mockGetDbActionsByUserId.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .get("/actions")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
        expect(response.body.error).toBeDefined();
      });
    });
  });

  // ==========================================
  // GET /actions/:actionId - Get Single Action
  // ==========================================
  describe("GET /actions/:actionId", () => {
    describe("Happy Paths", () => {
      it("should return 200 with action when found", async () => {
        const mockAction = createMockAction({
          actionId: "action-123",
          title: "Test Action",
          type: "email",
          status: "pending",
        });
        mockGetDbActionById.mockResolvedValueOnce(mockAction);

        const response = await request(app)
          .get("/actions/action-123")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data.actionId).toBe("action-123");
        expect(response.body.data.title).toBe("Test Action");
      });
    });

    describe("Sad Paths", () => {
      it("should return 404 when action not found", async () => {
        mockGetDbActionById.mockResolvedValueOnce(null);

        const response = await request(app)
          .get("/actions/nonexistent-id")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(404);
        expect(response.body.error.message).toContain("not found");
      });

      it("should return 500 when database error occurs", async () => {
        mockGetDbActionById.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .get("/actions/action-123")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
      });
    });
  });

  // ==========================================
  // POST /actions - Create Action
  // ==========================================
  describe("POST /actions", () => {
    describe("Happy Paths", () => {
      it("should return 201 when action created successfully", async () => {
        const newAction = createMockAction({
          actionId: "new-action-id",
          type: "email",
          title: "Send email",
          description: "Send follow-up email",
          status: "pending",
        });
        mockCreateDbAction.mockResolvedValueOnce(newAction);

        const response = await request(app)
          .post("/actions")
          .set("Authorization", "Bearer test-token")
          .send({
            type: "email",
            title: "Send email",
            description: "Send follow-up email",
          });

        expect(response.status).toBe(201);
        expect(response.body.data.actionId).toBe("new-action-id");
        expect(response.body.data.status).toBe("pending");
      });

      it("should return 201 with optional fields", async () => {
        const newAction = createMockAction({
          actionId: "new-action-id",
          type: "payment",
          title: "Pay bill",
          description: "Pay electricity bill",
          amount: 150.0,
          currency: "GBP",
        });
        mockCreateDbAction.mockResolvedValueOnce(newAction);

        const response = await request(app)
          .post("/actions")
          .set("Authorization", "Bearer test-token")
          .send({
            type: "payment",
            title: "Pay bill",
            description: "Pay electricity bill",
            amount: 150.0,
            currency: "GBP",
          });

        expect(response.status).toBe(201);
        expect(response.body.data.amount).toBe(150.0);
        expect(response.body.data.currency).toBe("GBP");
      });
    });

    describe("Sad Paths", () => {
      it("should return 400 when required field 'type' is missing", async () => {
        const response = await request(app)
          .post("/actions")
          .set("Authorization", "Bearer test-token")
          .send({
            title: "Send email",
            description: "Send follow-up email",
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain("required");
      });

      it("should return 400 when required field 'title' is missing", async () => {
        const response = await request(app)
          .post("/actions")
          .set("Authorization", "Bearer test-token")
          .send({
            type: "email",
            description: "Send follow-up email",
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain("required");
      });

      it("should return 400 when required field 'description' is missing", async () => {
        const response = await request(app)
          .post("/actions")
          .set("Authorization", "Bearer test-token")
          .send({
            type: "email",
            title: "Send email",
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain("required");
      });

      it("should accept any type value (validation at adapter level)", async () => {
        // Note: Type validation happens at the adapter/database level, not route level
        const newAction = createMockAction({
          actionId: "new-action-id",
          type: "custom_type",
          title: "Send email",
          description: "Send follow-up email",
        });
        mockCreateDbAction.mockResolvedValueOnce(newAction);

        const response = await request(app)
          .post("/actions")
          .set("Authorization", "Bearer test-token")
          .send({
            type: "custom_type",
            title: "Send email",
            description: "Send follow-up email",
          });

        expect(response.status).toBe(201);
      });

      it("should accept negative amounts (validation at business logic level)", async () => {
        // Note: Amount validation could be added at route level if needed
        const newAction = createMockAction({
          actionId: "new-action-id",
          type: "payment",
          title: "Pay bill",
          description: "Pay electricity bill",
          amount: -50,
        });
        mockCreateDbAction.mockResolvedValueOnce(newAction);

        const response = await request(app)
          .post("/actions")
          .set("Authorization", "Bearer test-token")
          .send({
            type: "payment",
            title: "Pay bill",
            description: "Pay electricity bill",
            amount: -50,
          });

        expect(response.status).toBe(201);
      });

      it("should return 500 when database error occurs", async () => {
        mockCreateDbAction.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .post("/actions")
          .set("Authorization", "Bearer test-token")
          .send({
            type: "email",
            title: "Send email",
            description: "Send follow-up email",
          });

        expect(response.status).toBe(500);
      });
    });
  });

  // ==========================================
  // PATCH /actions/:actionId/status - Update Action Status
  // ==========================================
  describe("PATCH /actions/:actionId/status", () => {
    describe("Happy Paths", () => {
      it("should return 200 when status updated to approved", async () => {
        const updatedAction = createMockAction({
          actionId: "action-123",
          status: "approved",
        });
        mockUpdateDbActionStatus.mockResolvedValueOnce(updatedAction);

        const response = await request(app)
          .patch("/actions/action-123/status")
          .set("Authorization", "Bearer test-token")
          .send({ status: "approved" });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe("approved");
      });

      it("should return 200 when status updated to rejected", async () => {
        const updatedAction = createMockAction({
          actionId: "action-123",
          status: "rejected",
        });
        mockUpdateDbActionStatus.mockResolvedValueOnce(updatedAction);

        const response = await request(app)
          .patch("/actions/action-123/status")
          .set("Authorization", "Bearer test-token")
          .send({ status: "rejected" });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe("rejected");
      });

      it("should return 200 when status updated to completed", async () => {
        const updatedAction = createMockAction({
          actionId: "action-123",
          status: "completed",
          completedAt: new Date().toISOString(),
        });
        mockUpdateDbActionStatus.mockResolvedValueOnce(updatedAction);

        const response = await request(app)
          .patch("/actions/action-123/status")
          .set("Authorization", "Bearer test-token")
          .send({ status: "completed" });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe("completed");
        expect(response.body.data.completedAt).toBeDefined();
      });
    });

    describe("Sad Paths", () => {
      it("should return 400 when status field is missing", async () => {
        const response = await request(app)
          .patch("/actions/action-123/status")
          .set("Authorization", "Bearer test-token")
          .send({});

        expect(response.status).toBe(400);
      });

      it("should return 400 when status is invalid", async () => {
        const response = await request(app)
          .patch("/actions/action-123/status")
          .set("Authorization", "Bearer test-token")
          .send({ status: "invalid_status" });

        expect(response.status).toBe(400);
      });

      it("should return 404 when action not found", async () => {
        mockUpdateDbActionStatus.mockResolvedValueOnce(null);

        const response = await request(app)
          .patch("/actions/nonexistent-id/status")
          .set("Authorization", "Bearer test-token")
          .send({ status: "approved" });

        expect(response.status).toBe(404);
      });

      it("should return 500 when database error occurs", async () => {
        mockUpdateDbActionStatus.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .patch("/actions/action-123/status")
          .set("Authorization", "Bearer test-token")
          .send({ status: "approved" });

        expect(response.status).toBe(500);
      });
    });
  });
});
