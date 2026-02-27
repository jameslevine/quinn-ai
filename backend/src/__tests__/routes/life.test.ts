// Tests for life routes - Happy and Sad paths

// Mock the adapters
const mockCreateContact = jest.fn();
const mockGetContacts = jest.fn();
const mockGetContact = jest.fn();
const mockUpdateContact = jest.fn();
const mockDeleteContact = jest.fn();
const mockCreateSocialEvent = jest.fn();
const mockGetSocialEvents = jest.fn();
const mockGetSocialEvent = jest.fn();
const mockUpdateSocialEvent = jest.fn();
const mockDeleteSocialEvent = jest.fn();
const mockCreateAppointment = jest.fn();
const mockGetAppointments = jest.fn();
const mockGetAppointment = jest.fn();
const mockUpdateAppointment = jest.fn();
const mockDeleteAppointment = jest.fn();
const mockCreateTravelPlan = jest.fn();
const mockGetTravelPlans = jest.fn();
const mockGetTravelPlan = jest.fn();
const mockUpdateTravelPlan = jest.fn();
const mockDeleteTravelPlan = jest.fn();
const mockCreateGift = jest.fn();
const mockGetGifts = jest.fn();
const mockGetGift = jest.fn();
const mockUpdateGift = jest.fn();
const mockDeleteGift = jest.fn();

jest.mock("../../adapters/life", () => ({
  createContact: mockCreateContact,
  getContacts: mockGetContacts,
  getContact: mockGetContact,
  updateContact: mockUpdateContact,
  deleteContact: mockDeleteContact,
  createSocialEvent: mockCreateSocialEvent,
  getSocialEvents: mockGetSocialEvents,
  getSocialEvent: mockGetSocialEvent,
  updateSocialEvent: mockUpdateSocialEvent,
  deleteSocialEvent: mockDeleteSocialEvent,
  createAppointment: mockCreateAppointment,
  getAppointments: mockGetAppointments,
  getAppointment: mockGetAppointment,
  updateAppointment: mockUpdateAppointment,
  deleteAppointment: mockDeleteAppointment,
  createTravelPlan: mockCreateTravelPlan,
  getTravelPlans: mockGetTravelPlans,
  getTravelPlan: mockGetTravelPlan,
  updateTravelPlan: mockUpdateTravelPlan,
  deleteTravelPlan: mockDeleteTravelPlan,
  createGift: mockCreateGift,
  getGifts: mockGetGifts,
  getGift: mockGetGift,
  updateGift: mockUpdateGift,
  deleteGift: mockDeleteGift,
}));

// Import routes after mocking
import express from "express";
import { router as lifeRouter } from "../../routes/life";

const app = express();
app.use(express.json());

// Add middleware to set req.user for all requests
app.use((req, _res, next) => {
  req.user = { sub: "test-user-id", email: "test@example.com" };
  next();
});

app.use("/life", lifeRouter);

const request = require("supertest");

// Helper functions
const createMockContact = (overrides = {}) => ({
  contactId: "contact-123",
  userId: "test-user-id",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  createdAt: new Date().toISOString(),
  ...overrides,
});

const createMockEvent = (overrides = {}) => ({
  eventId: "event-123",
  userId: "test-user-id",
  title: "Birthday Party",
  date: "2026-03-15",
  location: "123 Main St",
  createdAt: new Date().toISOString(),
  ...overrides,
});

const createMockAppointment = (overrides = {}) => ({
  appointmentId: "appt-123",
  userId: "test-user-id",
  title: "Doctor Visit",
  date: "2026-02-20",
  time: "10:00",
  createdAt: new Date().toISOString(),
  ...overrides,
});

const createMockTravelPlan = (overrides = {}) => ({
  travelPlanId: "travel-123",
  userId: "test-user-id",
  destination: "Paris",
  startDate: "2026-06-01",
  endDate: "2026-06-07",
  createdAt: new Date().toISOString(),
  ...overrides,
});

const createMockGift = (overrides = {}) => ({
  giftId: "gift-123",
  userId: "test-user-id",
  recipient: "Jane Doe",
  occasion: "Birthday",
  item: "Watch",
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("Life Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // CONTACTS
  // ==========================================
  describe("Contacts", () => {
    describe("GET /life/contacts", () => {
      it("should return 200 with contacts list", async () => {
        mockGetContacts.mockResolvedValueOnce([createMockContact()]);

        const response = await request(app)
          .get("/life/contacts")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
      });

      it("should return 500 when database error occurs", async () => {
        mockGetContacts.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .get("/life/contacts")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
      });
    });

    describe("GET /life/contacts/:contactId", () => {
      it("should return 200 with contact when found", async () => {
        mockGetContact.mockResolvedValueOnce(createMockContact());

        const response = await request(app)
          .get("/life/contacts/contact-123")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.contactId).toBe("contact-123");
      });

      it("should return 404 when contact not found", async () => {
        mockGetContact.mockResolvedValueOnce(null);

        const response = await request(app)
          .get("/life/contacts/nonexistent")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(404);
      });
    });

    describe("POST /life/contacts", () => {
      it("should return 201 when contact created", async () => {
        mockCreateContact.mockResolvedValueOnce(createMockContact());

        const response = await request(app)
          .post("/life/contacts")
          .set("Authorization", "Bearer test-token")
          .send({ name: "John Doe", email: "john@example.com" });

        expect(response.status).toBe(201);
      });
    });

    describe("PATCH /life/contacts/:contactId", () => {
      it("should return 200 when contact updated", async () => {
        mockUpdateContact.mockResolvedValueOnce(createMockContact({ name: "Jane Doe" }));

        const response = await request(app)
          .patch("/life/contacts/contact-123")
          .set("Authorization", "Bearer test-token")
          .send({ name: "Jane Doe" });

        expect(response.status).toBe(200);
      });

      it("should return 404 when contact not found", async () => {
        mockUpdateContact.mockResolvedValueOnce(null);

        const response = await request(app)
          .patch("/life/contacts/nonexistent")
          .set("Authorization", "Bearer test-token")
          .send({ name: "Jane" });

        expect(response.status).toBe(404);
      });
    });

    describe("DELETE /life/contacts/:contactId", () => {
      it("should return 204 when contact deleted", async () => {
        mockDeleteContact.mockResolvedValueOnce(undefined);

        const response = await request(app)
          .delete("/life/contacts/contact-123")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(204);
      });
    });
  });

  // ==========================================
  // SOCIAL EVENTS
  // ==========================================
  describe("Social Events", () => {
    describe("GET /life/events", () => {
      it("should return 200 with events list", async () => {
        mockGetSocialEvents.mockResolvedValueOnce([createMockEvent()]);

        const response = await request(app)
          .get("/life/events")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
      });
    });

    describe("POST /life/events", () => {
      it("should return 201 when event created", async () => {
        mockCreateSocialEvent.mockResolvedValueOnce(createMockEvent());

        const response = await request(app)
          .post("/life/events")
          .set("Authorization", "Bearer test-token")
          .send({ title: "Birthday Party", date: "2026-03-15" });

        expect(response.status).toBe(201);
      });
    });

    describe("DELETE /life/events/:eventId", () => {
      it("should return 204 when event deleted", async () => {
        mockDeleteSocialEvent.mockResolvedValueOnce(undefined);

        const response = await request(app)
          .delete("/life/events/event-123")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(204);
      });
    });
  });

  // ==========================================
  // APPOINTMENTS
  // ==========================================
  describe("Appointments", () => {
    describe("GET /life/appointments", () => {
      it("should return 200 with appointments list", async () => {
        mockGetAppointments.mockResolvedValueOnce([createMockAppointment()]);

        const response = await request(app)
          .get("/life/appointments")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
      });
    });

    describe("POST /life/appointments", () => {
      it("should return 201 when appointment created", async () => {
        mockCreateAppointment.mockResolvedValueOnce(createMockAppointment());

        const response = await request(app)
          .post("/life/appointments")
          .set("Authorization", "Bearer test-token")
          .send({ title: "Doctor Visit", date: "2026-02-20" });

        expect(response.status).toBe(201);
      });
    });

    describe("DELETE /life/appointments/:appointmentId", () => {
      it("should return 204 when appointment deleted", async () => {
        mockDeleteAppointment.mockResolvedValueOnce(undefined);

        const response = await request(app)
          .delete("/life/appointments/appt-123")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(204);
      });
    });
  });

  // ==========================================
  // TRAVEL PLANS
  // ==========================================
  describe("Travel Plans", () => {
    describe("GET /life/travel", () => {
      it("should return 200 with travel plans list", async () => {
        mockGetTravelPlans.mockResolvedValueOnce([createMockTravelPlan()]);

        const response = await request(app)
          .get("/life/travel")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
      });
    });

    describe("POST /life/travel", () => {
      it("should return 201 when travel plan created", async () => {
        mockCreateTravelPlan.mockResolvedValueOnce(createMockTravelPlan());

        const response = await request(app)
          .post("/life/travel")
          .set("Authorization", "Bearer test-token")
          .send({ destination: "Paris", startDate: "2026-06-01" });

        expect(response.status).toBe(201);
      });
    });

    describe("DELETE /life/travel/:travelPlanId", () => {
      it("should return 204 when travel plan deleted", async () => {
        mockDeleteTravelPlan.mockResolvedValueOnce(undefined);

        const response = await request(app)
          .delete("/life/travel/travel-123")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(204);
      });
    });
  });

  // ==========================================
  // GIFTS
  // ==========================================
  describe("Gifts", () => {
    describe("GET /life/gifts", () => {
      it("should return 200 with gifts list", async () => {
        mockGetGifts.mockResolvedValueOnce([createMockGift()]);

        const response = await request(app)
          .get("/life/gifts")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
      });
    });

    describe("POST /life/gifts", () => {
      it("should return 201 when gift created", async () => {
        mockCreateGift.mockResolvedValueOnce(createMockGift());

        const response = await request(app)
          .post("/life/gifts")
          .set("Authorization", "Bearer test-token")
          .send({ recipient: "Jane", occasion: "Birthday", item: "Watch" });

        expect(response.status).toBe(201);
      });
    });

    describe("DELETE /life/gifts/:giftId", () => {
      it("should return 204 when gift deleted", async () => {
        mockDeleteGift.mockResolvedValueOnce(undefined);

        const response = await request(app)
          .delete("/life/gifts/gift-123")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(204);
      });
    });
  });
});
