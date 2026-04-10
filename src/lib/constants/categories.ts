export const PROVIDER_CATEGORIES = [
  { value: "hair", label: "美容・ヘアサロン" },
  { value: "nail", label: "ネイル・まつげ" },
  { value: "esthetic", label: "エステ・リラクゼーション" },
  { value: "bodywork", label: "整体・マッサージ" },
  { value: "fitness", label: "フィットネス・ヨガ" },
  { value: "coaching", label: "コーチング・カウンセリング" },
  { value: "lesson", label: "教育・レッスン" },
  { value: "photo", label: "写真・映像" },
  { value: "other", label: "その他" },
] as const;

export type ProviderCategory = (typeof PROVIDER_CATEGORIES)[number]["value"];

export function getCategoryLabel(value: string | null): string | null {
  if (!value) return null;
  return PROVIDER_CATEGORIES.find((c) => c.value === value)?.label ?? null;
}
