import { parsePhoneNumber, isValidPhoneNumber, AsYouType } from "libphonenumber-js";

/**
 * 入力中の電話番号を自動フォーマット（090-1234-5678形式）
 */
export function formatPhoneAsYouType(value: string): string {
  const formatter = new AsYouType("JP");
  return formatter.input(value);
}

/**
 * 日本の電話番号として有効か判定
 */
export function isValidJapanesePhone(value: string): boolean {
  if (!value.trim()) return false;
  return isValidPhoneNumber(value, "JP");
}

/**
 * 電話番号を国内フォーマットに変換（保存・表示用）
 */
export function formatPhone(value: string): string {
  try {
    const phone = parsePhoneNumber(value, "JP");
    return phone ? phone.formatNational() : value;
  } catch {
    return value;
  }
}
