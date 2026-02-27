// Tests for calendar routes - Happy and Sad paths

// Mock the adapters and lib
const mockGetOrCreateDbUser = jest.fn();
const mockListCalendars = jest.fn();
const mockGetEvents = jest.fn();
const mockGetEvent = jest.fn();
const mockCreateEvent = jest.fn();
const mockUpdateEvent = jest.fn();
const mockDeleteEvent = jest.fn();
const mockGetTodayEvents = jest.fn();
const mockGetUpcomingEvents = jest.fn();
const mockGetCalendarAuthUrl = jest.fn();
const mockGetFreeBusy = jest.fn();
const mockFindAvailableSlots = jest.fn();
const mockCheckAvailability = jest.fn();

jest.mock("../../adapters/users", () => ({
  getOrCreateDbUser: mockGetOrCreateDbUser.mockResolvedValue({
    userId: "test-user-id",
    email: "test@example.com",
  }),
}));

jest.mock("../../lib/google-calendar", () => ({
  listCalendars: mockListCalendars,
  getEvents: mockGetEvents,
  getEvent: mockGetEvent,
  createEvent: mockCreateEvent,
  updateEvent: mockUpdateEvent,
  deleteEvent: mockDeleteEvent,
  quickAddEvent: jest.fn(),
  getFreeBusy: mockGetFreeBusy,
  findAvailableSlots: mockFindAvailableSlots,
  checkAvailability: mockCheckAvailability,
  getTodayEvents: mockGetTodayEvents,
  getUpcomingEvents: mockGetUpcomingEvents,
  getCalendarAuthUrl: mockGetCalendarAuthUrl.mockReturnValue("https://accounts.google.com/oauth"),
}));

// Import routes after mocking
import express from "express";
import { router as calendarRouter } from "../../routes/calendar";

const app = express();
app.use(express.json());

// Add middleware to set req.user for all requests
app.use((req, _res, next) => {
  req.user = { sub: "test-user-id", email: "test@example.com" };
  next();
});

app.use("/calendar", calendarRouter);

const request = require("supertest");

// Helper functions
const createMockEvent = (overrides = {}) => ({
  id: "event-123",
  summary: "Test Meeting",
  description: "A test meeting",
  start: { dateTime: "2026-02-15T10:00:00Z" },
  end: { dateTime: "2026-02-15T11:00:00Z" },
  location: "Conference Room A",
  ...overrides,
});

describe("Calendar Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrCreateDbUser.mockResolvedValue({
      userId: "test-user-id",
      email: "test@example.com",
    });
  });

  describe("GET /calendar/auth-url", () => {
    it("should return 200 with auth URL", async () => {
      const response = await request(app)
        .get("/calendar/auth-url")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.authUrl).toBeDefined();
    });
  });

  describe("GET /calendar/calendars", () => {
    it("should return 200 with calendars list", async () => {
      mockListCalendars.mockResolvedValueOnce([
        { id: "primary", summary: "Primary Calendar" },
        { id: "work", summary: "Work Calendar" },
      ]);

      const response = await request(app)
        .get("/calendar/calendars")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.calendars).toHaveLength(2);
    });

    it("should return 400 when calendar not connected", async () => {
      mockListCalendars.mockRejectedValueOnce(new Error("Calendar not connected"));

      const response = await request(app)
        .get("/calendar/calendars")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(400);
      expect(response.body.needsAuth).toBe(true);
    });
  });

  describe("GET /calendar/today", () => {
    it("should return 200 with today's events", async () => {
      mockGetTodayEvents.mockResolvedValueOnce([createMockEvent()]);

      const response = await request(app)
        .get("/calendar/today")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(1);
    });
  });

  describe("GET /calendar/upcoming", () => {
    it("should return 200 with upcoming events", async () => {
      mockGetUpcomingEvents.mockResolvedValueOnce([createMockEvent(), createMockEvent()]);

      const response = await request(app)
        .get("/calendar/upcoming")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(2);
    });
  });

  describe("GET /calendar/events", () => {
    it("should return 200 with events list", async () => {
      mockGetEvents.mockResolvedValueOnce([createMockEvent()]);

      const response = await request(app)
        .get("/calendar/events")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(1);
    });
  });

  describe("GET /calendar/events/:eventId", () => {
    it("should return 200 with event details", async () => {
      mockGetEvent.mockResolvedValueOnce(createMockEvent());

      const response = await request(app)
        .get("/calendar/events/event-123")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("event-123");
    });
  });

  describe("POST /calendar/events", () => {
    it("should return 201 when event created", async () => {
      mockCreateEvent.mockResolvedValueOnce(createMockEvent());

      const response = await request(app)
        .post("/calendar/events")
        .set("Authorization", "Bearer test-token")
        .send({
          summary: "New Meeting",
          start: { dateTime: "2026-02-15T10:00:00Z" },
          end: { dateTime: "2026-02-15T11:00:00Z" },
        });

      expect(response.status).toBe(201);
    });

    it("should return 400 when required fields missing", async () => {
      const response = await request(app)
        .post("/calendar/events")
        .set("Authorization", "Bearer test-token")
        .send({ summary: "Meeting" });

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /calendar/events/:eventId", () => {
    it("should return 200 when event updated", async () => {
      mockUpdateEvent.mockResolvedValueOnce(createMockEvent({ summary: "Updated Meeting" }));

      const response = await request(app)
        .patch("/calendar/events/event-123")
        .set("Authorization", "Bearer test-token")
        .send({ summary: "Updated Meeting" });

      expect(response.status).toBe(200);
    });
  });

  describe("DELETE /calendar/events/:eventId", () => {
    it("should return 204 when event deleted", async () => {
      mockDeleteEvent.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .delete("/calendar/events/event-123")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(204);
    });
  });

  describe("POST /calendar/freebusy", () => {
    it("should return 200 with free/busy info", async () => {
      mockGetFreeBusy.mockResolvedValueOnce({
        primary: [{ start: "2026-02-15T10:00:00Z", end: "2026-02-15T11:00:00Z" }],
      });

      const response = await request(app)
        .post("/calendar/freebusy")
        .set("Authorization", "Bearer test-token")
        .send({
          timeMin: "2026-02-15T00:00:00Z",
          timeMax: "2026-02-15T23:59:59Z",
        });

      expect(response.status).toBe(200);
      expect(response.body.freeBusy).toBeDefined();
    });
  });

  describe("POST /calendar/available-slots", () => {
    it("should return 200 with available slots", async () => {
      mockFindAvailableSlots.mockResolvedValueOnce([
        { start: "2026-02-15T14:00:00Z", end: "2026-02-15T15:00:00Z" },
      ]);

      const response = await request(app)
        .post("/calendar/available-slots")
        .set("Authorization", "Bearer test-token")
        .send({
          duration: 60,
          timeMin: "2026-02-15T00:00:00Z",
          timeMax: "2026-02-15T23:59:59Z",
        });

      expect(response.status).toBe(200);
      expect(response.body.slots).toHaveLength(1);
    });
  });

  describe("POST /calendar/check-availability", () => {
    it("should return 200 with availability status", async () => {
      mockCheckAvailability.mockResolvedValueOnce(true);

      const response = await request(app)
        .post("/calendar/check-availability")
        .set("Authorization", "Bearer test-token")
        .send({
          start: "2026-02-15T14:00:00Z",
          end: "2026-02-15T15:00:00Z",
        });

      expect(response.status).toBe(200);
      expect(response.body.available).toBe(true);
    });
  });
});
