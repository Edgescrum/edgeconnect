// アプリのルート・一般的な予約語
const RESERVED_SLUGS = new Set([
  // アプリルート
  "api",
  "bookings",
  "provider",
  "admin",
  "login",
  "logout",
  "register",
  "signup",
  "signin",
  "auth",
  "callback",
  "webhook",
  "cron",
  // 一般的な予約語
  "app",
  "about",
  "help",
  "support",
  "contact",
  "terms",
  "privacy",
  "settings",
  "account",
  "profile",
  "dashboard",
  "home",
  "search",
  "explore",
  "new",
  "edit",
  "delete",
  // ブランド
  "edgeconnect",
  "edge-connect",
  "edgescrum",
  // システム
  "null",
  "undefined",
  "test",
  "demo",
  "example",
  "www",
  "mail",
  "ftp",
  "static",
  "assets",
  "public",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
