"use client";

import { useState, useEffect } from "react";
import { registerProvider, checkSlugAvailability } from "@/lib/actions/provider";
import type { Category } from "@/lib/constants/categories";
import { CategorySelector } from "@/components/CategorySelector";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";
import { Alert } from "@/components/Alert";
import { ContactMethodToggles, type ContactMethodState } from "@/components/ContactMethodToggles";
import { FormLabel, FormInput, FormTextarea } from "@/components/FormField";

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
  const [contactMethod, setContactMethod] = useState<ContactMethodState>({
    lineEnabled: true,
    lineId: "",
    emailEnabled: false,
    contactEmail: "",
    phoneEnabled: false,
    contactPhone: "",
  });

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
      if (contactMethod.lineEnabled && contactMethod.lineId) {
        formData.set("line_id", contactMethod.lineId);
      }
      if (contactMethod.emailEnabled && contactMethod.contactEmail) {
        formData.set("contact_email", contactMethod.contactEmail);
      }
      if (contactMethod.phoneEnabled && contactMethod.contactPhone) {
        formData.set("contact_phone", contactMethod.contactPhone);
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
        if (!contactMethod.lineEnabled && !contactMethod.emailEnabled && !contactMethod.phoneEnabled) return false;
        if (contactMethod.lineEnabled && !contactMethod.lineId.trim()) return false;
        if (contactMethod.emailEnabled && !contactMethod.contactEmail.includes("@")) return false;
        if (contactMethod.phoneEnabled && !contactMethod.contactPhone.trim()) return false;
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
                  <FormLabel required>屋号・サービス名</FormLabel>
                  <FormInput
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例：山田サロン"
                  />
                </div>
                <div>
                  <FormLabel required>カテゴリ</FormLabel>
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
                <ContactMethodToggles
                  state={contactMethod}
                  onChange={setContactMethod}
                  showValidationError={!contactMethod.lineEnabled && !contactMethod.emailEnabled && !contactMethod.phoneEnabled}
                />

                {/* Bio */}
                <div>
                  <FormLabel>
                    自己紹介 <span className="text-xs text-muted">（任意）</span>
                  </FormLabel>
                  <FormTextarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="例：表参道で10年の経験を持つヘアスタイリストです。"
                    className="text-sm"
                  />
                </div>

                {/* Icon */}
                <div>
                  <FormLabel>
                    アイコン画像 <span className="text-xs text-muted">（任意）</span>
                  </FormLabel>
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
              <Alert type="error">{error}</Alert>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !name.trim() || !category || slug.length < 3 || slugStatus !== "available" || (!contactMethod.lineEnabled && !contactMethod.emailEnabled && !contactMethod.phoneEnabled) || (contactMethod.lineEnabled && !contactMethod.lineId.trim()) || (contactMethod.emailEnabled && !contactMethod.contactEmail.includes("@")) || (contactMethod.phoneEnabled && !contactMethod.contactPhone.trim())}
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
                <ContactMethodToggles
                  state={contactMethod}
                  onChange={setContactMethod}
                  showValidationError={!contactMethod.lineEnabled && !contactMethod.emailEnabled && !contactMethod.phoneEnabled}
                />

                {/* Bio */}
                <div>
                  <FormLabel>
                    自己紹介
                    <span className="ml-1 text-xs text-muted">（任意）</span>
                  </FormLabel>
                  <FormTextarea
                    id="bio-input"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    enterKeyHint="done"
                    placeholder="例：表参道で10年の経験を持つヘアスタイリストです。"
                    className="text-sm"
                  />
                </div>

                {/* Icon */}
                <div>
                  <FormLabel>
                    アイコン画像
                    <span className="ml-1 text-xs text-muted">（任意）</span>
                  </FormLabel>
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
              <div className="mt-4">
                <Alert type="error">{error}</Alert>
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
                    <Spinner size="sm" className="border-white border-t-transparent" />
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
