import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

export const hashToken = (token: string, secret = "") => createHmac("sha256", secret).update(token).digest("hex");
export const randomToken = () => randomBytes(48).toString("base64url");

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, saltValue, hashValue] = stored.split("$");
  if (algorithm !== "scrypt" || !saltValue || !hashValue) return false;
  const expected = Buffer.from(hashValue, "base64url");
  const actual = (await scrypt(password, Buffer.from(saltValue, "base64url"), expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function signAccessToken(payload: object, secret: string) {
  const body = encode(payload);
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyAccessToken<T>(token: string, secret: string): T | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", secret).update(body).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try { return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T; } catch { return null; }
}

export function assertStrongPassword(password: string) {
  return password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

export function readCookie(header: string | undefined, name: string) {
  if (!header) return undefined;
  for (const item of header.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return undefined;
}
