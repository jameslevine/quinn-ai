// Tests for approvals routes - Happy and Sad paths
import { createMockAction } from "../utils/test-helpers";

// Mock the adapters
const mockGetDbActionsByStatus = jest.fn();
const mockUpdateDbActionStatus = jest.fn();
const mockGetOrCreateDbUser = jest.fn();

jest.mock("../../adapters/actions", () => ({
  getDbActionsByStatus: mockGetDbActionsByStatus,
  updateDbActionStatus: mockUpdateDbActionStatus,
}));

jest.mock("../../adapters/users", () => ({
  getOrCreateDbUser: mockGetOrCreateDbUser.mockResolvedValue({
    userId: "test-user-id",
    email: "test@example.com",
  }),
}));

// Import routes after mocking
import express from "express";
import { approvalsRouter } from "../../routes/approvals";

const app = express();
app.use(express.json());

// Add middleware to set req.user for all requests
app.use((req, _res, next) => {
  req.user = { sub: "test-user-id", email: "test@example.com" };
  next();
});

app.use("/approvals", approvalsRouter);

const request = require("supertest");

describe("Approvals Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrCreateDbUser.mockResolvedValue({
      userId: "test-user-id",
      email: "test@example.com",
    });
  });

  // ==========================================
  // GET /approvals - Get Pending Approvals
  // ==========================================
  describe("GET /approvals", () => {
    describe("Happy Paths", () => {
      it("should return 200 with pending actions", async () => {
        const mockActions = [
          createMockAction({ actionId: "action-1", status: "pending" }),
          createMockAction({ actionId: "action-2", status: "pending" }),
        ];
        mockGetDbActionsByStatus.mockResolvedValueOnce(mockActions);

        const response = await request(app)
          .get("/approvals")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.meta.count).toBe(2);
      });

      it("should return 200 with empty array when no pending actions", async () => {
        mockGetDbActionsByStatus.mockResolvedValueOnce([]);

        const response = await request(app)
          .get("/approvals")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
        expect(response.body.meta.count).toBe(0);
      });

      it("should respect limit query parameter", async () => {
        mockGetDbActionsByStatus.mockResolvedValueOnce([]);

        await request(app).get("/approvals?limit=10").set("Authorization", "Bearer test-token");

        expect(mockGetDbActionsByStatus).toHaveBeenCalledWith("test-user-id", "pending", 10);
      });
    });

    describe("Sad Paths", () => {
      it("should return 500 when database error occurs", async () => {
        mockGetDbActionsByStatus.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .get("/approvals")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe("INTERNAL_ERROR");
      });
    });
  });

  // ==========================================
  // POST /approvals/:actionId/approve - Approve Action
  // ==========================================
  describe("POST /approvals/:actionId/approve", () => {
    describe("Happy Paths", () => {
      it("should return 200 when action approved", async () => {
        const approvedAction = createMockAction({ actionId: "action-123", status: "approved" });
        mockUpdateDbActionStatus.mockResolvedValueOnce(approvedAction);

        const response = await request(app)
          .post("/approvals/action-123/approve")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe("approved");
        expect(response.body.message).toContain("approved");
      });
    });

    describe("Sad Paths", () => {
      it("should return 404 when action not found", async () => {
        mockUpdateDbActionStatus.mockResolvedValueOnce(null);

        const response = await request(app)
          .post("/approvals/nonexistent-id/approve")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
      });

      it("should return 500 when database error occurs", async () => {
        mockUpdateDbActionStatus.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .post("/approvals/action-123/approve")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
      });
    });
  });

  // ==========================================
  // POST /approvals/:actionId/reject - Reject Action
  // ==========================================
  describe("POST /approvals/:actionId/reject", () => {
    describe("Happy Paths", () => {
      it("should return 200 when action rejected", async () => {
        const rejectedAction = createMockAction({ actionId: "action-123", status: "rejected" });
        mockUpdateDbActionStatus.mockResolvedValueOnce(rejectedAction);

        const response = await request(app)
          .post("/approvals/action-123/reject")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe("rejected");
        expect(response.body.message).toContain("rejected");
      });
    });

    describe("Sad Paths", () => {
      it("should return 404 when action not found", async () => {
        mockUpdateDbActionStatus.mockResolvedValueOnce(null);

        const response = await request(app)
          .post("/approvals/nonexistent-id/reject")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
      });

      it("should return 500 when database error occurs", async () => {
        mockUpdateDbActionStatus.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .post("/approvals/action-123/reject")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
      });
    });
  });

  // ==========================================
  // POST /approvals/bulk/approve - Bulk Approve
  // ==========================================
  describe("POST /approvals/bulk/approve", () => {
    describe("Happy Paths", () => {
      it("should return 200 when all actions approved", async () => {
        mockUpdateDbActionStatus.mockResolvedValue(createMockAction({ status: "approved" }));

        const response = await request(app)
          .post("/approvals/bulk/approve")
          .set("Authorization", "Bearer test-token")
          .send({ actionIds: ["action-1", "action-2", "action-3"] });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.approved).toBe(3);
        expect(response.body.data.failed).toBe(0);
        expect(response.body.data.total).toBe(3);
      });

      it("should return 200 with partial success", async () => {
        mockUpdateDbActionStatus
          .mockResolvedValueOnce(createMockAction({ status: "approved" }))
          .mockRejectedValueOnce(new Error("Failed"))
          .mockResolvedValueOnce(createMockAction({ status: "approved" }));

        const response = await request(app)
          .post("/approvals/bulk/approve")
          .set("Authorization", "Bearer test-token")
          .send({ actionIds: ["action-1", "action-2", "action-3"] });

        expect(response.status).toBe(200);
        expect(response.body.data.approved).toBe(2);
        expect(response.body.data.failed).toBe(1);
      });
    });

    describe("Sad Paths", () => {
      it("should return 400 when actionIds is missing", async () => {
        const response = await request(app)
          .post("/approvals/bulk/approve")
          .set("Authorization", "Bearer test-token")
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
      });

      it("should return 400 when actionIds is empty array", async () => {
        const response = await request(app)
          .post("/approvals/bulk/approve")
          .set("Authorization", "Bearer test-token")
          .send({ actionIds: [] });

        expect(response.status).toBe(400);
      });

      it("should return 400 when actionIds is not an array", async () => {
        const response = await request(app)
          .post("/approvals/bulk/approve")
          .set("Authorization", "Bearer test-token")
          .send({ actionIds: "not-an-array" });

        expect(response.status).toBe(400);
      });
    });
  });

  // ==========================================
  // GET /approvals/stats - Get Approval Statistics
  // ==========================================
  describe("GET /approvals/stats", () => {
    describe("Happy Paths", () => {
      it("should return 200 with stats for all statuses", async () => {
        mockGetDbActionsByStatus
          .mockResolvedValueOnce([createMockAction(), createMockAction()]) // pending
          .mockResolvedValueOnce([createMockAction()]) // approved
          .mockResolvedValueOnce([]) // rejected
          .mockResolvedValueOnce([createMockAction(), createMockAction(), createMockAction()]) // completed
          .mockResolvedValueOnce([]); // failed

        const response = await request(app)
          .get("/approvals/stats")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.pending).toBe(2);
        expect(response.body.data.approved).toBe(1);
        expect(response.body.data.rejected).toBe(0);
        expect(response.body.data.completed).toBe(3);
        expect(response.body.data.failed).toBe(0);
      });
    });

    describe("Sad Paths", () => {
      it("should return 500 when database error occurs", async () => {
        mockGetDbActionsByStatus.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .get("/approvals/stats")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
      });
    });
  });
});
