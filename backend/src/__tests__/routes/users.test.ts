// Tests for users routes - Happy and Sad paths

// Mock the adapters
const mockGetDbUserById = jest.fn();
const mockGetOrCreateDbUser = jest.fn();
const mockUpdateDbUserProfile = jest.fn();
const mockUpdateDbUserSettings = jest.fn();

jest.mock("../../adapters/users", () => ({
  getDbUserById: mockGetDbUserById,
  getOrCreateDbUser: mockGetOrCreateDbUser,
  updateDbUserProfile: mockUpdateDbUserProfile,
  updateDbUserSettings: mockUpdateDbUserSettings,
}));

// Import routes after mocking
import express from "express";
import { usersRouter } from "../../routes/users";

const app = express();
app.use(express.json());

// Add middleware to set req.user for all requests
app.use((req, _res, next) => {
  req.user = { sub: "test-user-id", email: "test@example.com" };
  next();
});

app.use("/users", usersRouter);

const request = require("supertest");

// Helper to create mock user
const createMockUser = (overrides = {}) => ({
  userId: "user-123",
  email: "test@example.com",
  firstName: "John",
  lastName: "Doe",
  settings: {
    notifications: true,
    theme: "light",
    language: "en",
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe("Users Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // GET /users/me - Get Current User
  // ==========================================
  describe("GET /users/me", () => {
    describe("Happy Paths", () => {
      it("should return 200 with user profile", async () => {
        const mockUser = createMockUser();
        mockGetOrCreateDbUser.mockResolvedValueOnce(mockUser);

        const response = await request(app)
          .get("/users/me")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.userId).toBe("user-123");
        expect(response.body.data.email).toBe("test@example.com");
      });

      it("should create user if first login", async () => {
        const newUser = createMockUser({ userId: "new-user-id" });
        mockGetOrCreateDbUser.mockResolvedValueOnce(newUser);

        const response = await request(app)
          .get("/users/me")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(mockGetOrCreateDbUser).toHaveBeenCalledWith("test-user-id", "test@example.com");
      });

      it("should return user settings", async () => {
        const mockUser = createMockUser({
          settings: { notifications: false, theme: "dark", language: "es" },
        });
        mockGetOrCreateDbUser.mockResolvedValueOnce(mockUser);

        const response = await request(app)
          .get("/users/me")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data.settings.theme).toBe("dark");
      });
    });

    describe("Sad Paths", () => {
      it("should return 500 when database error occurs", async () => {
        mockGetOrCreateDbUser.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .get("/users/me")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe("INTERNAL_ERROR");
      });
    });
  });

  // ==========================================
  // GET /users/:userId - Get User by ID
  // ==========================================
  describe("GET /users/:userId", () => {
    describe("Happy Paths", () => {
      it("should return 200 with user when found", async () => {
        const mockUser = createMockUser({ userId: "other-user-123" });
        mockGetDbUserById.mockResolvedValueOnce(mockUser);

        const response = await request(app)
          .get("/users/other-user-123")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data.userId).toBe("other-user-123");
      });

      it("should return limited user data (no settings)", async () => {
        const mockUser = createMockUser();
        mockGetDbUserById.mockResolvedValueOnce(mockUser);

        const response = await request(app)
          .get("/users/user-123")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data.settings).toBeUndefined();
      });
    });

    describe("Sad Paths", () => {
      it("should return 404 when user not found", async () => {
        mockGetDbUserById.mockResolvedValueOnce(null);

        const response = await request(app)
          .get("/users/nonexistent-id")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
      });

      it("should return 500 when database error occurs", async () => {
        mockGetDbUserById.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .get("/users/user-123")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
      });
    });
  });

  // ==========================================
  // PATCH /users/me - Update User Profile
  // ==========================================
  describe("PATCH /users/me", () => {
    describe("Happy Paths", () => {
      it("should return 200 when profile updated", async () => {
        const existingUser = createMockUser();
        const updatedUser = createMockUser({ firstName: "Jane" });
        mockGetOrCreateDbUser.mockResolvedValueOnce(existingUser);
        mockUpdateDbUserProfile.mockResolvedValueOnce(updatedUser);

        const response = await request(app)
          .patch("/users/me")
          .set("Authorization", "Bearer test-token")
          .send({ firstName: "Jane" });

        expect(response.status).toBe(200);
        expect(response.body.data.firstName).toBe("Jane");
      });

      it("should update lastName only", async () => {
        const existingUser = createMockUser();
        const updatedUser = createMockUser({ lastName: "Smith" });
        mockGetOrCreateDbUser.mockResolvedValueOnce(existingUser);
        mockUpdateDbUserProfile.mockResolvedValueOnce(updatedUser);

        const response = await request(app)
          .patch("/users/me")
          .set("Authorization", "Bearer test-token")
          .send({ lastName: "Smith" });

        expect(response.status).toBe(200);
        expect(mockUpdateDbUserProfile).toHaveBeenCalledWith("user-123", { lastName: "Smith" });
      });

      it("should update both firstName and lastName", async () => {
        const existingUser = createMockUser();
        const updatedUser = createMockUser({ firstName: "Jane", lastName: "Smith" });
        mockGetOrCreateDbUser.mockResolvedValueOnce(existingUser);
        mockUpdateDbUserProfile.mockResolvedValueOnce(updatedUser);

        const response = await request(app)
          .patch("/users/me")
          .set("Authorization", "Bearer test-token")
          .send({ firstName: "Jane", lastName: "Smith" });

        expect(response.status).toBe(200);
        expect(response.body.data.firstName).toBe("Jane");
        expect(response.body.data.lastName).toBe("Smith");
      });
    });

    describe("Sad Paths", () => {
      it("should return 500 when database error occurs", async () => {
        mockGetOrCreateDbUser.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .patch("/users/me")
          .set("Authorization", "Bearer test-token")
          .send({ firstName: "Jane" });

        expect(response.status).toBe(500);
      });
    });
  });

  // ==========================================
  // PATCH /users/me/settings - Update User Settings
  // ==========================================
  describe("PATCH /users/me/settings", () => {
    describe("Happy Paths", () => {
      it("should return 200 when settings updated", async () => {
        const existingUser = createMockUser();
        const updatedUser = createMockUser({
          settings: { notifications: false, theme: "light", language: "en" },
        });
        mockGetOrCreateDbUser.mockResolvedValueOnce(existingUser);
        mockUpdateDbUserSettings.mockResolvedValueOnce(updatedUser);

        const response = await request(app)
          .patch("/users/me/settings")
          .set("Authorization", "Bearer test-token")
          .send({ notifications: false });

        expect(response.status).toBe(200);
        expect(response.body.data.settings.notifications).toBe(false);
      });

      it("should update theme setting", async () => {
        const existingUser = createMockUser();
        const updatedUser = createMockUser({
          settings: { notifications: true, theme: "dark", language: "en" },
        });
        mockGetOrCreateDbUser.mockResolvedValueOnce(existingUser);
        mockUpdateDbUserSettings.mockResolvedValueOnce(updatedUser);

        const response = await request(app)
          .patch("/users/me/settings")
          .set("Authorization", "Bearer test-token")
          .send({ theme: "dark" });

        expect(response.status).toBe(200);
        expect(response.body.data.settings.theme).toBe("dark");
      });

      it("should update language setting", async () => {
        const existingUser = createMockUser();
        const updatedUser = createMockUser({
          settings: { notifications: true, theme: "light", language: "es" },
        });
        mockGetOrCreateDbUser.mockResolvedValueOnce(existingUser);
        mockUpdateDbUserSettings.mockResolvedValueOnce(updatedUser);

        const response = await request(app)
          .patch("/users/me/settings")
          .set("Authorization", "Bearer test-token")
          .send({ language: "es" });

        expect(response.status).toBe(200);
        expect(response.body.data.settings.language).toBe("es");
      });
    });

    describe("Sad Paths", () => {
      it("should return 500 when database error occurs", async () => {
        mockGetOrCreateDbUser.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .patch("/users/me/settings")
          .set("Authorization", "Bearer test-token")
          .send({ notifications: false });

        expect(response.status).toBe(500);
      });
    });
  });
});
