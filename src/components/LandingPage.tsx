import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { PlanCarousel } from "@/components/PlanCarousel";
import { LineIcon } from "@/components/icons";

/**
 * LandingPage V2
 * コンセプト: 「予約する人」と「予約を受ける人」を明確に分離
 * - ヒーローは全員共通（PeCoとは何か）
 * - その下でタブ的に「予約したい方」「予約を受けたい方」で分かれる
 * - 料金は事業主セクション内に自然に組み込む
 */
export function LandingPage({ isLoggedIn = false, role }: { isLoggedIn?: boolean; role?: "customer" | "provider" }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8">
          <img src="/logo.svg" alt="PeCo" className="h-6 sm:h-7" />
          <div className="flex items-center gap-4">
            <Link href="/explore" className="hidden text-sm text-muted hover:text-foreground sm:block">
              事業主を探す
            </Link>
            {isLoggedIn ? (
              <Link href="/home" className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-white active:scale-[0.98]">
                マイページ
              </Link>
            ) : (
              <a href="/?action=login" className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-white active:scale-[0.98]">
                ログイン
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero — 全員共通 */}
      <section className="bg-gradient-to-b from-accent/8 to-background pb-10 pt-12 sm:pb-14 sm:pt-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-8">
          <img src="/logo.svg" alt="PeCo" className="mx-auto h-12 sm:h-16" />
          <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl sm:leading-tight">
            LINEで、
            <br className="sm:hidden" />
            <span className="text-accent-dark">かんたん予約</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted sm:mt-6 sm:text-base">
            予約する人も、受ける人も。
            <br />
            PeCoがつなぐ、シンプルな予約体験。
          </p>
          <div className="mt-8 sm:mt-10">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-muted active:scale-[0.98] sm:px-8"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              事業主を探す
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 予約したい方（お客さま）===== */}
      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <h2 className="shrink-0 text-sm font-bold text-success sm:text-base">予約したい方</h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="mt-2 text-center text-xs text-muted">アプリ不要・登録不要・完全無料</p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M7 7h10M7 12h10M7 17h4" />
                  </svg>
                ),
                title: "QRコードで即アクセス",
                desc: "事業主のQRコードを読み取るだけ。アプリのダウンロードは不要です。",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01" />
                  </svg>
                ),
                title: "空き時間からワンタップ予約",
                desc: "リアルタイムの空き状況から、希望の日時を選んですぐに予約確定。",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                ),
                title: "LINEでリマインド",
                desc: "予約確認・前日リマインダーがLINEに届くので、忘れる心配なし。",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 rounded-2xl bg-card p-4 ring-1 ring-border sm:flex-col sm:items-center sm:p-6 sm:text-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success sm:h-12 sm:w-12">
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold sm:mt-2">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted sm:mt-1 sm:text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ===== 予約を受けたい方（事業主）===== */}
      <section className="bg-gradient-to-b from-accent/6 to-background py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-accent/20" />
            <h2 className="shrink-0 text-sm font-bold text-accent-dark sm:text-base">予約を受けたい方</h2>
            <div className="h-px flex-1 bg-accent/20" />
          </div>
          <p className="mt-2 text-center text-xs text-muted">個人事業主のための予約管理プラットフォーム</p>

          {/* 3ステップ */}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
            {[
              { step: "1", title: "LINEで登録", desc: "LINEアカウントで30秒で事業主登録" },
              { step: "2", title: "メニューを設定", desc: "サービス内容・料金・営業時間を入力" },
              { step: "3", title: "QRコードを共有", desc: "お客さまにシェアして予約受付開始" },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 rounded-2xl bg-card p-4 ring-1 ring-border sm:flex-col sm:items-center sm:p-6 sm:text-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold text-white sm:h-12 sm:w-12 sm:text-lg">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold sm:mt-2">{s.title}</p>
                  <p className="mt-0.5 text-xs text-muted sm:mt-1 sm:text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 機能一覧 */}
          <div className="mt-10">
            <p className="text-center text-xs font-medium text-muted">できること</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>, label: "予約受付・管理" },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>, label: "LINE通知" },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg>, label: "カレンダー同期" },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 7h10M7 12h10M7 17h4" /></svg>, label: "QRコード発行" },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>, label: "営業時間設定" },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>, label: "インターバル管理" },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>, label: "プロフィールページ" },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6h16M4 12h16M4 18h7" /></svg>, label: "メニュー管理" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-xl bg-card px-3 py-2.5 ring-1 ring-border sm:px-4 sm:py-3">
                  <span className="shrink-0 text-accent-dark">{f.icon}</span>
                  <span className="text-xs font-medium sm:text-sm">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 料金 — 事業主セクション内に自然に配置 */}
          <div className="mt-10">
            <p className="text-center text-xs font-medium text-muted">料金</p>
            {(() => {
              const plans = [
                {
                  name: "ベーシック",
                  price: 500,
                  desc: "まずは予約管理を始めたい方に",
                  features: [
                    "予約受付・管理",
                    "サービスメニュー登録",
                    "営業時間・インターバル設定",
                    "プロフィールページ",
                    "QRコード・URL発行",
                  ],
                  comingSoon: false,
                },
                {
                  name: "スタンダード",
                  price: 980,
                  desc: "LINE通知で予約体験を向上",
                  recommended: true,
                  trial: true,
                  features: [
                    "ベーシックの全機能",
                    "LINE通知（予約確定・リマインダー）",
                    "カレンダー同期",
                    "リマインダーカスタマイズ",
                    "優先サポート",
                  ],
                  comingSoon: true,
                },
                {
                  name: "プロ",
                  price: 1980,
                  desc: "AIで予約管理をさらにスマートに",
                  features: [
                    "スタンダードの全機能",
                    "AI予約アシスタント",
                    "AI売上分析・レポート",
                    "AIリコメンド（顧客提案）",
                    "決済連携",
                  ],
                  comingSoon: true,
                },
              ];

              const renderCard = (plan: typeof plans[number]) => {
                const isCurrentPlan = role === "provider" && plan.name === "ベーシック"; // TODO: 実際のプラン判定
                return (
                  <div
                    key={plan.name}
                    className={`relative flex w-full flex-col rounded-2xl bg-card p-5 sm:p-8 ${
                      isCurrentPlan
                        ? "ring-2 ring-accent shadow-md"
                        : plan.recommended && role !== "provider"
                          ? "ring-2 ring-accent shadow-md"
                          : "ring-1 ring-border"
                    }`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-4 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold text-white">
                        ご利用中
                      </div>
                    )}
                    {!isCurrentPlan && plan.recommended && role !== "provider" && (
                      <div className="absolute -top-3 left-4 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold text-white">
                        おすすめ
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${isCurrentPlan || plan.recommended ? "text-accent" : "text-muted"}`}>
                        {plan.name}
                      </p>
                      {plan.trial && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                          1ヶ月無料
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold">¥{plan.price.toLocaleString()}</span>
                      <span className="text-sm text-muted">/月</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{plan.desc}</p>
                    <ul className="mt-4 space-y-2 text-sm">
                      {plan.features.map((item, i) => (
                        <li key={item} className="flex items-start gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`mt-0.5 shrink-0 ${plan.comingSoon && i > 0 ? "text-muted/40" : "text-accent"}`}>
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          <span className={plan.comingSoon && i > 0 ? "text-muted" : ""}>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-5">
                      {plan.comingSoon ? (
                        <button disabled className="flex w-full items-center justify-center rounded-xl border border-border py-3 text-sm font-semibold text-muted opacity-50">
                          近日公開予定
                        </button>
                      ) : isCurrentPlan ? (
                        <Link href="/provider" className="flex w-full items-center justify-center rounded-xl border border-accent py-3 text-sm font-semibold text-accent active:scale-[0.98]">
                          管理画面へ
                        </Link>
                      ) : !isLoggedIn ? (
                        <a href="/?action=login" className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]">
                          <LineIcon />
                          無料トライアルを始める
                        </a>
                      ) : isLoggedIn && role !== "provider" ? (
                        <Link href="/provider/register" className="flex w-full items-center justify-center rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]">
                          事業主として始める
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {/* モバイル: カルーセル */}
                  <PlanCarousel plans={plans} isLoggedIn={isLoggedIn} role={role} />
                  {/* PC: グリッド */}
                  <div className="mt-8 hidden items-stretch gap-5 lg:grid lg:grid-cols-3">
                    {plans.map((plan) => (
                      <div key={plan.name} className="flex">{renderCard(plan)}</div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isLoggedIn && (
        <section className="py-10 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-8">
            <h2 className="text-xl font-bold sm:text-3xl">
              さあ、はじめましょう
            </h2>
            <p className="mt-3 text-sm text-muted sm:text-base">
              予約する方も、受ける方も、LINEアカウントだけでOK
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <a href="/?action=login" className="flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-base font-semibold text-white shadow-lg shadow-success/25 active:scale-[0.98] sm:w-auto sm:px-8">
                <LineIcon />
                LINEではじめる
              </a>
              <Link
                href="/explore"
                className="flex w-full max-w-xs items-center justify-center rounded-xl border border-border py-3.5 text-sm font-semibold text-muted active:scale-[0.98] sm:w-auto sm:px-8"
              >
                事業主を探す
              </Link>
            </div>
          </div>
        </section>
      )}

      <PublicFooter maxWidth="max-w-5xl" />
    </div>
  );
}
