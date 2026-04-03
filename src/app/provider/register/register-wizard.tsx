"use client";

import { useState, useEffect } from "react";
import { registerProvider, checkSlugAvailability } from "@/lib/actions/provider";
import { useLiff } from "@/components/LiffProvider";
import { useRouter } from "next/navigation";

const STEPS = [
  { title: "はじめに", icon: "👋" },
  { title: "お店の名前", icon: "🏠" },
  { title: "予約ページURL", icon: "🔗" },
  { title: "連絡先・プロフィール", icon: "✨" },
  { title: "完了", icon: "🎉" },
];

type ContactMethod = "line" | "email" | "both";

export function RegisterWizard() {
  const { user } = useLiff();
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
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [bio, setBio] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [contactMethod, setContactMethod] = useState<ContactMethod>("line");
  // userはuseEffect後に設定されるので、動的に生成
  const lineContactUrl = user ? `https://line.me/ti/p/~${user.lineUserId}` : "";
  const [contactEmail, setContactEmail] = useState("");

  async function handleSlugChange(value: string) {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(normalized);
    if (!normalized || normalized.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const available = await checkSlugAvailability(normalized);
    setSlugStatus(available ? "available" : "taken");
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (user?.lineUserId) formData.set("line_user_id", user.lineUserId);
      formData.set("slug", slug);
      formData.set("name", name);
      formData.set("bio", bio);
      if (contactMethod === "line" || contactMethod === "both") {
        formData.set("line_contact_url", lineContactUrl);
      }
      if (contactMethod === "email" || contactMethod === "both") {
        formData.set("contact_email", contactEmail);
      }
      if (iconFile) formData.set("icon", iconFile);
      await registerProvider(formData);
      // sessionStorageのキャッシュをクリア（roleがproviderに変わったため再取得させる）
      sessionStorage.removeItem("edgeconnect_user");
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  const canNext = () => {
    switch (step) {
      case 1: return name.trim().length > 0;
      case 2: return slug.length >= 3 && slugStatus === "available";
      case 3: {
        if (contactMethod === "email") return contactEmail.includes("@");
        if (contactMethod === "both") return contactEmail.includes("@");
        return true; // LINE は自動取得
      }
      default: return true;
    }
  };

  return (
    <main className="flex flex-col bg-background">
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
                  <span className="text-muted">edgeconnect.app/p/</span>
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
                {/* Contact Method */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    連絡方法
                  </label>
                  <div className="space-y-2">
                    {([
                      { value: "line" as const, label: "LINEで連絡を受ける", desc: "LINEアカウントを自動で連携します" },
                      { value: "email" as const, label: "メールで連絡を受ける", desc: "メールアドレスを入力してください" },
                      { value: "both" as const, label: "両方で連絡を受ける", desc: "LINEとメール両方を設定します" },
                    ]).map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                          contactMethod === option.value
                            ? "border-accent bg-accent-bg"
                            : "border-border bg-card"
                        }`}
                      >
                        <input
                          type="radio"
                          name="contactMethod"
                          value={option.value}
                          checked={contactMethod === option.value}
                          onChange={() => setContactMethod(option.value)}
                          className="mt-0.5 accent-accent"
                        />
                        <div>
                          <p className="text-sm font-semibold">{option.label}</p>
                          <p className="text-xs text-muted">{option.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* LINE confirmation */}
                {(contactMethod === "line" || contactMethod === "both") && (
                  <div className="rounded-xl bg-green-50 p-3">
                    <p className="text-xs text-green-700">
                      ✓ LINEアカウントは自動で連携されます。お客さまがタップするとあなたのLINEトークが開きます。
                    </p>
                  </div>
                )}

                {/* Email input */}
                {(contactMethod === "email" || contactMethod === "both") && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      メールアドレス
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          document.getElementById("bio-input")?.focus();
                        }
                      }}
                      enterKeyHint="next"
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"
                    />
                  </div>
                )}

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
                <button
                  onClick={() => router.push("/provider/qrcode")}
                  className="w-full rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]"
                >
                  QRコードを見る
                </button>
                <button
                  onClick={() => router.push(`/p/${slug}`)}
                  className="w-full rounded-xl border border-border py-3.5 font-semibold active:scale-[0.98]"
                >
                  予約ページをプレビュー
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
