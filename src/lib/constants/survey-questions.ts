/**
 * カテゴリ別アンケート設問文
 * 設問2（接客・対応）と設問3（仕上がり・品質）のカテゴリ別文言
 */

export const SURVEY_QUESTIONS = {
  // 設問1: 固定（全カテゴリ共通）
  q1: "ご利用いただいたサービスの総合的な満足度を教えてください",

  // 設問2: 接客・対応（カテゴリ別）
  q2: {
    "beauty-hair": "施術中のコミュニケーションはいかがでしたか？",
    "nail-eyelash": "施術中のコミュニケーションはいかがでしたか？",
    "esthetic-relaxation": "施術中のコミュニケーションはいかがでしたか？",
    "seitai-massage": "施術中の対応や説明はいかがでしたか？",
    "fitness-yoga": "インストラクターの指導はいかがでしたか？",
    "coaching-counseling": "セッションでの対話はいかがでしたか？",
    "education-lesson": "講師の教え方はいかがでしたか？",
    "photo-video": "撮影中のコミュニケーションはいかがでしたか？",
    other: "サービス提供者の対応はいかがでしたか？",
  } as Record<string, string>,

  // 設問3: 仕上がり・品質（カテゴリ別）
  q3: {
    "beauty-hair": "仕上がりには満足していますか？",
    "nail-eyelash": "仕上がりには満足していますか？",
    "esthetic-relaxation": "施術の効果は感じられましたか？",
    "seitai-massage": "施術の効果は感じられましたか？",
    "fitness-yoga": "トレーニング内容には満足していますか？",
    "coaching-counseling": "セッションの内容は期待に沿っていましたか？",
    "education-lesson": "レッスンの内容には満足していますか？",
    "photo-video": "撮影の仕上がりには満足していますか？",
    other: "サービスの内容には満足していますか？",
  } as Record<string, string>,

  // 設問4: 固定（全カテゴリ共通）
  q4: "料金に対してサービス内容は妥当だと感じましたか？",

  // 設問5: 固定（全カテゴリ共通）
  q5: "ご意見・ご感想があればお聞かせください",

  // 設問6: 固定（全カテゴリ共通）
  q6: "この事業主をおすすめするコメントがあればお願いします",
} as const;

/**
 * カテゴリに応じた設問2の文言を取得
 */
export function getQ2Text(category: string | null): string {
  return SURVEY_QUESTIONS.q2[category || "other"] || SURVEY_QUESTIONS.q2.other;
}

/**
 * カテゴリに応じた設問3の文言を取得
 */
export function getQ3Text(category: string | null): string {
  return SURVEY_QUESTIONS.q3[category || "other"] || SURVEY_QUESTIONS.q3.other;
}

/**
 * 5段階評価のラベル
 */
export const RATING_LABELS = [
  "", // 0は使わない
  "とても不満",
  "不満",
  "普通",
  "満足",
  "とても満足",
] as const;
