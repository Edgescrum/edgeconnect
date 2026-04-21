/**
 * リダイレクト先のホワイトリスト
 * 新しいページを追加した場合はここに追加する
 */
const ALLOWED_REDIRECT_PREFIXES = [
  "/home",
  "/bookings",
  "/provider",
  "/p/",
  "/explore",
  "/settings",
  "/favorites",
  "/survey",
];

/**
 * リダイレクト先が安全かどうかを検証し、安全なURLを返す
 * 不正な場合は /home にフォールバック
 */
export function getSafeRedirect(dest: string | null | undefined): string {
  if (!dest || dest === "/") return "/home";

  const isAllowed = ALLOWED_REDIRECT_PREFIXES.some(
    (p) => dest === p || dest.startsWith(p + "/") || dest.startsWith(p + "?")
  );

  return isAllowed ? dest : "/home";
}
