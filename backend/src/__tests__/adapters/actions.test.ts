// Tests for actions adapter
import { createMockAction, createMockDynamoDBResponse } from "../utils/test-helpers";

// Mock the dynamodb module
const mockSend = jest.fn();
jest.mock("../../adapters/dynamodb", () => ({
  dynamodb: {
    send: mockSend,
  },
  TABLE_NAME: "quinn-main-test",
  KEY_PREFIXES: {
    USER: "USER#",
    ACTION: "ACTION#",
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  DeleteCommand: jest.fn(),
  QueryCommand: jest.fn(),
}));

// Import after mocking
import {
  getDbActionById,
  getDbActionsByUserId,
  createDbAction,
  updateDbActionStatus,
  getDbActionsByStatus,
} from "../../adapters/actions";

describe("Actions Adapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDbActionById", () => {
    it("should return an action when found", async () => {
      const mockAction = createMockAction({ actionId: "action-123" });
      mockSend.mockResolvedValueOnce({ Item: mockAction });

      const result = await getDbActionById("user-123", "action-123");

      expect(result).toEqual(mockAction);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("should return null when action not found", async () => {
      mockSend.mockResolvedValueOnce({ Item: null });

      const result = await getDbActionById("user-123", "nonexistent");

      expect(result).toBeNull();
    });

    it("should throw error on database failure", async () => {
      mockSend.mockRejectedValueOnce(new Error("Database error"));

      await expect(getDbActionById("user-123", "action-123")).rejects.toThrow("Database error");
    });
  });

  describe("getDbActionsByUserId", () => {
    it("should return paginated actions for a user", async () => {
      const mockActions = [
        createMockAction({ actionId: "action-1" }),
        createMockAction({ actionId: "action-2" }),
        createMockAction({ actionId: "action-3" }),
      ];
      mockSend.mockResolvedValueOnce(createMockDynamoDBResponse(mockActions));

      const result = await getDbActionsByUserId("user-123");

      expect(result.actions).toHaveLength(3);
      expect(result.actions[0]!.actionId).toBe("action-1");
    });

    it("should return empty array when no actions found", async () => {
      mockSend.mockResolvedValueOnce(createMockDynamoDBResponse([]));

      const result = await getDbActionsByUserId("user-123");

      expect(result.actions).toEqual([]);
    });

    it("should respect limit parameter", async () => {
      const mockActions = [createMockAction({ actionId: "action-1" })];
      mockSend.mockResolvedValueOnce(createMockDynamoDBResponse(mockActions));

      const result = await getDbActionsByUserId("user-123", 10);

      expect(result.actions).toHaveLength(1);
    });
  });

  describe("getDbActionsByStatus", () => {
    it("should return actions filtered by status", async () => {
      const mockActions = [createMockAction({ actionId: "action-1", status: "pending" })];
      mockSend.mockResolvedValueOnce(createMockDynamoDBResponse(mockActions));

      const result = await getDbActionsByStatus("user-123", "pending");

      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe("pending");
    });
  });

  describe("createDbAction", () => {
    it("should create a new action with generated ID", async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await createDbAction(
        "user-123",
        "email",
        "Send email",
        "Send follow-up email",
        "Details here",
        100,
        "GBP",
        { to: "test@example.com" }
      );

      expect(result.actionId).toBeDefined();
      expect(result.userId).toBe("user-123");
      expect(result.type).toBe("email");
      expect(result.title).toBe("Send email");
      expect(result.status).toBe("pending");
      expect(result.createdAt).toBeDefined();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("should create action without optional fields", async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await createDbAction("user-123", "email", "Send email", "Description");

      expect(result.actionId).toBeDefined();
      expect(result.details).toBeUndefined();
      expect(result.amount).toBeUndefined();
    });
  });

  describe("updateDbActionStatus", () => {
    it("should update action status", async () => {
      const updatedAction = createMockAction({ actionId: "action-123", status: "approved" });
      mockSend.mockResolvedValueOnce({ Attributes: updatedAction });

      const result = await updateDbActionStatus("user-123", "action-123", "approved");

      expect(result?.status).toBe("approved");
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("should set completedAt when status is completed", async () => {
      const updatedAction = createMockAction({
        actionId: "action-123",
        status: "completed",
        completedAt: new Date().toISOString(),
      });
      mockSend.mockResolvedValueOnce({ Attributes: updatedAction });

      const result = await updateDbActionStatus("user-123", "action-123", "completed");

      expect(result?.status).toBe("completed");
      expect(result?.completedAt).toBeDefined();
    });
  });
});
