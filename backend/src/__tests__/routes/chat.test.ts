// Tests for chat routes - Happy and Sad paths

// Mock the adapters
const mockCreateDbConversation = jest.fn();
const mockGetDbConversationById = jest.fn();
const mockGetDbConversationsByUserId = jest.fn();
const mockGetDbConversationWithMessages = jest.fn();
const mockUpdateDbConversationTitle = jest.fn();
const mockDeleteDbConversation = jest.fn();
const mockAddDbMessage = jest.fn();
const mockGetDbMessagesByConversationId = jest.fn();
const mockGetDbRecentMessages = jest.fn();

jest.mock("../../adapters/conversations", () => ({
  createDbConversation: mockCreateDbConversation,
  getDbConversationById: mockGetDbConversationById,
  getDbConversationsByUserId: mockGetDbConversationsByUserId,
  getDbConversationWithMessages: mockGetDbConversationWithMessages,
  updateDbConversationTitle: mockUpdateDbConversationTitle,
  deleteDbConversation: mockDeleteDbConversation,
  addDbMessage: mockAddDbMessage,
  getDbMessagesByConversationId: mockGetDbMessagesByConversationId,
  getDbRecentMessages: mockGetDbRecentMessages,
}));

const mockGetDbUserById = jest.fn();
jest.mock("../../adapters/users", () => ({
  getDbUserById: mockGetDbUserById,
}));

const mockGetDbActionsByUserId = jest.fn();
jest.mock("../../adapters/actions", () => ({
  getDbActionsByUserId: mockGetDbActionsByUserId,
}));

const mockChat = jest.fn();
const mockChatWithFunctions = jest.fn();
const mockBuildConversationContext = jest.fn();
jest.mock("../../lib/ai", () => ({
  chat: mockChat,
  chatWithFunctions: mockChatWithFunctions,
  buildConversationContext: mockBuildConversationContext,
}));

// Import routes after mocking
import express from "express";
import { router as chatRouter } from "../../routes/chat";

const app = express();
app.use(express.json());

// Add middleware to set req.user for all requests
app.use((req, _res, next) => {
  req.user = { sub: "test-user-id", email: "test@example.com" };
  next();
});

app.use("/chat", chatRouter);

const request = require("supertest");

// Helper to create mock conversation
const createMockConversation = (overrides = {}) => ({
  conversationId: "conv-123",
  userId: "test-user-id",
  title: "Test Conversation",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Helper to create mock message
const createMockMessage = (overrides = {}) => ({
  messageId: "msg-123",
  conversationId: "conv-123",
  userId: "test-user-id",
  role: "user",
  content: "Hello, Quinn!",
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("Chat Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDbUserById.mockResolvedValue({ userId: "test-user-id", firstName: "John" });
    mockGetDbActionsByUserId.mockResolvedValue({ actions: [] });
    mockBuildConversationContext.mockReturnValue("System prompt");
  });

  // ==========================================
  // POST /chat/conversations - Create Conversation
  // ==========================================
  describe("POST /chat/conversations", () => {
    describe("Happy Paths", () => {
      it("should return 201 when conversation created without message", async () => {
        const mockConv = createMockConversation();
        mockCreateDbConversation.mockResolvedValueOnce(mockConv);

        const response = await request(app)
          .post("/chat/conversations")
          .set("Authorization", "Bearer test-token")
          .send({ title: "Test Conversation" });

        expect(response.status).toBe(201);
        expect(response.body.conversation.conversationId).toBe("conv-123");
        expect(response.body.messages).toEqual([]);
      });

      it("should return 201 with AI response when message provided", async () => {
        const mockConv = createMockConversation();
        const userMsg = createMockMessage({ role: "user", content: "Hello" });
        const assistantMsg = createMockMessage({
          messageId: "msg-456",
          role: "assistant",
          content: "Hi there!",
        });

        mockCreateDbConversation.mockResolvedValueOnce(mockConv);
        mockAddDbMessage.mockResolvedValueOnce(userMsg);
        mockChatWithFunctions.mockResolvedValueOnce({ content: "Hi there!", suggestions: [] });
        mockAddDbMessage.mockResolvedValueOnce(assistantMsg);

        const response = await request(app)
          .post("/chat/conversations")
          .set("Authorization", "Bearer test-token")
          .send({ title: "Test", message: "Hello" });

        expect(response.status).toBe(201);
        expect(response.body.messages).toHaveLength(2);
      });
    });

    describe("Sad Paths", () => {
      it("should return 500 when database error occurs", async () => {
        mockCreateDbConversation.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .post("/chat/conversations")
          .set("Authorization", "Bearer test-token")
          .send({ title: "Test" });

        expect(response.status).toBe(500);
      });
    });
  });

  // ==========================================
  // GET /chat/conversations - List Conversations
  // ==========================================
  describe("GET /chat/conversations", () => {
    describe("Happy Paths", () => {
      it("should return 200 with conversations list", async () => {
        const mockConvs = [
          createMockConversation({ conversationId: "conv-1" }),
          createMockConversation({ conversationId: "conv-2" }),
        ];
        mockGetDbConversationsByUserId.mockResolvedValueOnce({
          conversations: mockConvs,
          lastEvaluatedKey: undefined,
        });

        const response = await request(app)
          .get("/chat/conversations")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.conversations).toHaveLength(2);
      });

      it("should return 200 with empty array when no conversations", async () => {
        mockGetDbConversationsByUserId.mockResolvedValueOnce({
          conversations: [],
          lastEvaluatedKey: undefined,
        });

        const response = await request(app)
          .get("/chat/conversations")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.conversations).toEqual([]);
      });

      it("should return nextCursor when more results exist", async () => {
        mockGetDbConversationsByUserId.mockResolvedValueOnce({
          conversations: [createMockConversation()],
          lastEvaluatedKey: { pk: "USER#test", sk: "CONV#123" },
        });

        const response = await request(app)
          .get("/chat/conversations")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.nextCursor).toBeDefined();
      });
    });

    describe("Sad Paths", () => {
      it("should return 500 when database error occurs", async () => {
        mockGetDbConversationsByUserId.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .get("/chat/conversations")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
      });
    });
  });

  // ==========================================
  // GET /chat/conversations/:conversationId - Get Conversation
  // ==========================================
  describe("GET /chat/conversations/:conversationId", () => {
    describe("Happy Paths", () => {
      it("should return 200 with conversation and messages", async () => {
        const mockConv = {
          ...createMockConversation(),
          messages: [createMockMessage()],
        };
        mockGetDbConversationWithMessages.mockResolvedValueOnce(mockConv);

        const response = await request(app)
          .get("/chat/conversations/550e8400-e29b-41d4-a716-446655440000")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.conversationId).toBe("conv-123");
      });
    });

    describe("Sad Paths", () => {
      it("should return 404 when conversation not found", async () => {
        mockGetDbConversationWithMessages.mockResolvedValueOnce(null);

        const response = await request(app)
          .get("/chat/conversations/550e8400-e29b-41d4-a716-446655440000")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(404);
      });

      it("should return 400 when conversationId is invalid", async () => {
        const response = await request(app)
          .get("/chat/conversations/invalid-id")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(400);
      });
    });
  });

  // ==========================================
  // PATCH /chat/conversations/:conversationId - Update Title
  // ==========================================
  describe("PATCH /chat/conversations/:conversationId", () => {
    describe("Happy Paths", () => {
      it("should return 200 when title updated", async () => {
        const updatedConv = createMockConversation({ title: "New Title" });
        mockUpdateDbConversationTitle.mockResolvedValueOnce(updatedConv);

        const response = await request(app)
          .patch("/chat/conversations/550e8400-e29b-41d4-a716-446655440000")
          .set("Authorization", "Bearer test-token")
          .send({ title: "New Title" });

        expect(response.status).toBe(200);
        expect(response.body.title).toBe("New Title");
      });
    });

    describe("Sad Paths", () => {
      it("should return 404 when conversation not found", async () => {
        mockUpdateDbConversationTitle.mockResolvedValueOnce(null);

        const response = await request(app)
          .patch("/chat/conversations/550e8400-e29b-41d4-a716-446655440000")
          .set("Authorization", "Bearer test-token")
          .send({ title: "New Title" });

        expect(response.status).toBe(404);
      });

      it("should return 400 when title is missing", async () => {
        const response = await request(app)
          .patch("/chat/conversations/550e8400-e29b-41d4-a716-446655440000")
          .set("Authorization", "Bearer test-token")
          .send({});

        expect(response.status).toBe(400);
      });
    });
  });

  // ==========================================
  // DELETE /chat/conversations/:conversationId - Delete Conversation
  // ==========================================
  describe("DELETE /chat/conversations/:conversationId", () => {
    describe("Happy Paths", () => {
      it("should return 204 when conversation deleted", async () => {
        mockGetDbConversationById.mockResolvedValueOnce(createMockConversation());
        mockDeleteDbConversation.mockResolvedValueOnce(undefined);

        const response = await request(app)
          .delete("/chat/conversations/550e8400-e29b-41d4-a716-446655440000")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(204);
      });
    });

    describe("Sad Paths", () => {
      it("should return 404 when conversation not found", async () => {
        mockGetDbConversationById.mockResolvedValueOnce(null);

        const response = await request(app)
          .delete("/chat/conversations/550e8400-e29b-41d4-a716-446655440000")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(404);
      });
    });
  });

  // ==========================================
  // POST /chat/conversations/:conversationId/messages - Send Message
  // ==========================================
  describe("POST /chat/conversations/:conversationId/messages", () => {
    describe("Happy Paths", () => {
      it("should return 201 with user and assistant messages", async () => {
        const userMsg = createMockMessage({ role: "user", content: "Hello" });
        const assistantMsg = createMockMessage({
          messageId: "msg-456",
          role: "assistant",
          content: "Hi!",
        });

        mockGetDbConversationById.mockResolvedValueOnce(createMockConversation());
        mockAddDbMessage.mockResolvedValueOnce(userMsg);
        mockGetDbRecentMessages.mockResolvedValueOnce([userMsg]);
        mockChatWithFunctions.mockResolvedValueOnce({ content: "Hi!", suggestions: [] });
        mockAddDbMessage.mockResolvedValueOnce(assistantMsg);

        const response = await request(app)
          .post("/chat/conversations/550e8400-e29b-41d4-a716-446655440000/messages")
          .set("Authorization", "Bearer test-token")
          .send({ content: "Hello" });

        expect(response.status).toBe(201);
        expect(response.body.userMessage).toBeDefined();
        expect(response.body.assistantMessage).toBeDefined();
      });
    });

    describe("Sad Paths", () => {
      it("should return 404 when conversation not found", async () => {
        mockGetDbConversationById.mockResolvedValueOnce(null);

        const response = await request(app)
          .post("/chat/conversations/550e8400-e29b-41d4-a716-446655440000/messages")
          .set("Authorization", "Bearer test-token")
          .send({ content: "Hello" });

        expect(response.status).toBe(404);
      });

      it("should return 400 when content is missing", async () => {
        const response = await request(app)
          .post("/chat/conversations/550e8400-e29b-41d4-a716-446655440000/messages")
          .set("Authorization", "Bearer test-token")
          .send({});

        expect(response.status).toBe(400);
      });
    });
  });

  // ==========================================
  // GET /chat/conversations/:conversationId/messages - Get Messages
  // ==========================================
  describe("GET /chat/conversations/:conversationId/messages", () => {
    describe("Happy Paths", () => {
      it("should return 200 with messages list", async () => {
        const mockMsgs = [
          createMockMessage({ messageId: "msg-1" }),
          createMockMessage({ messageId: "msg-2" }),
        ];
        mockGetDbConversationById.mockResolvedValueOnce(createMockConversation());
        mockGetDbMessagesByConversationId.mockResolvedValueOnce({
          messages: mockMsgs,
          lastEvaluatedKey: undefined,
        });

        const response = await request(app)
          .get("/chat/conversations/550e8400-e29b-41d4-a716-446655440000/messages")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.messages).toHaveLength(2);
      });
    });

    describe("Sad Paths", () => {
      it("should return 404 when conversation not found", async () => {
        mockGetDbConversationById.mockResolvedValueOnce(null);

        const response = await request(app)
          .get("/chat/conversations/550e8400-e29b-41d4-a716-446655440000/messages")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(404);
      });
    });
  });

  // ==========================================
  // POST /chat/quick - Quick Chat
  // ==========================================
  describe("POST /chat/quick", () => {
    describe("Happy Paths", () => {
      it("should return 200 with AI response", async () => {
        mockChat.mockResolvedValueOnce({ content: "Hello!", suggestions: [] });

        const response = await request(app)
          .post("/chat/quick")
          .set("Authorization", "Bearer test-token")
          .send({ content: "Hi" });

        expect(response.status).toBe(200);
        expect(response.body.response).toBe("Hello!");
      });
    });

    describe("Sad Paths", () => {
      it("should return 400 when content is missing", async () => {
        const response = await request(app)
          .post("/chat/quick")
          .set("Authorization", "Bearer test-token")
          .send({});

        expect(response.status).toBe(400);
      });

      it("should return 500 when AI error occurs", async () => {
        mockChat.mockRejectedValueOnce(new Error("AI error"));

        const response = await request(app)
          .post("/chat/quick")
          .set("Authorization", "Bearer test-token")
          .send({ content: "Hi" });

        expect(response.status).toBe(500);
      });
    });
  });
});
