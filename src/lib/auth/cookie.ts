import { createHmac } from "crypto";

const COOKIE_SECRET = process.env.LINE_CHANNEL_SECRET!;

/**
 * line_user_id cookieの値に署名を付与
 * 形式: {lineUserId}.{signature}
 */
export function signCookieValue(lineUserId: string): string {
  const signature = createHmac("sha256", COOKIE_SECRET)
    .update(lineUserId)
    .digest("hex")
    .slice(0, 16); // 16文字で十分
  return `${lineUserId}.${signature}`;
}

/**
 * 署名付きcookie値を検証し、lineUserIdを返す
 * 無効な場合はnullを返す
 */
export function verifyCookieValue(cookieValue: string): string | null {
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;

  const [lineUserId, signature] = parts;
  if (!/^U[0-9a-f]{32}$/.test(lineUserId)) return null;

  const expected = createHmac("sha256", COOKIE_SECRET)
    .update(lineUserId)
    .digest("hex")
    .slice(0, 16);

  if (signature !== expected) return null;
  return lineUserId;
}
