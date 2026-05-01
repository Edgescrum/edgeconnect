"use client";

import { useState } from "react";
import { saveProviderSurveySettings, type TemplateQuestion, type ProviderSurveySetting } from "@/lib/actions/survey-settings";
import { Spinner } from "@/components/Spinner";
import { Alert } from "@/components/Alert";

interface SelectedQuestion {
  templateQuestionId: number;
  customText: string;
  originalText: string;
}

export function SurveySettingsClient({
  templateQuestions,
  currentSettings,
  category,
}: {
  templateQuestions: TemplateQuestion[];
  currentSettings: ProviderSurveySetting[];
  category: string;
}) {
  const [selected, setSelected] = useState<SelectedQuestion[]>(
    currentSettings.map((s) => ({
      templateQuestionId: s.templateQuestionId,
      customText: s.customText || "",
      originalText: s.originalText,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelected = (id: number) => selected.some((s) => s.templateQuestionId === id);

  function toggleQuestion(q: TemplateQuestion) {
    if (isSelected(q.id)) {
      setSelected(selected.filter((s) => s.templateQuestionId !== q.id));
    } else {
      if (selected.length >= 3) {
        setError("追加設問は最大3つまでです");
        setTimeout(() => setError(null), 2000);
        return;
      }
      setSelected([...selected, {
        templateQuestionId: q.id,
        customText: "",
        originalText: q.questionText,
      }]);
    }
  }

  function updateCustomText(templateQuestionId: number, text: string) {
    setSelected(selected.map((s) =>
      s.templateQuestionId === templateQuestionId
        ? { ...s, customText: text }
        : s
    ));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await saveProviderSurveySettings(
        selected.map((s, i) => ({
          templateQuestionId: s.templateQuestionId,
          customText: s.customText.trim() || null,
          sortOrder: i + 1,
        }))
      );
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        setError(result.error || "保存に失敗しました");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      "beauty-hair": "美容・ヘアサロン",
      "nail-eyelash": "ネイル・まつエク",
      "esthetic-relaxation": "エステ・リラクゼーション",
      "seitai-massage": "整体・マッサージ",
      "fitness-yoga": "フィットネス・ヨガ",
      "coaching-counseling": "コーチング・カウンセリング",
      "education-lesson": "教育・レッスン",
      "photo-video": "写真・映像",
      other: "その他",
    };
    return labels[cat] || cat;
  };

  return (
    <div className="space-y-6">
      {/* カテゴリ表示 */}
      <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span className="text-sm font-medium">
            カテゴリ: {getCategoryLabel(category)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          業界に合ったテンプレート設問が表示されます
        </p>
      </div>

      {/* 選択中の設問 */}
      {selected.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
              {selected.length}
            </span>
            選択中の追加設問
          </h2>
          {selected.map((s, i) => (
            <div
              key={s.templateQuestionId}
              className="rounded-xl bg-card p-4 ring-1 ring-accent/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-muted">追加設問 {i + 1}</p>
                  <p className="mt-0.5 text-sm font-medium">{s.originalText}</p>
                </div>
                <button
                  onClick={() => setSelected(selected.filter((_, idx) => idx !== i))}
                  className="shrink-0 rounded-lg p-1 text-muted hover:bg-background hover:text-foreground"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="mt-3">
                <label className="text-xs text-muted">文言をカスタマイズ（任意）</label>
                <input
                  type="text"
                  value={s.customText}
                  onChange={(e) => updateCustomText(s.templateQuestionId, e.target.value)}
                  placeholder={s.originalText}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <p className="mt-1 text-[11px] text-muted">回答形式: 5段階評価</p>
            </div>
          ))}
        </section>
      )}

      {/* テンプレート設問一覧 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">テンプレート設問一覧</h2>
        <p className="text-xs text-muted">
          タップして追加設問を選択してください（最大3つ）
        </p>
        <div className="space-y-2">
          {templateQuestions.map((q) => {
            const checked = isSelected(q.id);
            return (
              <button
                key={q.id}
                onClick={() => toggleQuestion(q)}
                className={`flex w-full items-center gap-3 rounded-xl p-4 text-left transition-all ${
                  checked
                    ? "bg-accent/5 ring-2 ring-accent/40"
                    : "bg-card ring-1 ring-border/60 hover:ring-border"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                    checked
                      ? "border-accent bg-accent"
                      : "border-border"
                  }`}
                >
                  {checked && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{q.questionText}</span>
              </button>
            );
          })}
        </div>
      </section>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">保存しました</Alert>}

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-60 active:scale-[0.98]"
      >
        {saving && (
          <Spinner size="sm" className="border-white border-t-transparent" />
        )}
        {saving ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
