"use client";

import { useState } from "react";
import { registerProvider, checkSlugAvailability } from "@/lib/actions/provider";
import { useLiff } from "@/components/LiffProvider";
import { useRouter } from "next/navigation";

const STEPS = [
  { title: "はじめに", icon: "👋" },
  { title: "お店の名前", icon: "🏠" },
  { title: "予約ページURL", icon: "🔗" },
  { title: "プロフィール", icon: "✨" },
  { title: "完了", icon: "🎉" },
];

export function RegisterWizard() {
  const { user } = useLiff();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState(user?.displayName || "");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [bio, setBio] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [lineContactUrl, setLineContactUrl] = useState(
    user ? `https://line.me/ti/p/~${user.lineUserId}` : ""
  );

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
      formData.set("slug", slug);
      formData.set("name", name);
      formData.set("bio", bio);
      formData.set("line_contact_url", lineContactUrl);
      if (iconFile) formData.set("icon", iconFile);
      await registerProvider(formData);
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
      case 3: return lineContactUrl.length > 0;
      default: return true;
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
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

      <div className="flex flex-1 flex-col px-4 py-6">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="flex flex-1 flex-col">
            <div className="flex-1">
              <p className="text-4xl">{STEPS[0].icon}</p>
              <h1 className="mt-4 text-2xl font-bold">
                EdgeConnectへようこそ
              </h1>
              <p className="mt-3 leading-relaxed text-muted">
                3つのステップであなたの予約ページを作成します。
                お客さまはLINEから簡単に予約できるようになります。
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { step: "1", title: "お店の名前を決める", desc: "お客さまに表示される名前です" },
                  { step: "2", title: "予約ページのURLを決める", desc: "あなた専用のURLを作成します" },
                  { step: "3", title: "プロフィールを入力", desc: "自己紹介やアイコンを設定します" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-bg text-sm font-bold text-accent">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="mt-8 w-full rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]"
            >
              はじめる
            </button>
          </div>
        )}

        {/* Step 1: Business Name */}
        {step === 1 && (
          <div className="flex flex-1 flex-col">
            <div className="flex-1">
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
                  placeholder="例：山田サロン"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-lg"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
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
        )}

        {/* Step 2: Slug */}
        {step === 2 && (
          <div className="flex flex-1 flex-col">
            <div className="flex-1">
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
            </div>

            <div className="mt-8 flex gap-3">
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
        )}

        {/* Step 3: Profile */}
        {step === 3 && (
          <div className="flex flex-1 flex-col">
            <div className="flex-1">
              <p className="text-4xl">{STEPS[3].icon}</p>
              <h1 className="mt-4 text-2xl font-bold">プロフィール</h1>
              <p className="mt-2 text-sm text-muted">
                あなたのことをお客さまに伝えましょう。
                あとから編集できるので、まずは気軽に入力してください。
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    自己紹介
                    <span className="ml-1 text-xs text-muted">（任意）</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="例：表参道で10年の経験を持つヘアスタイリストです。"
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"
                  />
                </div>

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

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    連絡用LINE URL
                  </label>
                  <input
                    type="url"
                    value={lineContactUrl}
                    onChange={(e) => setLineContactUrl(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"
                  />
                  <p className="mt-1 text-xs text-muted">
                    お客さまが直接連絡する際のLINE URLです
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="rounded-xl border border-border px-6 py-3.5 font-semibold active:scale-[0.98]"
              >
                戻る
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !canNext()}
                className="flex-1 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-40 active:scale-[0.98]"
              >
                {submitting ? "登録中..." : "登録を完了する"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="text-6xl">🎉</div>
            <h1 className="mt-6 text-2xl font-bold">登録完了！</h1>
            <p className="mt-3 leading-relaxed text-muted">
              予約ページが作成されました。
              <br />
              QRコードをお客さまに共有しましょう。
            </p>

            <div className="mt-8 w-full max-w-xs space-y-3">
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
        )}
      </div>
    </main>
  );
}
