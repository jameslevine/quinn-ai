// Tests for calls routes - Happy and Sad paths

// Mock the adapters and lib
const mockCreateDbCall = jest.fn();
const mockGetDbCallById = jest.fn();
const mockGetDbCallsByUserId = jest.fn();
const mockUpdateDbCallStatus = jest.fn();
const mockUpdateDbCallOutcome = jest.fn();
const mockDeleteDbCall = jest.fn();
const mockGetDbPendingCalls = jest.fn();
const mockMakeCall = jest.fn();
const mockGetCallStatus = jest.fn();
const mockEndCall = jest.fn();

jest.mock("../../adapters/calls", () => ({
  createDbCall: mockCreateDbCall,
  getDbCallById: mockGetDbCallById,
  getDbCallsByUserId: mockGetDbCallsByUserId,
  updateDbCallStatus: mockUpdateDbCallStatus,
  updateDbCallOutcome: mockUpdateDbCallOutcome,
  deleteDbCall: mockDeleteDbCall,
  getDbPendingCalls: mockGetDbPendingCalls,
}));

jest.mock("../../lib/connect", () => ({
  makeCall: mockMakeCall,
  getCallStatus: mockGetCallStatus,
  endCall: mockEndCall,
  synthesizeSpeech: jest
    .fn()
    .mockResolvedValue({ audioStream: Buffer.from("audio"), contentType: "audio/mp3" }),
  createScriptFromTemplate: jest.fn().mockReturnValue("Generated script"),
  SCRIPT_TEMPLATES: {
    appointment_booking: {
      name: "Appointment Booking",
      description: "Book appointments",
      steps: [],
    },
    customer_service: { name: "Customer Service", description: "Customer support", steps: [] },
  },
  AVAILABLE_VOICES: [{ id: "Amy", name: "Amy", language: "en-GB" }],
}));

// Import routes after mocking
import express from "express";
import { router as callsRouter } from "../../routes/calls";

const app = express();
app.use(express.json());

// Add middleware to set req.user for all requests
app.use((req, _res, next) => {
  req.user = { sub: "test-user-id", email: "test@example.com" };
  next();
});

app.use("/calls", callsRouter);

const request = require("supertest");

// Helper functions
const createMockCall = (overrides = {}) => ({
  callId: "call-123",
  userId: "test-user-id",
  to: "+1234567890",
  purpose: "Book appointment",
  scriptType: "appointment_booking",
  script: "Hello, I would like to book an appointment...",
  status: "pending",
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("Calls Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /calls", () => {
    it("should return 201 when call created", async () => {
      mockCreateDbCall.mockResolvedValueOnce(createMockCall());

      const response = await request(app)
        .post("/calls")
        .set("Authorization", "Bearer test-token")
        .send({
          to: "+1234567890",
          purpose: "Book appointment",
          scriptType: "appointment_booking",
        });

      expect(response.status).toBe(201);
    });

    it("should return 400 when required fields missing", async () => {
      const response = await request(app)
        .post("/calls")
        .set("Authorization", "Bearer test-token")
        .send({ to: "+1234567890" });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /calls", () => {
    it("should return 200 with calls list", async () => {
      mockGetDbCallsByUserId.mockResolvedValueOnce({
        calls: [createMockCall()],
        lastEvaluatedKey: undefined,
      });

      const response = await request(app).get("/calls").set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.calls).toHaveLength(1);
    });
  });

  describe("GET /calls/pending", () => {
    it("should return 200 with pending calls", async () => {
      mockGetDbPendingCalls.mockResolvedValueOnce([createMockCall({ status: "pending" })]);

      const response = await request(app)
        .get("/calls/pending")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.calls).toHaveLength(1);
    });
  });

  describe("GET /calls/:callId", () => {
    it("should return 200 with call details", async () => {
      mockGetDbCallById.mockResolvedValueOnce(createMockCall());

      const response = await request(app)
        .get("/calls/call-123")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.callId).toBe("call-123");
    });

    it("should return 404 when call not found", async () => {
      mockGetDbCallById.mockResolvedValueOnce(null);

      const response = await request(app)
        .get("/calls/nonexistent")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(404);
    });
  });

  describe("POST /calls/:callId/approve", () => {
    it("should return 200 when call approved", async () => {
      mockGetDbCallById.mockResolvedValueOnce(createMockCall({ status: "pending" }));
      mockUpdateDbCallStatus.mockResolvedValueOnce(createMockCall({ status: "approved" }));
      mockMakeCall.mockResolvedValueOnce({ contactId: "contact-123" });

      const response = await request(app)
        .post("/calls/call-123/approve")
        .set("Authorization", "Bearer test-token")
        .send({ approved: true });

      expect(response.status).toBe(200);
    });

    it("should return 200 when call rejected", async () => {
      mockGetDbCallById.mockResolvedValueOnce(createMockCall({ status: "pending" }));
      mockUpdateDbCallStatus.mockResolvedValueOnce(createMockCall({ status: "cancelled" }));

      const response = await request(app)
        .post("/calls/call-123/approve")
        .set("Authorization", "Bearer test-token")
        .send({ approved: false });

      expect(response.status).toBe(200);
    });

    it("should return 404 when call not found", async () => {
      mockGetDbCallById.mockResolvedValueOnce(null);

      const response = await request(app)
        .post("/calls/call-123/approve")
        .set("Authorization", "Bearer test-token")
        .send({ approved: true });

      expect(response.status).toBe(404);
    });

    it("should return 400 when call is not pending", async () => {
      mockGetDbCallById.mockResolvedValueOnce(createMockCall({ status: "completed" }));

      const response = await request(app)
        .post("/calls/call-123/approve")
        .set("Authorization", "Bearer test-token")
        .send({ approved: true });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /calls/:callId/end", () => {
    it("should return 200 when call ended", async () => {
      mockGetDbCallById.mockResolvedValueOnce(
        createMockCall({ status: "in_progress", contactId: "contact-123" })
      );
      mockEndCall.mockResolvedValueOnce(undefined);
      mockUpdateDbCallStatus.mockResolvedValueOnce(createMockCall({ status: "completed" }));

      const response = await request(app)
        .post("/calls/call-123/end")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
    });

    it("should return 400 when call has no active contact", async () => {
      mockGetDbCallById.mockResolvedValueOnce(createMockCall({ status: "pending" }));

      const response = await request(app)
        .post("/calls/call-123/end")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(400);
    });
  });

  describe("GET /calls/:callId/status", () => {
    it("should return 200 with call status", async () => {
      mockGetDbCallById.mockResolvedValueOnce(
        createMockCall({ status: "in_progress", contactId: "contact-123" })
      );
      mockGetCallStatus.mockResolvedValueOnce({ status: "in-progress" });

      const response = await request(app)
        .get("/calls/call-123/status")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
    });
  });

  describe("DELETE /calls/:callId", () => {
    it("should return 204 when call deleted", async () => {
      mockGetDbCallById.mockResolvedValueOnce(createMockCall({ status: "completed" }));
      mockDeleteDbCall.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .delete("/calls/call-123")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(204);
    });

    it("should return 400 when trying to delete in-progress call", async () => {
      mockGetDbCallById.mockResolvedValueOnce(createMockCall({ status: "in_progress" }));

      const response = await request(app)
        .delete("/calls/call-123")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(400);
    });
  });

  describe("GET /calls/scripts/templates", () => {
    it("should return 200 with script templates", async () => {
      const response = await request(app)
        .get("/calls/scripts/templates")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.templates).toBeDefined();
    });
  });

  describe("GET /calls/voices", () => {
    it("should return 200 with available voices", async () => {
      const response = await request(app)
        .get("/calls/voices")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.voices).toBeDefined();
    });
  });
});
