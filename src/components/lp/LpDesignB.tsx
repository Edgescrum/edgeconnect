import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { PlanCarousel } from "@/components/PlanCarousel";
import { LineIcon } from "@/components/icons";
import { MockupPhone } from "@/components/lp/MockupPhone";
import { buildLiffUrl } from "@/lib/device";

/**
 * LP Design B -- "Clean & Structured"
 *
 * reserva.be をインスピレーションとした構造的なレイアウト。
 * タブ切り替え風のセクション分け、機能カード型グリッド、
 * ステップバイステップの導線、信頼感のあるデザイン。
 */
export function LpDesignB({
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-10">
          <img src="/logo.svg" alt="PeCo" className="h-6 sm:h-7" />
          <nav className="hidden items-center gap-6 text-sm sm:flex">
            <a href="#features" className="text-muted transition hover:text-foreground">機能</a>
            <a href="#flow" className="text-muted transition hover:text-foreground">使い方</a>
            <a href="#pricing" className="text-muted transition hover:text-foreground">料金</a>
            <Link href="/explore" className="text-muted transition hover:text-foreground">事業主を探す</Link>
          </nav>
          {isLoggedIn ? (
            <Link href="/home" className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white">
              マイページ
            </Link>
          ) : (
            <a href={loginUrl} className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white">
              {isMobile && <LineIcon size={14} />}
              {isMobile ? "LINEでログイン" : "ログイン"}
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-accent/5 via-white to-success/5 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 sm:grid-cols-2 sm:gap-16 sm:px-10">
          {/* Left: Text */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl sm:leading-[1.15]">
              LINEだけで完結する
              <br />
              <span className="text-accent">予約管理</span>プラットフォーム
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:mt-6 sm:text-base sm:leading-relaxed">
              お客さまはLINEアカウントがあればアプリ不要・登録不要・完全無料で予約。
              事業主はLINE公式アカウントを起点に、予約受付からスケジュール管理まで自動化できます。
            </p>

            {/* Badge row */}
            <div className="mt-6 flex flex-wrap gap-2">
              {["アプリDL不要", "完全無料", "30秒で登録", "LINE連携"].map((badge) => (
                <span key={badge} className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent-dark">
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {!isLoggedIn && (
                <>
                  <a
                    href={loginUrl}
                    className="inline-flex items-center gap-2 rounded-xl bg-success px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-success/20 active:scale-[0.98]"
                  >
                    <LineIcon size={18} />
                    無料ではじめる
                  </a>
                  <Link
                    href="/explore"
                    className="inline-flex items-center rounded-xl border border-border px-6 py-3.5 text-sm font-semibold text-muted active:scale-[0.98]"
                  >
                    事業主を探す
                  </Link>
                </>
              )}
              {isLoggedIn && role === "provider" && (
                <Link href="/provider" className="inline-flex items-center rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white">
                  管理画面へ
                </Link>
              )}
              {isLoggedIn && role !== "provider" && (
                <a href={registerUrl} className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white">
                  事業主登録
                </a>
              )}
            </div>
          </div>

          {/* Right: Phone mockups stacked */}
          <div className="relative flex items-center justify-center">
            <div className="relative">
              <MockupPhone variant="booking" />
              <div className="absolute -bottom-4 -right-8 hidden sm:block">
                <div className="w-[160px] rounded-2xl border-[4px] border-foreground/70 bg-white p-0.5 shadow-xl">
                  <div className="absolute left-1/2 top-0 z-10 h-3 w-12 -translate-x-1/2 rounded-b-lg bg-foreground/70" />
                  <div className="overflow-hidden rounded-[0.8rem] bg-background px-2 pb-3 pt-5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full bg-success flex items-center justify-center">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /></svg>
                      </div>
                      <div className="h-1.5 w-8 rounded bg-foreground/60" />
                    </div>
                    <div className="mt-2 rounded-lg bg-success/10 p-1.5">
                      <div className="text-[6px] font-bold text-success">予約確定</div>
                      <div className="mt-0.5 text-[5px] text-muted">5/15 10:00</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-audience section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-10">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              予約する人も、受ける人も
            </h2>
            <p className="mt-2 text-sm text-muted sm:text-base">PeCoは両方にとってかんたんな予約体験を提供します</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {/* Customer side */}
            <div className="rounded-2xl bg-gradient-to-br from-success/5 to-transparent p-6 ring-1 ring-success/10 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">予約する方</h3>
                  <p className="text-xs text-success font-medium">完全無料 / 登録不要</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  { icon: "scan", title: "QRコードで即アクセス", desc: "アプリのダウンロード不要。QRコードを読み取るだけで予約ページにアクセス。" },
                  { icon: "calendar", title: "空き時間からワンタップ予約", desc: "リアルタイムの空き状況を確認して、その場で予約確定。" },
                  { icon: "bell", title: "LINEでリマインド通知", desc: "予約確認・前日リマインダーがLINEに届くので忘れない。" },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-success/10">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Provider side */}
            <div className="rounded-2xl bg-gradient-to-br from-accent/5 to-transparent p-6 ring-1 ring-accent/10 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 7h10M7 12h10M7 17h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">予約を受ける方</h3>
                  <p className="text-xs text-accent-dark font-medium">月額500円から</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  { title: "予約受付を自動化", desc: "24時間365日、自動で予約受付。対応漏れ・二重予約を防止。" },
                  { title: "LINE通知で顧客体験向上", desc: "予約確定・リマインダーをLINE Flex Messageで自動送信。" },
                  { title: "QRコードで簡単集客", desc: "専用URL・QRコードを名刺やSNSに掲載して、お客さまを直接誘導。" },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="border-y border-gray-100 bg-gray-50/50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-10">
          <div className="text-center">
            <p className="text-xs font-medium tracking-wider text-accent-dark uppercase">Features</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">豊富な機能</h2>
            <p className="mt-2 text-sm text-muted">個人事業主に必要な予約管理機能をすべて搭載</p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {[
              { icon: <CalendarSvg />, label: "予約受付・管理", desc: "24時間自動受付" },
              { icon: <BellSvg />, label: "LINE通知", desc: "Flex Message自動送信" },
              { icon: <SyncSvg />, label: "カレンダー同期", desc: "Google・Apple対応" },
              { icon: <QrSvg />, label: "QRコード発行", desc: "名刺・SNSに掲載" },
              { icon: <ClockSvg />, label: "営業時間設定", desc: "曜日ごとに柔軟設定" },
              { icon: <IntervalSvg />, label: "インターバル管理", desc: "予約間のバッファ" },
              { icon: <UserSvg />, label: "プロフィールページ", desc: "ホームページ代わりに" },
              { icon: <MenuSvg />, label: "メニュー管理", desc: "料金・時間を設定" },
            ].map((f) => (
              <div key={f.label} className="group rounded-2xl bg-white p-4 ring-1 ring-gray-100 transition hover:shadow-md hover:ring-accent/20 sm:p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/8 text-accent-dark transition group-hover:bg-accent/15">
                  {f.icon}
                </div>
                <p className="mt-3 text-sm font-semibold">{f.label}</p>
                <p className="mt-0.5 text-xs text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow Section */}
      <section id="flow" className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-10">
          <div className="text-center">
            <p className="text-xs font-medium tracking-wider text-accent-dark uppercase">How to Start</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">かんたん3ステップで開始</h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "LINEで登録",
                desc: "LINEアカウントで30秒で事業主登録。メールアドレスもパスワードも不要です。",
                color: "bg-success",
              },
              {
                step: "2",
                title: "メニュー・営業時間を設定",
                desc: "サービスメニュー・料金・営業時間を入力。ステップウィザードで迷わず完了。",
                color: "bg-accent",
              },
              {
                step: "3",
                title: "QRコードを共有",
                desc: "専用のQRコード・URLをお客さまに共有。すぐに予約受付がスタートします。",
                color: "bg-foreground",
              },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i < 2 && (
                  <div className="absolute -right-3 top-8 hidden h-0.5 w-6 bg-border sm:block" />
                )}
                <div className="flex flex-col items-center rounded-2xl bg-white p-6 text-center ring-1 ring-gray-100 sm:p-8">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${s.color} text-lg font-bold text-white`}>
                    {s.step}
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-gray-100 bg-gray-50/50 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-10">
          <div className="text-center">
            <p className="text-xs font-medium tracking-wider text-accent-dark uppercase">Pricing</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">料金プラン</h2>
            <p className="mt-2 text-sm text-muted">お客さまは完全無料。事業主向けのシンプルな料金体系。</p>
          </div>

          {(() => {
            const plans = [
              {
                name: "ベーシック",
                price: 500,
                desc: "まずは予約管理を始めたい方に",
                features: ["予約受付・管理", "サービスメニュー登録", "営業時間・インターバル設定", "プロフィールページ", "QRコード・URL発行"],
              },
              {
                name: "スタンダード",
                price: 980,
                desc: "LINE通知で予約体験を向上",
                recommended: true,
                trial: true,
                features: ["ベーシックの全機能", "LINE通知（予約確定・リマインダー）", "カレンダー同期", "顧客管理", "予約分析"],
              },
              {
                name: "チーム",
                price: 3980,
                desc: "複数スタッフでの予約管理に",
                features: ["スタンダードの全機能", "スタッフ管理（最大10人）", "スタッフ別シフト管理", "権限管理", "チーム分析"],
                comingSoon: true,
              },
            ];

            const renderCard = (plan: typeof plans[number]) => (
              <div
                key={plan.name}
                className={`relative flex w-full flex-col rounded-2xl bg-white p-6 sm:p-8 ${
                  plan.recommended ? "ring-2 ring-accent shadow-lg" : "ring-1 ring-gray-200"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-4 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold text-white">
                    おすすめ
                  </div>
                )}
                {plan.comingSoon && (
                  <div className="absolute -top-3 left-4 rounded-full bg-muted/80 px-3 py-0.5 text-[10px] font-bold text-white">
                    Coming Soon
                  </div>
                )}
                <p className={`text-sm font-semibold ${plan.recommended ? "text-accent" : "text-muted"}`}>
                  {plan.name}
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{plan.price.toLocaleString()}</span>
                  <span className="text-sm text-muted">円/月</span>
                </div>
                {plan.trial && (
                  <span className="mt-1 inline-block w-fit rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                    初月無料
                  </span>
                )}
                <p className="mt-1 text-xs text-muted">{plan.desc}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 shrink-0 text-accent">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );

            return (
              <>
                <PlanCarousel hideAbove="lg">
                  {plans.map((plan) => renderCard(plan))}
                </PlanCarousel>
                <div className="mt-10 hidden items-stretch gap-6 lg:grid lg:grid-cols-3">
                  {plans.map((plan) => (
                    <div key={plan.name} className="flex">{renderCard(plan)}</div>
                  ))}
                </div>
              </>
            );
          })()}

          {/* CTA under pricing */}
          <div className="mt-10 flex flex-col items-center">
            {!isLoggedIn ? (
              <a
                href={loginUrl}
                className="flex w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-base font-semibold text-white shadow-lg shadow-accent/20 active:scale-[0.98]"
              >
                <LineIcon />
                まずは無料で始める
              </a>
            ) : role !== "provider" ? (
              <a
                href={registerUrl}
                className="flex w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-base font-semibold text-white"
              >
                事業主登録を始める
              </a>
            ) : null}
            {role !== "provider" && (
              <p className="mt-2 text-center text-xs text-muted">スタンダードプラン初月無料 / カード登録のみで課金は翌月から</p>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-10">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl">よくある質問</h2>
          <div className="mt-8 space-y-4">
            {[
              {
                q: "お客さまは本当に無料ですか？",
                a: "はい、お客さまは完全無料です。LINEアカウントがあれば、アプリのダウンロードも会員登録も不要で予約できます。",
              },
              {
                q: "どんな業種で使えますか？",
                a: "業種不問です。美容師・コーチ・講師・整体師・カウンセラーなど、予約制のサービスを提供する個人事業主の方にご利用いただけます。",
              },
              {
                q: "LINE公式アカウントは必要ですか？",
                a: "いいえ、事業主ごとのLINE公式アカウントは不要です。PeCoが共通のLINE公式アカウントを運営しており、事業主の方はLINE個人アカウントで登録するだけで始められます。",
              },
              {
                q: "予約の重複は防げますか？",
                a: "はい。同一時間帯への同時予約をシステムで排他制御しています。二重予約の心配はありません。",
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-2xl bg-white p-5 ring-1 ring-gray-100 sm:p-6">
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {!isLoggedIn && (
        <section className="border-t border-gray-100 bg-gradient-to-b from-accent/5 to-white py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-10">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              さあ、PeCoではじめましょう
            </h2>
            <p className="mt-3 text-sm text-muted sm:text-base">
              予約する方も、受ける方も、LINEアカウントだけでOK。
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <a
                href={loginUrl}
                className="flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-base font-semibold text-white shadow-lg shadow-success/20 active:scale-[0.98] sm:w-auto sm:px-8"
              >
                <LineIcon />
                LINEではじめる
              </a>
              <Link
                href="/explore"
                className="flex w-full max-w-xs items-center justify-center rounded-xl border border-gray-200 py-3.5 text-sm font-semibold text-muted active:scale-[0.98] sm:w-auto sm:px-8"
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

/* Small icon components */
function CalendarSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>;
}
function BellSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
}
function SyncSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.5 2v6h-6M2.5 22v-6h6" /><path d="M2.5 11.5a10 10 0 0 1 18.8-4.3M21.5 12.5a10 10 0 0 1-18.8 4.2" /></svg>;
}
function QrSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M17 17h4v4M14 21h3" /></svg>;
}
function ClockSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
}
function IntervalSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5v14" /></svg>;
}
function UserSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
function MenuSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6h16M4 12h16M4 18h7" /></svg>;
}
