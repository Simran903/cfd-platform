import { beforeAll, describe, expect, test } from "bun:test";
import request from "supertest";

let app: any;
let token = "";

beforeAll(async () => {
  process.env.JWT_SECRET_KEY = "test-secret-key";
  process.env.MAGIC_SECRET_KEY = "test-magic-secret";
  const [appModule, jwtModule] = await Promise.all([
    import("../app"),
    import("../utils/jwt"),
  ]);
  app = appModule.default;
  token = jwtModule.generateToken("user-1");
});

describe("Auth payload validation", () => {
  test("rejects invalid magic verify payload", async () => {
    const response = await request(app).post("/auth/magic/verify").send({
      didToken: "short",
    });

    expect(response.status).toBe(400);
  });
});

describe("Trade endpoint validation", () => {
  test("requires Bearer token for open trade", async () => {
    const response = await request(app).post("/trade/open").send({});
    expect(response.status).toBe(401);
  });

  test("rejects malformed trade payload", async () => {
    const response = await request(app)
      .post("/trade/open")
      .set("Authorization", `Bearer ${token}`)
      .send({
        assetId: "",
        side: "UP_ONLY",
        leverage: 0,
        quantity: -1,
        price: -100,
      });

    expect(response.status).toBe(400);
  });
});
