import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { LineIcon } from "@/components/icons";
import { MockupPhone } from "@/components/lp/MockupPhone";
import { buildLiffUrl } from "@/lib/device";

/**
 * LP Design C -- "Split Layout"
 *
 * 全セクションで左テキスト/右ビジュアルのスプリットレイアウトを徹底。
 * 交互に配置する事で視線の流れを作り、スクロールの快適さを重視。
 * ミニマルでエレガントなデザイン。グリッド線や幾何学的装飾を活用。
 */
export function LpDesignC({
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
      {/* Header -- Minimal */}
      <header className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-12">
          <img src="/logo.svg" alt="PeCo" className="h-5 sm:h-6" />
          <div className="flex items-center gap-5">
            <Link href="/explore" className="hidden text-xs text-muted tracking-wider uppercase hover:text-foreground sm:block">
              探す
            </Link>
            {isLoggedIn ? (
              <Link href="/home" className="text-xs font-semibold tracking-wider uppercase">
                マイページ
              </Link>
            ) : (
              <a href={loginUrl} className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                {isMobile && <LineIcon size={14} />}
                ログイン
              </a>
            )}
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </header>

      {/* Hero -- Split */}
      <section className="relative min-h-screen pt-16">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 sm:grid-cols-2">
          {/* Left */}
          <div className="flex flex-col justify-center px-6 py-16 sm:px-12 sm:py-24">
            <div className="max-w-md">
              <p className="text-xs font-medium tracking-[0.2em] text-accent-dark uppercase">LINE x Reservation</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                予約体験を
                <br />
                再定義する。
              </h1>
              <p className="mt-6 text-base leading-relaxed text-muted sm:text-lg">
                LINEアカウントだけで、アプリ不要・登録不要・完全無料。
                お客さまも事業主も、シンプルな予約体験を。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {!isLoggedIn ? (
                  <>
                    <a
                      href={loginUrl}
                      className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-sm font-semibold text-background transition active:scale-[0.98]"
                    >
                      <LineIcon size={16} />
                      無料ではじめる
                    </a>
                    <Link
                      href="/explore"
                      className="inline-flex items-center rounded-xl border border-border px-6 py-3.5 text-sm font-medium text-muted transition active:scale-[0.98]"
                    >
                      事業主を探す
                    </Link>
                  </>
                ) : role === "provider" ? (
                  <Link href="/provider" className="inline-flex items-center rounded-xl bg-foreground px-6 py-3.5 text-sm font-semibold text-background">
                    管理画面へ
                  </Link>
                ) : (
                  <a href={registerUrl} className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-sm font-semibold text-background">
                    事業主登録
                  </a>
                )}
              </div>

              {/* Micro stats */}
              <div className="mt-10 flex gap-8">
                {[
                  { value: "0円", label: "お客さまの利用料" },
                  { value: "30秒", label: "事業主の登録時間" },
                  { value: "24h", label: "予約受付対応" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-lg font-extrabold">{s.value}</div>
                    <div className="text-[10px] text-muted">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right -- Visual */}
          <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-accent/5 to-success/5 px-6 py-16 sm:px-12">
            {/* Grid pattern */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }} />
            <div className="relative">
              <MockupPhone variant="booking" />
              {/* Decorative elements */}
              <div className="absolute -left-8 -top-8 h-16 w-16 rounded-full border border-accent/20" />
              <div className="absolute -bottom-4 -right-12 h-24 w-24 rounded-full border border-success/20" />
              <div className="absolute -right-4 top-1/3 h-3 w-3 rounded-full bg-accent/40" />
            </div>
          </div>
        </div>
      </section>

      {/* Section: Customer Value -- Split Left text / Right visual */}
      <section className="border-t border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2">
          {/* Left: Text */}
          <div className="flex flex-col justify-center px-6 py-16 sm:px-12 sm:py-24">
            <div className="max-w-md">
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-success" />
                <p className="text-xs font-medium tracking-[0.15em] text-success uppercase">For Customers</p>
              </div>
              <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl lg:text-4xl">
                LINEで、
                <br />
                かんたん予約。
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                新しいアプリも、会員登録も、費用も不要。
                LINEアカウントがあれば、QRコードを読み取って
                そのまま予約できます。
              </p>

              <div className="mt-8 space-y-6">
                {[
                  {
                    num: "01",
                    title: "QRコードで即アクセス",
                    desc: "事業主のQRコードをスマホで読み取るだけ。面倒なアプリダウンロードやアカウント作成は一切不要。",
                  },
                  {
                    num: "02",
                    title: "空き時間を見てワンタップ予約",
                    desc: "リアルタイムの空き状況を確認して、希望の日時をタップ。その場で予約が確定します。",
                  },
                  {
                    num: "03",
                    title: "LINEで通知が届く",
                    desc: "予約確認・前日リマインダーがLINEのトーク画面に届きます。忘れる心配はありません。",
                  },
                ].map((item) => (
                  <div key={item.num} className="flex gap-4">
                    <span className="shrink-0 text-2xl font-extrabold text-success/20">{item.num}</span>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative flex items-center justify-center overflow-hidden bg-success/3 px-6 py-16 sm:px-12">
            <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }} />
            <div className="relative">
              <MockupPhone variant="notification" />
            </div>
          </div>
        </div>
      </section>

      {/* Section: Provider Value -- Split Right text / Left visual (reversed) */}
      <section className="border-t border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2">
          {/* Left: Visual */}
          <div className="relative order-2 flex items-center justify-center overflow-hidden bg-accent/3 px-6 py-16 sm:order-1 sm:px-12">
            <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }} />
            <div className="relative">
              <MockupPhone variant="dashboard" />
            </div>
          </div>

          {/* Right: Text */}
          <div className="order-1 flex flex-col justify-center px-6 py-16 sm:order-2 sm:px-12 sm:py-24">
            <div className="max-w-md">
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-accent" />
                <p className="text-xs font-medium tracking-[0.15em] text-accent-dark uppercase">For Business Owners</p>
              </div>
              <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl lg:text-4xl">
                予約管理を、
                <br />
                自動化する。
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                LINE公式アカウントを起点に、予約受付からスケジュール管理、
                リマインド通知まで自動化。対応漏れ・二重予約をゼロに。
              </p>

              <div className="mt-8 space-y-6">
                {[
                  {
                    num: "01",
                    title: "30秒で事業主登録",
                    desc: "LINEアカウントでログインして、プロフィールを入力。メールもパスワードも不要です。",
                  },
                  {
                    num: "02",
                    title: "24時間自動で予約受付",
                    desc: "空き時間の計算、重複防止、LINE通知まで全自動。営業時間外も予約を逃しません。",
                  },
                  {
                    num: "03",
                    title: "QRコードで簡単に集客",
                    desc: "専用のQRコード・URLを名刺やSNSに掲載。お客さまを直接予約ページに誘導できます。",
                  },
                  {
                    num: "04",
                    title: "カレンダーと同期",
                    desc: "Google・Appleカレンダーとワンタップで連携。既存のスケジュール管理と一元化。",
                  },
                ].map((item) => (
                  <div key={item.num} className="flex gap-4">
                    <span className="shrink-0 text-2xl font-extrabold text-accent/20">{item.num}</span>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                {!isLoggedIn ? (
                  <a
                    href={loginUrl}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 active:scale-[0.98]"
                  >
                    <LineIcon size={16} />
                    無料で事業主登録
                  </a>
                ) : role !== "provider" ? (
                  <a
                    href={registerUrl}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white"
                  >
                    事業主登録を始める
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features -- Horizontal scroll on mobile, grid on desktop */}
      <section className="border-t border-border py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-12">
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-foreground/30" />
            <p className="text-xs font-medium tracking-[0.15em] text-muted uppercase">All Features</p>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">すべての機能</h2>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            {[
              { label: "予約受付・管理", desc: "24時間自動受付、排他制御で二重予約防止" },
              { label: "LINE通知", desc: "Flex Messageで予約確認・リマインダー自動送信" },
              { label: "カレンダー同期", desc: "Google・Apple カレンダーとワンタップ連携" },
              { label: "QRコード・URL", desc: "専用の予約ページURLとQRコードを自動発行" },
              { label: "営業時間設定", desc: "曜日ごとの営業時間・定休日を柔軟に設定" },
              { label: "インターバル管理", desc: "予約前後のバッファ時間を設定" },
              { label: "プロフィールページ", desc: "ホームページ代わりの事業主プロフィール" },
              { label: "メニュー管理", desc: "サービス名・料金・所要時間を登録" },
            ].map((f) => (
              <div key={f.label} className="group rounded-xl border border-border bg-card p-4 transition hover:border-accent/30 sm:p-5">
                <p className="text-sm font-bold">{f.label}</p>
                <p className="mt-1 text-xs text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing -- Minimal */}
      <section className="border-t border-border bg-card/30 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 sm:px-12">
          <div className="text-center">
            <p className="text-xs font-medium tracking-[0.15em] text-muted uppercase">Pricing</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">料金</h2>
            <p className="mt-2 text-sm text-muted">お客さまは完全無料。シンプルな料金体系。</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
            {[
              {
                name: "ベーシック",
                price: "500",
                desc: "予約管理の基本機能",
                features: ["予約受付・管理", "サービスメニュー", "営業時間設定", "プロフィールページ", "QRコード発行"],
              },
              {
                name: "スタンダード",
                price: "980",
                desc: "LINE通知 + 分析",
                recommended: true,
                trial: true,
                features: ["ベーシック全機能", "LINE通知", "カレンダー同期", "顧客管理", "予約分析"],
              },
              {
                name: "チーム",
                price: "3,980",
                desc: "複数スタッフ対応",
                comingSoon: true,
                features: ["スタンダード全機能", "スタッフ管理", "シフト管理", "権限管理", "チーム分析"],
              },
            ].map((plan) => (
              <div key={plan.name} className={`relative flex flex-col bg-card p-6 sm:p-8 ${plan.recommended ? "bg-foreground text-background" : ""}`}>
                {plan.recommended && (
                  <div className="mb-3 w-fit rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-white">
                    おすすめ / 初月無料
                  </div>
                )}
                {plan.comingSoon && (
                  <div className="mb-3 w-fit rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    Coming Soon
                  </div>
                )}
                <p className={`text-xs font-medium tracking-wider uppercase ${plan.recommended ? "text-accent-light" : "text-muted"}`}>
                  {plan.name}
                </p>
                <div className="mt-1 flex items-baseline gap-0.5">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className={`text-xs ${plan.recommended ? "text-background/50" : "text-muted"}`}>円/月</span>
                </div>
                <p className={`mt-1 text-xs ${plan.recommended ? "text-background/60" : "text-muted"}`}>{plan.desc}</p>
                <div className="my-4 h-px bg-current opacity-10" />
                <ul className="flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <div className={`h-1 w-1 rounded-full ${plan.recommended ? "bg-accent-light" : "bg-accent"}`} />
                      <span className={plan.recommended ? "text-background/80" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA -- Full width split */}
      {!isLoggedIn && (
        <section className="border-t border-border">
          <div className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2">
            <div className="flex flex-col justify-center px-6 py-16 sm:px-12 sm:py-24">
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                はじめよう。
              </h2>
              <p className="mt-4 text-sm text-muted sm:text-base">
                LINEアカウントだけで、今すぐ無料で。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={loginUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-sm font-semibold text-background active:scale-[0.98]"
                >
                  <LineIcon size={16} />
                  無料ではじめる
                </a>
                <Link
                  href="/explore"
                  className="inline-flex items-center rounded-xl border border-border px-6 py-3.5 text-sm font-medium text-muted active:scale-[0.98]"
                >
                  事業主を探す
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center bg-gradient-to-br from-accent/5 to-success/5 px-6 py-16 sm:px-12">
              <div className="relative">
                <MockupPhone variant="profile" className="scale-90" />
              </div>
            </div>
          </div>
        </section>
      )}

      <PublicFooter maxWidth="max-w-7xl" />
    </div>
  );
}
