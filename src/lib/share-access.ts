import { createHmac, timingSafeEqual } from "crypto";

export function getShareAccessCookieName(token: string) {
  return `share_access_${token}`;
}

function getShareAccessSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required for share links");
  }
  return "local-development-share-secret";
}

export function signShareAccessToken(token: string) {
  const signature = createHmac("sha256", getShareAccessSecret())
    .update(`share:${token}`)
    .digest("base64url");

  return `v1.${signature}`;
}

export function verifyShareAccessToken(token: string, value?: string) {
  if (!value?.startsWith("v1.")) return false;

  const expected = signShareAccessToken(token);
  const actualBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(actualBuffer, expectedBuffer);
}
