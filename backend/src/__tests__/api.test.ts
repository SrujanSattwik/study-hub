import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server";

describe("StudyClub API Integration Tests", () => {
  let accessToken = "";

  describe("POST /auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({
          email: "bob@studyhub.dev",
          password: "StudyHub@2026",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("bob@studyhub.dev");

      // Save token for subsequent tests
      accessToken = res.body.access_token;
    });

    it("should return 401 Unauthorized for invalid password", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({
          email: "bob@studyhub.dev",
          password: "WrongPassword123",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/materials", () => {
    it("should browse materials successfully (public route)", async () => {
      const res = await request(app).get("/api/materials");

      expect(res.status).toBe(200);
      expect(res.body.materials).toBeDefined();
      expect(Array.isArray(res.body.materials)).toBe(true);
    });
  });

  describe("GET /api/community/groups", () => {
    it("should return 401 for unauthenticated group browse", async () => {
      const res = await request(app).get("/api/community/groups");
      expect(res.status).toBe(401);
    });

    it("should fetch study groups successfully when authenticated", async () => {
      const res = await request(app)
        .get("/api/community/groups")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.groups).toBeDefined();
      expect(Array.isArray(res.body.groups)).toBe(true);
    });
  });
});
