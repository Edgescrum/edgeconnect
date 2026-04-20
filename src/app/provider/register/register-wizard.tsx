"use client";

import { useState, useEffect } from "react";
import { registerProvider, checkSlugAvailability } from "@/lib/actions/provider";
import { Toggle } from "@/components/Toggle";
import type { Category } from "@/lib/constants/categories";
import { CategorySelector } from "@/components/CategorySelector";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STEPS = [
  { title: "はじめに", icon: "👋" },
  { title: "お店の名前", icon: "🏠" },
  { title: "予約ページURL", icon: "🔗" },
  { title: "連絡先・プロフィール", icon: "✨" },
  { title: "完了", icon: "🎉" },
];

export function RegisterWizard({ categories: PROVIDER_CATEGORIES }: { categories: Category[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // キーボードの開閉検知（フォーカスベース）
  useEffect(() => {
    function onFocus() { setKeyboardOpen(true); }
    function onBlur() { setKeyboardOpen(false); }
    document.addEventListener("focusin", (e) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") onFocus();
    });
    document.addEventListener("focusout", onBlur);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "reserved">("idle");
  const [bio, setBio] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [lineEnabled, setLineEnabled] = useState(true);
  const [lineId, setLineId] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [phoneEnabled, setPhoneEnabled] = useState(false);
  const [contactPhone, setContactPhone] = useState("");

  async function handleSlugChange(value: string) {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(normalized);
    if (!normalized || normalized.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const result = await checkSlugAvailability(normalized);
    setSlugStatus(result.available ? "available" : result.reason === "reserved" ? "reserved" : "taken");
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      // lineUserIdはcookieから取得（formDataには含めない）
      formData.set("slug", slug);
      formData.set("name", name);
      formData.set("bio", bio);
      if (category) formData.set("category", category);
      if (lineEnabled && lineId) {
        formData.set("line_id", lineId);
      }
      if (emailEnabled && contactEmail) {
        formData.set("contact_email", contactEmail);
      }
      if (phoneEnabled && contactPhone) {
        formData.set("contact_phone", contactPhone);
      }
      if (iconFile) formData.set("icon", iconFile);
      await registerProvider(formData);
      // sessionStorageのキャッシュをクリア（roleがproviderに変わったため再取得させる）
      sessionStorage.removeItem("peco_user");
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  const canNext = () => {
    switch (step) {
      case 1: return name.trim().length > 0 && category !== "";
      case 2: return slug.length >= 3 && slugStatus === "available";
      case 3: {
        if (!lineEnabled && !emailEnabled && !phoneEnabled) return false;
        if (lineEnabled && !lineId.trim()) return false;
        if (emailEnabled && !contactEmail.includes("@")) return false;
        if (phoneEnabled && !contactPhone.trim()) return false;
        return true;
      }
      default: return true;
    }
  };

  return (
    <>
    {/* --- PC版: 1ページフォーム --- */}
    <main className="hidden min-h-screen bg-background sm:block">
      <div className="mx-auto max-w-2xl px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold">予約ページを作成</h1>
          <p className="mt-2 text-muted">必要な情報を入力して、あなた専用の予約ページを作りましょう。</p>
        </div>

        {step < 4 ? (
          <div className="mt-10 space-y-8">
            {/* お店の名前 */}
            <section className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">1</div>
                <h2 className="text-lg font-bold">お店の名前</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">屋号・サービス名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例：山田サロン"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">カテゴリ <span className="text-red-500">*</span></label>
                  <CategorySelector
                    categories={PROVIDER_CATEGORIES}
                    selected={category ? [category] : []}
                    onChange={(sel) => setCategory(sel[0] || "")}
                    placeholder="カテゴリを選択"
                  />
                </div>
              </div>
            </section>

            {/* 予約ページURL */}
            <section className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">2</div>
                <h2 className="text-lg font-bold">予約ページURL</h2>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="mb-2 text-xs text-muted">あなたのURL</p>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted">peco.app/p/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    placeholder="your-name"
                    className="min-w-0 flex-1 border-b border-accent bg-transparent py-1 font-semibold text-accent"
                  />
                </div>
              </div>
              <div className="mt-2 h-5">
                {slugStatus === "checking" && <p className="text-xs text-muted">確認中...</p>}
                {slugStatus === "available" && <p className="text-xs text-green-600">このURLは利用可能です</p>}
                {slugStatus === "taken" && <p className="text-xs text-red-500">このURLは既に使われています</p>}
                {slugStatus === "reserved" && <p className="text-xs text-red-500">このURLは使用できません</p>}
              </div>
              <p className="mt-2 text-xs text-muted">半角英数字とハイフン（-）が使えます。3文字以上で入力してください。</p>
            </section>

            {/* 連絡先・プロフィール */}
            <section className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">3</div>
                <h2 className="text-lg font-bold">連絡先・プロフィール</h2>
              </div>
              <div className="space-y-5">
                {/* LINE */}
                <div className={`rounded-2xl p-4 ring-1 transition-colors ${
                  lineEnabled ? "bg-green-50/50 ring-success/30" : "bg-background ring-border"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#06C755">
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold">LINEで連絡</p>
                    </div>
                    <Toggle checked={lineEnabled} onChange={setLineEnabled} ariaLabel="LINEで連絡を有効にする" />
                  </div>
                  {lineEnabled && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-sm text-muted">@</span>
                        <input
                          type="text"
                          value={lineId}
                          onChange={(e) => setLineId(e.target.value.replace(/^@/, ""))}
                          placeholder="your-line-id"
                          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-muted">LINEアプリの設定 &gt; プロフィール &gt; LINE IDで確認できます</p>
                    </div>
                  )}
                </div>

                {/* メール */}
                <div className={`rounded-2xl p-4 ring-1 transition-colors ${
                  emailEnabled ? "bg-blue-50/50 ring-blue-300/30" : "bg-background ring-border"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold">メールで連絡</p>
                    </div>
                    <Toggle checked={emailEnabled} onChange={setEmailEnabled} activeColor="bg-success" ariaLabel="メールで連絡を有効にする" />
                  </div>
                  {emailEnabled && (
                    <div className="mt-3">
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* 電話 */}
                <div className={`rounded-2xl p-4 ring-1 transition-colors ${
                  phoneEnabled ? "bg-orange-50/50 ring-orange-300/30" : "bg-background ring-border"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold">電話で連絡</p>
                    </div>
                    <Toggle checked={phoneEnabled} onChange={setPhoneEnabled} activeColor="bg-success" ariaLabel="電話で連絡を有効にする" />
                  </div>
                  {phoneEnabled && (
                    <div className="mt-3">
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="090-1234-5678"
                        inputMode="tel"
                        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    自己紹介 <span className="text-xs text-muted">（任意）</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="例：表参道で10年の経験を持つヘアスタイリストです。"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    アイコン画像 <span className="text-xs text-muted">（任意）</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-background px-4 py-4 hover:bg-accent-bg transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-bg text-accent">
                      {iconFile ? "✓" : "+"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{iconFile ? iconFile.name : "画像を選択"}</p>
                      <p className="text-xs text-muted">お客さまに表示されるアイコンです</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !name.trim() || !category || slug.length < 3 || slugStatus !== "available" || (!lineEnabled && !emailEnabled && !phoneEnabled) || (lineEnabled && !lineId.trim()) || (emailEnabled && !contactEmail.includes("@")) || (phoneEnabled && !contactPhone.trim())}
              className="w-full rounded-xl bg-accent py-4 text-lg font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {submitting ? "処理中..." : "登録を完了する"}
            </button>
          </div>
        ) : (
          /* 完了画面 */
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="text-6xl">🎉</div>
            <h1 className="mt-6 text-3xl font-bold">登録完了！</h1>
            <p className="mt-3 text-lg text-muted">
              予約ページが作成されました。<br />QRコードをお客さまに共有しましょう。
            </p>
            <a
              href="/provider"
              className="mt-8 inline-block rounded-xl bg-accent px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-accent/25 hover:opacity-90 transition-opacity"
            >
              管理画面へ進む
            </a>
          </div>
        )}
      </div>
    </main>

    {/* --- モバイル版: ステップウィザード --- */}
    <main className="flex flex-col bg-background sm:hidden">
      {/* Progress bar */}
      {step < 4 && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-1">
            {STEPS.slice(0, 4).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-accent" : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            ステップ {step + 1} / 4
          </p>
        </div>
      )}

      <div className="px-4">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="pt-4">
            <h1 className="text-xl font-bold">
              {STEPS[0].icon} 予約ページを作成
            </h1>
            <p className="mt-2 text-sm text-muted">
              3ステップで完了します
            </p>

            <div className="mt-5 space-y-3">
              {[
                { step: "1", title: "お店の名前を決める" },
                { step: "2", title: "予約ページのURLを決める" },
                { step: "3", title: "連絡先・プロフィールを設定" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-bg text-xs font-bold text-accent">
                    {item.step}
                  </div>
                  <p className="text-sm font-medium">{item.title}</p>
                </div>
              ))}
            </div>

            <div className={`fixed bottom-0 left-0 right-0 bg-background px-4 pb-8 pt-3 transition-opacity ${keyboardOpen ? "pointer-events-none opacity-0" : ""}`}>
              <div className="mx-auto max-w-lg">
                <button
                  onClick={() => setStep(1)}
                  className="w-full rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]"
                >
                  はじめる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Business Name */}
        {step === 1 && (
          <div className="pt-4 pb-24">
            <p className="text-4xl">{STEPS[1].icon}</p>
            <h1 className="mt-4 text-2xl font-bold">お店の名前</h1>
            <p className="mt-2 text-sm text-muted">
              お客さまに表示されるあなたのお店・サービスの名前です。
              あとから変更できます。
            </p>
            <div className="mt-6">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && canNext()) { e.preventDefault(); (e.target as HTMLInputElement).blur(); setStep(2); } }}
                enterKeyHint="next"
                placeholder="例：山田サロン"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-lg"
              />
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">カテゴリ</p>
              <CategorySelector
                categories={PROVIDER_CATEGORIES}
                selected={category ? [category] : []}
                onChange={(sel) => setCategory(sel[0] || "")}
                placeholder="カテゴリを選択"
              />
            </div>

            <div className={`fixed bottom-0 left-0 right-0 bg-background px-4 pb-8 pt-3 transition-opacity ${keyboardOpen ? "pointer-events-none opacity-0" : ""}`}>
              <div className="mx-auto flex max-w-lg gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="rounded-xl border border-border px-6 py-3.5 font-semibold active:scale-[0.98]"
                >
                  戻る
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canNext()}
                  className="flex-1 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-40 active:scale-[0.98]"
                >
                  次へ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Slug */}
        {step === 2 && (
          <div className="pt-4 pb-24">
            <p className="text-4xl">{STEPS[2].icon}</p>
            <h1 className="mt-4 text-2xl font-bold">予約ページURL</h1>
            <p className="mt-2 text-sm text-muted">
              あなた専用のURLを決めましょう。
              お客さまはこのURLから予約ページにアクセスします。
            </p>

            <div className="mt-6">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="mb-2 text-xs text-muted">あなたのURL</p>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted">peco.app/p/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && canNext()) { e.preventDefault(); (e.target as HTMLInputElement).blur(); setStep(3); } }}
                    enterKeyHint="next"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    placeholder="your-name"
                    className="min-w-0 flex-1 border-b border-accent bg-transparent py-1 font-semibold text-accent focus:shadow-none"
                  />
                </div>
              </div>

              <div className="mt-2 h-5">
                {slugStatus === "checking" && (
                  <p className="text-xs text-muted">確認中...</p>
                )}
                {slugStatus === "available" && (
                  <p className="text-xs text-green-600">このURLは利用可能です</p>
                )}
                {slugStatus === "taken" && (
                  <p className="text-xs text-red-500">このURLは既に使われています</p>
                )}
                {slugStatus === "reserved" && (
                  <p className="text-xs text-red-500">このURLは使用できません</p>
                )}
              </div>

              <div className="mt-4 rounded-xl bg-accent-bg p-3">
                <p className="text-xs leading-relaxed text-accent">
                  💡 半角英数字とハイフン（-）が使えます。
                  お店の名前やあなたの名前がおすすめです。
                </p>
              </div>
            </div>

            <div className={`fixed bottom-0 left-0 right-0 bg-background px-4 pb-8 pt-3 transition-opacity ${keyboardOpen ? "pointer-events-none opacity-0" : ""}`}>
              <div className="mx-auto flex max-w-lg gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-border px-6 py-3.5 font-semibold active:scale-[0.98]"
                >
                  戻る
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canNext()}
                  className="flex-1 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-40 active:scale-[0.98]"
                >
                  次へ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contact & Profile */}
        {step === 3 && (
          <div className="pt-4 pb-24">
            <div>
              <p className="text-4xl">{STEPS[3].icon}</p>
              <h1 className="mt-4 text-2xl font-bold">連絡先・プロフィール</h1>
              <p className="mt-2 text-sm text-muted">
                お客さまからの連絡方法を選択してください。
              </p>

              <div className="mt-6 space-y-5">
                {/* 連絡方法トグル */}
                <div className="space-y-3">
                  {/* LINE */}
                  <div className={`rounded-2xl p-4 ring-1 transition-colors ${
                    lineEnabled ? "bg-green-50/50 ring-success/30" : "bg-card ring-border"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#06C755">
                            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold">LINEで連絡</p>
                      </div>
                      <Toggle
                        checked={lineEnabled}
                        onChange={setLineEnabled}
                        ariaLabel="LINEで連絡を有効にする"
                      />
                    </div>
                    {lineEnabled && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-sm text-muted">@</span>
                          <input
                            type="text"
                            value={lineId}
                            onChange={(e) => setLineId(e.target.value.replace(/^@/, ""))}
                            placeholder="your-line-id"
                            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-muted">
                          LINEアプリの設定 &gt; プロフィール &gt; LINE IDで確認できます
                        </p>
                      </div>
                    )}
                  </div>

                  {/* メール */}
                  <div className={`rounded-2xl p-4 ring-1 transition-colors ${
                    emailEnabled ? "bg-blue-50/50 ring-blue-300/30" : "bg-card ring-border"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold">メールで連絡</p>
                      </div>
                      <Toggle
                        checked={emailEnabled}
                        onChange={setEmailEnabled}
                        activeColor="bg-success"
                        ariaLabel="メールで連絡を有効にする"
                      />
                    </div>
                    {emailEnabled && (
                      <div className="mt-3">
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* 電話 */}
                  <div className={`rounded-2xl p-4 ring-1 transition-colors ${
                    phoneEnabled ? "bg-orange-50/50 ring-orange-300/30" : "bg-card ring-border"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold">電話で連絡</p>
                      </div>
                      <Toggle
                        checked={phoneEnabled}
                        onChange={setPhoneEnabled}
                        activeColor="bg-success"
                        ariaLabel="電話で連絡を有効にする"
                      />
                    </div>
                    {phoneEnabled && (
                      <div className="mt-3">
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="090-1234-5678"
                          inputMode="tel"
                          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    自己紹介
                    <span className="ml-1 text-xs text-muted">（任意）</span>
                  </label>
                  <textarea
                    id="bio-input"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    enterKeyHint="done"
                    placeholder="例：表参道で10年の経験を持つヘアスタイリストです。"
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    アイコン画像
                    <span className="ml-1 text-xs text-muted">（任意）</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-4 active:bg-accent-bg">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-bg text-accent">
                      {iconFile ? "✓" : "+"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {iconFile ? iconFile.name : "画像を選択"}
                      </p>
                      <p className="text-xs text-muted">
                        お客さまに表示されるアイコンです
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className={`fixed bottom-0 left-0 right-0 bg-background px-4 pb-8 pt-3 transition-opacity ${keyboardOpen ? "pointer-events-none opacity-0" : ""}`}>
              <div className="mx-auto flex max-w-lg gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-border px-6 py-3.5 font-semibold active:scale-[0.98]"
                >
                  戻る
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !canNext()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-40 active:scale-[0.98]"
                >
                  {submitting && (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {submitting ? "処理中..." : "登録を完了する"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <div className="flex flex-col items-center pt-8 pb-24 text-center">
            <div className="text-6xl">🎉</div>
            <h1 className="mt-6 text-2xl font-bold">登録完了！</h1>
            <p className="mt-3 leading-relaxed text-muted">
              予約ページが作成されました。
              <br />
              QRコードをお客さまに共有しましょう。
            </p>

            <div className={`fixed bottom-0 left-0 right-0 bg-background px-4 pb-8 pt-3 transition-opacity ${keyboardOpen ? "pointer-events-none opacity-0" : ""}`}>
              <div className="mx-auto max-w-lg space-y-2">
                <a
                  href="/provider"
                  className="block w-full rounded-xl bg-accent py-3.5 text-center font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]"
                >
                  管理画面へ進む
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
