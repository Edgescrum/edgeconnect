/**
 * PeCo ブランド定義
 * ロゴの「人を繋げる」コンセプトに基づく、温かみと丸みのあるデザイン
 *
 * 変更時はここを修正するだけで全体に反映される
 */

// --- カラーパレット ---
export const brand = {
  // プライマリ（ロゴのサーモンピンク）
  primary: "#f08c79",
  primaryLight: "#f5a899",
  primaryBg: "#fef2f0",
  primaryDark: "#d97365",

  // セカンダリ（ロゴのモーヴ）
  secondary: "#be7c7b",
  secondaryLight: "#d4a0a0",
  secondaryBg: "#f9f0f0",

  // 背景・カード
  background: "#faf8f6",
  card: "#ffffff",
  cardHover: "#fefcfa",

  // テキスト
  foreground: "#3d2c2c",
  muted: "#8c7a7a",

  // ボーダー
  border: "#ece4e0",
  borderLight: "#f5efec",

  // 成功（LINE緑）
  success: "#06C755",

  // フォント
  fontFamily: "'DM Sans', 'Noto Sans JP', system-ui, sans-serif",
} as const;

// CSS変数用のマッピング
export const cssVariables = {
  "--background": brand.background,
  "--foreground": brand.foreground,
  "--accent": brand.primary,
  "--accent-light": brand.primaryLight,
  "--accent-bg": brand.primaryBg,
  "--accent-dark": brand.primaryDark,
  "--success": brand.success,
  "--card": brand.card,
  "--border": brand.border,
  "--muted": brand.muted,
} as const;
