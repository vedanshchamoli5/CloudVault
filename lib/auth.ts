import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const AUTH_SECRET = process.env.AUTH_SECRET || "cloudvault_default_secure_session_secret_32chars!";
const SESSION_COOKIE_NAME = "cv_session";
const SESSION_MAX_AGE_SECONDS = parseInt(process.env.SESSION_MAX_AGE_SECONDS || "604800", 10); // 7 days

/**
 * Hashes a plaintext password using crypto.scrypt with a random salt.
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Verifies a password against the stored scrypt salt:hash string.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) {
      return resolve(false);
    }

    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        const keyBuffer = Buffer.from(key, "hex");
        resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
      } catch {
        resolve(false);
      }
    });
  });
}

/**
 * Creates an HMAC-signed session token.
 */
export function createSessionToken(user: SessionUser): string {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: expires,
  });

  const base64Payload = Buffer.from(payload).toString("base64url");
  const hmac = crypto.createHmac("sha256", AUTH_SECRET);
  hmac.update(base64Payload);
  const signature = hmac.digest("base64url");

  return `${base64Payload}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-signed session token.
 */
export function verifySessionToken(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [base64Payload, signature] = parts;
    const hmac = crypto.createHmac("sha256", AUTH_SECRET);
    hmac.update(base64Payload);
    const expectedSignature = hmac.digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payloadJson = Buffer.from(base64Payload, "base64url").toString("utf-8");
    const data = JSON.parse(payloadJson);

    if (Date.now() > data.exp) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
    };
  } catch {
    return null;
  }
}

/**
 * Reads and verifies the current session from incoming cookies.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Attaches the session cookie to the response.
 */
export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    maxAge: SESSION_MAX_AGE_SECONDS,
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
