/**
 * User-Agent ベースのデバイス判定ユーティリティ
 * サーバーサイドで headers() から取得した User-Agent を渡して使う
 */

/**
 * User-Agent 文字列からモバイル端末かどうかを判定する
 * タブレットは PC 扱い（iPad など画面が大きいデバイスは通常ブラウザ操作を想定）
 */
export function isMobileUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;

  // iPad は PC 扱い（iPadOS 13+ は "Macintosh" を含むが、ここでは明示的に除外）
  if (/iPad/i.test(userAgent)) return false;

  // 一般的なモバイル端末の判定パターン
  return /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari/i.test(
    userAgent
  );
}

/**
 * LIFF URL を生成するヘルパー
 * モバイルの場合は line://app カスタムURLスキーム、PC の場合は通常パスを返す
 *
 * line://app/{liffId}?liff.state={path} 形式は
 * シークレットモードでも LINE アプリを直接起動でき、
 * Universal Link が失敗する問題を回避できる
 */
export function buildLiffUrl(path: string, isMobile: boolean): string {
  if (!isMobile) return path;

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) return path;

  // パスが / で始まることを保証
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `line://app/${liffId}?liff.state=${normalizedPath}`;
}
