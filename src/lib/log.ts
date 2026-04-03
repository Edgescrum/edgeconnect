// ログユーティリティ
// dev/Vercel: console.log → ターミナル / Vercel Runtime Logs
// 本番スケール時: Splunk / Datadog 等に差し替え

export function log(context: string, message: string, data?: unknown) {
  const ts = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${ts}] [${context}] ${message}`, typeof data === "string" ? data : JSON.stringify(data));
  } else {
    console.log(`[${ts}] [${context}] ${message}`);
  }
}

export function logError(context: string, message: string, error?: unknown) {
  const ts = new Date().toISOString();
  const msg = error instanceof Error ? error.message : String(error ?? "");
  console.error(`[${ts}] [${context}] ERROR: ${message}`, msg);
}
