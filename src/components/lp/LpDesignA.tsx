import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { LineIcon } from "@/components/icons";
import { MockupPhone } from "@/components/lp/MockupPhone";
import { buildLiffUrl } from "@/lib/device";

/**
 * LP Design A -- "Bold & Dynamic"
 *
 * 10x.co.jp をインスピレーションとした大胆なタイポグラフィ、
 * グラデーション背景、数字で訴求するスタイリッシュなデザイン。
 * ヒーローはフルスクリーン、左テキスト/右モックアップの2カラム。
 */
export function LpDesignA({
  isLoggedIn = false,
  role,
  isMobile = false,
}: {
  isLoggedIn?: boolean;
  role?: "customer" | "provider";
  isMobile?: boolean;
}) {
  const loginUrl = buildLiffUrl("/?action=login", isMobile);
  const registerUrl = buildLiffUrl("/provider/register", isMobile);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-10">
          <img src="/logo.svg" alt="PeCo" className="h-6 sm:h-7" />
          <nav className="hidden items-center gap-8 text-sm text-muted sm:flex">
            <a href="#for-customer" className="transition hover:text-foreground">予約する方</a>
            <a href="#for-provider" className="transition hover:text-foreground">事業主の方</a>
            <a href="#pricing" className="transition hover:text-foreground">料金</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/explore" className="hidden text-sm text-muted hover:text-foreground sm:block">
              事業主を探す
            </Link>
            {isLoggedIn ? (
              <Link href="/home" className="rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background">
                マイページ
              </Link>
            ) : (
              <a href={loginUrl} className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background">
                {isMobile && <LineIcon size={14} />}
                ログイン
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero -- Full viewport */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-14">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-[400px] w-[400px] rounded-full bg-success/6 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 sm:grid-cols-2 sm:gap-16 sm:px-10">
          {/* Left: Text */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-accent-dark">LINEで完結する予約体験</span>
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-6xl sm:leading-[1.1]">
              予約を、
              <br />
              <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent">
                もっとシンプルに。
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              LINEアカウントがあれば、アプリ不要・登録不要。
              <br className="hidden sm:block" />
              お客さまも事業主も、すべて無料ではじめられます。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {!isLoggedIn ? (
                <>
                  <a
                    href={loginUrl}
                    className="inline-flex items-center gap-2 rounded-full bg-success px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-success/20 transition active:scale-[0.98]"
                  >
                    <LineIcon size={18} />
                    無料ではじめる
                  </a>
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-muted transition hover:border-foreground/30 active:scale-[0.98]"
                  >
                    事業主を探す
                  </Link>
                </>
              ) : role === "provider" ? (
                <Link href="/provider" className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white">
                  管理画面へ
                </Link>
              ) : (
                <a href={registerUrl} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white">
                  {isMobile && <LineIcon size={18} />}
                  事業主登録
                </a>
              )}
            </div>
          </div>

          {/* Right: Phone mockup */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <MockupPhone variant="booking" className="relative z-10" />
              {/* Floating badges */}
              <div className="absolute -left-4 top-12 z-20 rounded-xl bg-white px-3 py-2 shadow-xl ring-1 ring-border sm:-left-8">
                <div className="text-[10px] text-muted">予約確定</div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span className="text-xs font-bold">5/15 10:00</span>
                </div>
              </div>
              <div className="absolute -right-2 bottom-20 z-20 rounded-xl bg-white px-3 py-2 shadow-xl ring-1 ring-border sm:-right-6">
                <div className="text-[10px] text-muted">LINE通知</div>
                <div className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span className="text-xs font-bold">送信済み</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2 text-muted/40">
            <span className="text-[10px] tracking-widest uppercase">Scroll</span>
            <div className="h-8 w-px bg-gradient-to-b from-muted/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* Numbers Section */}
      <section className="border-y border-border bg-card/50 py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-5 sm:grid-cols-4 sm:px-10">
          {[
            { number: "0", unit: "円", label: "お客さまの利用料金" },
            { number: "30", unit: "秒", label: "事業主の登録時間" },
            { number: "24", unit: "h", label: "予約受付対応" },
            { number: "0", unit: "件", label: "必要なアプリDL" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-extrabold tracking-tight sm:text-5xl">{stat.number}</span>
                <span className="text-lg font-medium text-muted">{stat.unit}</span>
              </div>
              <p className="mt-1 text-xs text-muted sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For Customer Section */}
      <section id="for-customer" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-10">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wider text-success uppercase">For Customers</p>
              <h2 className="text-2xl font-extrabold sm:text-3xl">予約する方へ</h2>
            </div>
          </div>
          <p className="mt-3 max-w-lg text-sm text-muted sm:text-base">
            LINEさえあれば、新しいアプリのダウンロードも会員登録も不要。完全無料で、かんたんに予約できます。
          </p>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {/* Feature cards with left text, right visual */}
            {[
              {
                title: "QRコードで即アクセス",
                desc: "事業主のQRコードをスマホで読み取るだけ。LINEアプリ内で予約画面が開きます。面倒な会員登録は一切不要。",
                mockup: "profile" as const,
              },
              {
                title: "リアルタイムで空き確認",
                desc: "営業時間・既存予約を考慮したリアルタイムの空き状況を確認。希望の日時をタップして、その場で予約確定。",
                mockup: "booking" as const,
              },
              {
                title: "LINEで通知が届く",
                desc: "予約確認・前日リマインダーがLINEのトーク画面に届きます。予約を忘れる心配がなくなります。",
                mockup: "notification" as const,
              },
              {
                title: "カレンダーに自動追加",
                desc: "予約確定後、Googleカレンダー・Appleカレンダーにワンタップで追加。スケジュール管理も簡単。",
                mockup: "calendar" as const,
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl bg-card p-6 ring-1 ring-border transition hover:ring-success/30 sm:p-8"
              >
                <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-success/5 transition group-hover:bg-success/10" />
                <span className="relative text-sm font-bold text-success/60">0{i + 1}</span>
                <h3 className="relative mt-2 text-lg font-bold">{feature.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Provider Section */}
      <section id="for-provider" className="bg-gradient-to-b from-foreground to-foreground/95 py-16 text-background sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-10">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-16">
            {/* Left: Phone mockup */}
            <div className="order-2 flex items-center justify-center sm:order-1">
              <MockupPhone variant="dashboard" />
            </div>

            {/* Right: Text */}
            <div className="order-1 flex flex-col justify-center sm:order-2">
              <p className="text-xs font-medium tracking-wider text-accent-light uppercase">For Business Owners</p>
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">事業主の方へ</h2>
              <p className="mt-3 text-sm leading-relaxed text-background/70 sm:text-base">
                LINE公式アカウントを起点に、予約受付からスケジュール管理まで自動化。
                対応漏れ・二重予約をゼロに。
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    title: "30秒で事業主登録",
                    desc: "LINEアカウントでログインして、プロフィールを入力するだけ。すぐに予約受付を開始できます。",
                  },
                  {
                    title: "予約管理を自動化",
                    desc: "空き時間の計算、予約の重複防止、LINE通知を自動で処理。手動での管理から解放されます。",
                  },
                  {
                    title: "QRコードで集客",
                    desc: "あなた専用のQRコード・URLを発行。名刺やSNSに掲載して、お客さまを直接予約ページに誘導。",
                  },
                  {
                    title: "カレンダーと同期",
                    desc: "Google・Appleカレンダーとワンタップで連携。既存のスケジュールと一元管理できます。",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-0.5 text-sm text-background/60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                {!isLoggedIn ? (
                  <a
                    href={loginUrl}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition active:scale-[0.98]"
                  >
                    <LineIcon size={18} />
                    無料で事業主登録
                  </a>
                ) : role !== "provider" ? (
                  <a
                    href={registerUrl}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white"
                  >
                    事業主登録を始める
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-10">
          <div className="text-center">
            <p className="text-xs font-medium tracking-wider text-accent-dark uppercase">How it works</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">はじめかた</h2>
          </div>

          <div className="relative mt-12">
            {/* Connection line */}
            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-accent/30 via-accent/10 to-transparent sm:block" />

            <div className="space-y-8 sm:space-y-16">
              {[
                {
                  step: "01",
                  title: "LINEでログイン",
                  desc: "LINEアカウントでワンタップログイン。新しいパスワードを覚える必要はありません。",
                  align: "left" as const,
                },
                {
                  step: "02",
                  title: "プロフィール・メニューを設定",
                  desc: "屋号、サービスメニュー、営業時間を入力。ステップウィザードで迷わず完了。",
                  align: "right" as const,
                },
                {
                  step: "03",
                  title: "QRコードを共有して予約受付開始",
                  desc: "あなた専用のURLとQRコードを取得。お客さまに共有すれば、すぐに予約受付がスタート。",
                  align: "left" as const,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`relative flex flex-col items-center gap-4 sm:flex-row ${
                    item.align === "right" ? "sm:flex-row-reverse" : ""
                  }`}
                >
                  <div className={`flex-1 ${item.align === "right" ? "sm:text-right" : ""}`}>
                    <span className="text-3xl font-extrabold text-accent/20">{item.step}</span>
                    <h3 className="mt-1 text-lg font-bold">{item.title}</h3>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                      {item.desc}
                    </p>
                  </div>
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-white shadow-lg shadow-accent/20">
                    {item.step}
                  </div>
                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-card/30 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-10">
          <div className="text-center">
            <p className="text-xs font-medium tracking-wider text-accent-dark uppercase">Pricing</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">シンプルな料金体系</h2>
            <p className="mt-3 text-sm text-muted">お客さまは完全無料。事業主もベーシックプランからスタート。</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                name: "ベーシック",
                price: 500,
                desc: "まずは予約管理を始めたい方に",
                features: ["予約受付・管理", "サービスメニュー登録", "営業時間・インターバル設定", "プロフィールページ", "QRコード・URL発行"],
                accent: false,
              },
              {
                name: "スタンダード",
                price: 980,
                desc: "LINE通知で予約体験を向上",
                features: ["ベーシックの全機能", "LINE通知", "カレンダー同期", "顧客管理", "予約分析"],
                accent: true,
                trial: true,
              },
              {
                name: "チーム",
                price: 3980,
                desc: "複数スタッフでの予約管理",
                features: ["スタンダードの全機能", "スタッフ管理（最大10人）", "スタッフ別シフト管理", "権限管理", "チーム分析"],
                accent: false,
                comingSoon: true,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-6 sm:p-8 ${
                  plan.accent
                    ? "bg-foreground text-background ring-0"
                    : "bg-card ring-1 ring-border"
                }`}
              >
                {plan.trial && (
                  <div className="absolute -top-3 right-4 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold text-white">
                    1ヶ月無料
                  </div>
                )}
                {plan.comingSoon && (
                  <div className="absolute -top-3 right-4 rounded-full bg-muted/80 px-3 py-0.5 text-[10px] font-bold text-white">
                    Coming Soon
                  </div>
                )}
                <p className={`text-sm font-semibold ${plan.accent ? "text-accent-light" : "text-muted"}`}>
                  {plan.name}
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{plan.price.toLocaleString()}</span>
                  <span className={`text-sm ${plan.accent ? "text-background/60" : "text-muted"}`}>円/月</span>
                </div>
                <p className={`mt-1 text-xs ${plan.accent ? "text-background/60" : "text-muted"}`}>{plan.desc}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`mt-0.5 shrink-0 ${plan.accent ? "text-accent-light" : "text-accent"}`}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className={plan.accent ? "text-background/80" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {!isLoggedIn && (
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-10">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              予約管理を、
              <br />
              <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent">
                シンプルに。
              </span>
            </h2>
            <p className="mt-4 text-sm text-muted sm:text-base">
              LINEアカウントだけで、今すぐ無料ではじめられます。
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <a
                href={loginUrl}
                className="flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-success py-3.5 text-base font-semibold text-white shadow-lg shadow-success/20 active:scale-[0.98] sm:w-auto sm:px-8"
              >
                <LineIcon />
                無料ではじめる
              </a>
              <Link
                href="/explore"
                className="flex w-full max-w-xs items-center justify-center rounded-full border border-border py-3.5 text-sm font-semibold text-muted active:scale-[0.98] sm:w-auto sm:px-8"
              >
                事業主を探す
              </Link>
            </div>
          </div>
        </section>
      )}

      <PublicFooter maxWidth="max-w-6xl" />
    </div>
  );
}
