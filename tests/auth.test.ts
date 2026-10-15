import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth";

describe("Authentication & Session Security", () => {
  it("should securely hash a password using scrypt with unique salt", async () => {
    const password = "SuperSecretPassword123!";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(password);
    expect(hash1).toContain(":");
    // Unique salts must produce different hashes for the same password
    expect(hash1).not.toBe(hash2);
  });

  it("should verify correct password and reject incorrect password", async () => {
    const password = "ValidPassword2026";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("WrongPassword", hash);
    expect(isInvalid).toBe(false);
  });

  it("should create and verify valid HMAC session tokens", () => {
    const user = {
      id: "user_test_123",
      email: "test@cloudvault.dev",
      name: "Test User",
      role: "USER",
    };

    const token = createSessionToken(user);
    expect(token).toBeDefined();
    expect(token).toContain(".");

    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(user.id);
    expect(verified?.email).toBe(user.email);
    expect(verified?.name).toBe(user.name);
  });

  it("should reject tampered HMAC session tokens", () => {
    const user = {
      id: "user_test_456",
      email: "tamper@cloudvault.dev",
      name: "Tamper Test",
      role: "USER",
    };

    const token = createSessionToken(user);
    const [payload, signature] = token.split(".");

    // Alter payload
    const tamperedPayload = Buffer.from(
      JSON.stringify({ id: "user_hacked", email: "hacked@vault.com", role: "ADMIN", exp: Date.now() + 10000 })
    ).toString("base64url");

    const tamperedToken = `${tamperedPayload}.${signature}`;
    const verified = verifySessionToken(tamperedToken);
    expect(verified).toBeNull();
  });
});
