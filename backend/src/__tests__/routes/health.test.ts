// Tests for health routes

import express from "express";
import { healthRouter } from "../../routes/health";

const app = express();
app.use("/health", healthRouter);

const request = require("supertest");

describe("Health Routes", () => {
  describe("GET /health", () => {
    it("should return 200 with healthy status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("healthy");
    });

    it("should return version", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.version).toBeDefined();
    });

    it("should return timestamp", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.timestamp).toBeDefined();
      // Verify timestamp is valid ISO string
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    });
  });
});
