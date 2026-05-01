/**
 * NGワードフィルタ
 * 正規表現ベースで暴言・差別用語等をブロック
 * すり抜けた場合は事業主が非表示で対応
 */

const NG_PATTERNS: RegExp[] = [
  // 暴言・侮辱
  /死ね/,
  /殺す/,
  /ころす/,
  /バカ/i,
  /ばか/,
  /アホ/i,
  /あほ/,
  /クソ/i,
  /くそ/,
  /ゴミ/,
  /ごみ(?!箱)/,
  /カス/,
  /ブス/,
  /ぶす/,
  /デブ/,
  /でぶ/,
  /キモい/,
  /きもい/,
  /うざい/,
  /消えろ/,
  /失せろ/,

  // 差別用語
  /障害者/,
  /ガイジ/,
  /がいじ/,
  /チョン/,
  /シナ人/,

  // 脅迫
  /訴える/,
  /裁判/,
  /弁護士/,
  /警察に言う/,
  /通報/,

  // スパム・広告
  /https?:\/\//,
  /www\./,
  /LINE@/,
  /@line/i,

  // 性的表現
  /セックス/,
  /エロ/,
  /えろ/,
];

/**
 * テキストにNGワードが含まれているかチェック
 * @returns true = NGワードあり（非公開にすべき）
 */
export function containsNgWord(text: string): boolean {
  if (!text) return false;
  return NG_PATTERNS.some((pattern) => pattern.test(text));
}
