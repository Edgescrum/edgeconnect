"use client";

import { useState, useEffect } from "react";
import { registerProvider, checkSlugAvailability } from "@/lib/actions/provider";
import type { Category } from "@/lib/constants/categories";
import { CategorySelector } from "@/components/CategorySelector";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";
import { Alert } from "@/components/Alert";
import { FormLabel, FormInput } from "@/components/FormField";

const STEPS = [
  { title: "お店の名前", icon: "🏠" },
  { title: "予約ページURL", icon: "🔗" },
  { title: "利用規約", icon: "📋" },
  { title: "完了", icon: "🎉" },
];

export function RegisterWizard({ categories: PROVIDER_CATEGORIES }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const [checkoutProcessing, setCheckoutProcessing] = useState(false);

  // Stripe Checkout完了後のリダイレクト処理: provider を作成して /provider へ遷移
  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");

    if (checkoutStatus === "success" && !checkoutProcessing) {
      setCheckoutProcessing(true);
      (async () => {
        try {
          const savedData = sessionStorage.getItem("peco_register_form");
          if (savedData) {
            const parsed = JSON.parse(savedData);
            const formData = new FormData();
            Object.entries(parsed).forEach(([key, value]) => {
              if (value != null) formData.set(key, String(value));
            });
            // Stripe checkout 成功後に provider を作成
            await registerProvider(formData);
            sessionStorage.removeItem("peco_register_form");
            sessionStorage.removeItem("peco_user");

            // Stripe サブスクリプションを provider に紐づけ（リトライ付き）
            const linkSubscription = async (retries = 3) => {
              for (let i = 0; i <= retries; i++) {
                try {
                  const res = await fetch("/api/stripe/link-subscription", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sessionId }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    console.log("link-subscription result:", data);
                    return;
                  }
                  console.warn(`link-subscription failed (attempt ${i + 1}): ${res.status}`);
                  if (i < retries) await new Promise(r => setTimeout(r, 1500 * (i + 1)));
                } catch (err) {
                  console.warn(`link-subscription error (attempt ${i + 1}):`, err);
                  if (i < retries) await new Promise(r => setTimeout(r, 1500 * (i + 1)));
                }
              }
              console.warn("link-subscription: all retries exhausted, webhook will handle it");
            };
            await linkSubscription();
          }
          // 完了画面を表示せず、/provider に直接遷移（モーダルで完了を通知）
          sessionStorage.setItem("peco_register_complete", "1");
          router.push("/provider");
        } catch (e) {
          setError(e instanceof Error ? e.message : "登録に失敗しました");
          setStep(1); // フォームに戻す
          setCheckoutProcessing(false);
        }
      })();
    } else if (checkoutStatus === "cancelled") {
      setError("カード登録がキャンセルされました。再度お試しください。");
      // sessionStorageからフォームデータを復元
      const savedData = sessionStorage.getItem("peco_register_form");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.name) setName(parsed.name);
          if (parsed.slug) {
            setSlug(parsed.slug);
            setSlugStatus("available");
          }
          if (parsed.category) setCategory(parsed.category);
          if (parsed.terms_agreed === "1") setTermsAgreed(true);
        } catch { /* ignore */ }
      }
      setStep(2);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // キーボードの開閉検知（フォーカスベース）
  useEffect(() => {
    function onFocus() { setKeyboardOpen(true); }
    function onBlur() { setKeyboardOpen(false); }
    document.addEventListener("focusin", (e) => {
      const el = e.target as HTMLInputElement;
      const tag = el?.tagName;
      // チェックボックス・ラジオはキーボードを開かないので除外
      if ((tag === "INPUT" && el.type !== "checkbox" && el.type !== "radio") || tag === "TEXTAREA" || tag === "SELECT") onFocus();
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
  const [category, setCategory] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);

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
      // フォームデータを sessionStorage に保存（Stripe checkout 成功後に使う）
      const formDataObj: Record<string, string> = {
        slug,
        name,
        plan: "standard",
      };
      if (category) formDataObj.category = category;
      if (termsAgreed) formDataObj.terms_agreed = "1";
      sessionStorage.setItem("peco_register_form", JSON.stringify(formDataObj));

      // Stripe Checkout セッション作成 → リダイレクト（provider 作成前）
      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "standard",
          context: "register",
          providerName: name,
        }),
      });

      if (!checkoutRes.ok) {
        const errData = await checkoutRes.json().catch(() => null);
        throw new Error(errData?.error || "決済セッションの作成に失敗しました");
      }

      const { url } = await checkoutRes.json();
      if (url) {
        window.location.href = url;
      } else {
        // Checkoutが不要な場合（将来の無料プラン等）
        // sessionStorage からフォームデータを読んで provider を作成
        const formData = new FormData();
        Object.entries(formDataObj).forEach(([key, value]) => {
          formData.set(key, value);
        });
        await registerProvider(formData);
        sessionStorage.removeItem("peco_register_form");
        sessionStorage.removeItem("peco_user");
        setStep(3);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  const canNext = () => {
    switch (step) {
      case 0: return name.trim().length > 0 && category !== "";
      case 1: return slug.length >= 3 && slugStatus === "available";
      case 2: return termsAgreed;
      default: return true;
    }
  };

  // チェックアウト処理中はローディング画面を表示
  if (checkoutProcessing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner size="lg" />
          <p className="text-lg font-semibold">登録を完了しています...</p>
          <p className="text-sm text-muted">しばらくお待ちください</p>
        </div>
      </main>
    );
  }

  return (
    <>
    {/* --- PC版: 1ページフォーム --- */}
    <main className="hidden min-h-screen bg-background sm:block">
      <div className="mx-auto max-w-2xl px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold">予約ページを作成</h1>
          <p className="mt-2 text-muted">必要な情報を入力して、あなた専用の予約ページを作りましょう。</p>
        </div>

        {step < 3 ? (
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
              <p className="mt-1 text-xs text-red-500">※ 予約ページURLはあとから変更できません</p>
            </section>

            {/* 利用規約同意 */}
            <section className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">3</div>
                <h2 className="text-lg font-bold">利用規約への同意</h2>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-accent"
                />
                <span className="text-sm leading-relaxed">
                  <Link href="/legal/terms" target="_blank" className="text-accent underline">利用規約</Link>
                  {" "}および{" "}
                  <Link href="/legal/privacy" target="_blank" className="text-accent underline">プライバシーポリシー</Link>
                  {" "}に同意します
                </span>
              </label>
              <p className="mt-3 text-xs text-muted">
                <Link href="/legal/commercial" target="_blank" className="text-accent underline">特定商取引法に基づく表記</Link>もご確認ください。
              </p>
            </section>

            {error && (
              <Alert type="error">{error}</Alert>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !termsAgreed || !name.trim() || !category || slug.length < 3 || slugStatus !== "available"}
              className="w-full rounded-xl bg-accent py-4 text-lg font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {submitting ? "処理中..." : "カード登録に進む（初月無料）"}
            </button>

            <p className="text-center text-xs text-muted">
              初月無料 - カード登録のみで課金は1ヶ月後に開始されます
            </p>
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
      {step < 3 && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-1">
            {STEPS.slice(0, 3).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-accent" : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            ステップ {step + 1} / 3
          </p>
        </div>
      )}

      <div className="px-4">
        {/* Step 0: Business Name */}
        {step === 0 && (
          <div className="pt-4 pb-24">
            <p className="text-4xl">{STEPS[0].icon}</p>
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
                onKeyDown={(e) => { if (e.key === "Enter" && canNext()) { e.preventDefault(); (e.target as HTMLInputElement).blur(); setStep(1); } }}
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
              <div className="mx-auto max-w-lg">
                <button
                  onClick={() => setStep(1)}
                  disabled={!canNext()}
                  className="w-full rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-40 active:scale-[0.98]"
                >
                  次へ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Slug */}
        {step === 1 && (
          <div className="pt-4 pb-24">
            <p className="text-4xl">{STEPS[1].icon}</p>
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
                    onKeyDown={(e) => { if (e.key === "Enter" && canNext()) { e.preventDefault(); (e.target as HTMLInputElement).blur(); setStep(2); } }}
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
                  半角英数字とハイフン（-）が使えます。
                  お店の名前やあなたの名前がおすすめです。
                </p>
              </div>
              <p className="mt-2 text-xs text-red-500">※ 予約ページURLはあとから変更できません</p>
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

        {/* Step 2: Terms Agreement */}
        {step === 2 && (
          <div className="pt-4 pb-24">
            <p className="text-4xl">{STEPS[2].icon}</p>
            <h1 className="mt-4 text-2xl font-bold">利用規約への同意</h1>
            <p className="mt-2 text-sm text-muted">
              ご利用の前に、以下の規約をご確認ください。
            </p>

            <div className="mt-6">
              <div className="rounded-xl border border-border bg-card p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent"
                  />
                  <span className="text-xs leading-relaxed">
                    <Link href="/legal/terms" target="_blank" className="text-accent underline">利用規約</Link>
                    {" "}および{" "}
                    <Link href="/legal/privacy" target="_blank" className="text-accent underline">プライバシーポリシー</Link>
                    {" "}に同意します
                  </span>
                </label>
                <p className="mt-2 pl-7 text-[10px] text-muted">
                  <Link href="/legal/commercial" target="_blank" className="text-accent underline">特定商取引法に基づく表記</Link>もご確認ください。
                </p>
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
                  onClick={() => setStep(1)}
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
                  {submitting ? "処理中..." : "カード登録に進む（初月無料）"}
                </button>
              </div>
              <p className="mx-auto mt-2 max-w-lg text-center text-[10px] text-muted">
                初月無料 - カード登録のみで課金は1ヶ月後に開始されます
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
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
