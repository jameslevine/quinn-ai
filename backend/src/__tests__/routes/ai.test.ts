// Tests for AI routes - Happy and Sad paths

// Mock the adapters and lib
const mockSuggestActions = jest.fn();
const mockCreateActionFromNL = jest.fn();
const mockGenerateEmailDraft = jest.fn();
const mockGenerateEmailReply = jest.fn();
const mockCreateDbAction = jest.fn();
const mockGetDbUserById = jest.fn();
const mockGetDbActionsByUserId = jest.fn();

jest.mock("../../lib/ai", () => ({
  suggestActions: mockSuggestActions,
  createActionFromNL: mockCreateActionFromNL,
  generateEmailDraft: mockGenerateEmailDraft,
  generateEmailReply: mockGenerateEmailReply,
}));

jest.mock("../../adapters/actions", () => ({
  createDbAction: mockCreateDbAction,
  getDbActionsByUserId: mockGetDbActionsByUserId.mockResolvedValue({ actions: [] }),
}));

jest.mock("../../adapters/users", () => ({
  getDbUserById: mockGetDbUserById.mockResolvedValue({
    userId: "test-user-id",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
  }),
}));

// Import routes after mocking
import express from "express";
import { router as aiRouter } from "../../routes/ai";

const app = express();
app.use(express.json());

// Add middleware to set req.user for all requests
app.use((req, _res, next) => {
  req.user = { sub: "test-user-id", email: "test@example.com" };
  next();
});

app.use("/ai", aiRouter);

const request = require("supertest");

describe("AI Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDbUserById.mockResolvedValue({
      userId: "test-user-id",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
    });
    mockGetDbActionsByUserId.mockResolvedValue({ actions: [] });
  });

  describe("POST /ai/suggest-actions", () => {
    it("should return 200 with action suggestions", async () => {
      mockSuggestActions.mockResolvedValueOnce([
        { type: "email", title: "Send follow-up email", priority: "high" },
        { type: "call", title: "Schedule call with client", priority: "medium" },
      ]);

      const response = await request(app)
        .post("/ai/suggest-actions")
        .set("Authorization", "Bearer test-token")
        .send({
          conversationHistory: [{ role: "user", content: "I need to follow up with the client" }],
        });

      expect(response.status).toBe(200);
      expect(response.body.suggestions).toHaveLength(2);
    });

    it("should return 400 when conversationHistory is missing", async () => {
      const response = await request(app)
        .post("/ai/suggest-actions")
        .set("Authorization", "Bearer test-token")
        .send({});

      expect(response.status).toBe(400);
    });

    it("should return 500 when AI error occurs", async () => {
      mockSuggestActions.mockRejectedValueOnce(new Error("AI error"));

      const response = await request(app)
        .post("/ai/suggest-actions")
        .set("Authorization", "Bearer test-token")
        .send({
          conversationHistory: [{ role: "user", content: "Test" }],
        });

      expect(response.status).toBe(500);
    });
  });

  describe("POST /ai/create-action", () => {
    it("should return 200 with parsed action", async () => {
      mockCreateActionFromNL.mockResolvedValueOnce({
        type: "email",
        title: "Send email to John",
        description: "Follow up on project status",
      });

      const response = await request(app)
        .post("/ai/create-action")
        .set("Authorization", "Bearer test-token")
        .send({ request: "Send an email to John about the project" });

      expect(response.status).toBe(200);
      expect(response.body.parsed).toBeDefined();
    });

    it("should return 201 when autoCreate is true", async () => {
      mockCreateActionFromNL.mockResolvedValueOnce({
        type: "email",
        title: "Send email to John",
        description: "Follow up on project status",
      });
      mockCreateDbAction.mockResolvedValueOnce({
        actionId: "action-123",
        type: "email",
        title: "Send email to John",
      });

      const response = await request(app)
        .post("/ai/create-action")
        .set("Authorization", "Bearer test-token")
        .send({ request: "Send an email to John", autoCreate: true });

      expect(response.status).toBe(201);
      expect(response.body.action).toBeDefined();
    });

    it("should return 400 when request is missing", async () => {
      const response = await request(app)
        .post("/ai/create-action")
        .set("Authorization", "Bearer test-token")
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("POST /ai/email/draft", () => {
    it("should return 200 with email draft", async () => {
      mockGenerateEmailDraft.mockResolvedValueOnce({
        to: "john@example.com",
        subject: "Project Update",
        body: "Hi John, I wanted to update you on the project...",
      });

      const response = await request(app)
        .post("/ai/email/draft")
        .set("Authorization", "Bearer test-token")
        .send({ prompt: "Write an email to John about the project update" });

      expect(response.status).toBe(200);
      expect(response.body.draft).toBeDefined();
      expect(response.body.draft.subject).toBeDefined();
    });

    it("should accept tone parameter", async () => {
      mockGenerateEmailDraft.mockResolvedValueOnce({
        to: "john@example.com",
        subject: "Project Update",
        body: "Dear John...",
      });

      const response = await request(app)
        .post("/ai/email/draft")
        .set("Authorization", "Bearer test-token")
        .send({ prompt: "Write an email to John", tone: "formal" });

      expect(response.status).toBe(200);
    });

    it("should return 400 when prompt is missing", async () => {
      const response = await request(app)
        .post("/ai/email/draft")
        .set("Authorization", "Bearer test-token")
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("POST /ai/email/reply", () => {
    it("should return 200 with email reply", async () => {
      mockGenerateEmailReply.mockResolvedValueOnce({
        to: "sender@example.com",
        subject: "Re: Meeting Request",
        body: "Thank you for reaching out...",
      });

      const response = await request(app)
        .post("/ai/email/reply")
        .set("Authorization", "Bearer test-token")
        .send({
          originalEmail: {
            from: "sender@example.com",
            subject: "Meeting Request",
            body: "Can we schedule a meeting?",
          },
          instructions: "Accept the meeting and suggest Tuesday",
        });

      expect(response.status).toBe(200);
      expect(response.body.draft).toBeDefined();
    });

    it("should return 400 when originalEmail is missing", async () => {
      const response = await request(app)
        .post("/ai/email/reply")
        .set("Authorization", "Bearer test-token")
        .send({ instructions: "Reply positively" });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /ai/email/improve", () => {
    it("should return 200 with improved draft", async () => {
      mockGenerateEmailDraft.mockResolvedValueOnce({
        to: "john@example.com",
        subject: "Project Update - Action Required",
        body: "Hi John, I hope this email finds you well...",
      });

      const response = await request(app)
        .post("/ai/email/improve")
        .set("Authorization", "Bearer test-token")
        .send({
          draft: {
            to: "john@example.com",
            subject: "Project Update",
            body: "Hi John, here is the update.",
          },
          feedback: "Make it more professional and add a call to action",
        });

      expect(response.status).toBe(200);
      expect(response.body.draft).toBeDefined();
    });

    it("should return 400 when draft is missing", async () => {
      const response = await request(app)
        .post("/ai/email/improve")
        .set("Authorization", "Bearer test-token")
        .send({ feedback: "Make it better" });

      expect(response.status).toBe(400);
    });
  });
});
