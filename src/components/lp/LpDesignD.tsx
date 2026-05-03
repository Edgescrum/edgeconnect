import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { LineIcon } from "@/components/icons";
import { MockupPhone } from "@/components/lp/MockupPhone";
import { buildLiffUrl } from "@/lib/device";

/**
 * LP Design D -- "Warm & Human"
 *
 * herp.co.jp をインスピレーションとした温かみのあるデザイン。
 * 大きなタイポグラフィ + 柔らかいグラデーション背景、
 * カード型レイアウトと人間味のあるイラスト的要素。
 * セクション間に余白をたっぷり取り、読みやすさを重視。
 */
export function LpDesignD({
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
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#E8E6E1] bg-[#FAFAF8]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-10">
          <img src="/logo.svg" alt="PeCo" className="h-6 sm:h-7" />
          <nav className="hidden items-center gap-7 text-[13px] sm:flex">
            <a href="#features" className="text-[#706D65] transition hover:text-foreground">機能</a>
            <a href="#for-customer" className="text-[#706D65] transition hover:text-foreground">予約する方</a>
            <a href="#for-provider" className="text-[#706D65] transition hover:text-foreground">事業主の方</a>
            <a href="#pricing" className="text-[#706D65] transition hover:text-foreground">料金</a>
            <Link href="/explore" className="text-[#706D65] transition hover:text-foreground">事業主を探す</Link>
          </nav>
          {isLoggedIn ? (
            <Link href="/home" className="rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-white">
              マイページ
            </Link>
          ) : (
            <a href={loginUrl} className="flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-white">
              {isMobile && <LineIcon size={14} />}
              ログイン
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-12 sm:pb-28 sm:pt-20">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#FFE8D6]/40 blur-[80px]" />
          <div className="absolute -right-20 top-20 h-[400px] w-[400px] rounded-full bg-[#D4E8F0]/40 blur-[80px]" />
          <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-[#E0D6F0]/30 blur-[80px]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 sm:grid-cols-2 sm:gap-16 sm:px-10">
          {/* Left: Text */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-1.5 shadow-sm ring-1 ring-[#E8E6E1]">
              <div className="flex -space-x-1">
                <div className="h-4 w-4 rounded-full bg-accent/60 ring-2 ring-white" />
                <div className="h-4 w-4 rounded-full bg-success/60 ring-2 ring-white" />
                <div className="h-4 w-4 rounded-full bg-[#F0B775]/60 ring-2 ring-white" />
              </div>
              <span className="text-xs font-medium text-[#706D65]">個人事業主のための予約プラットフォーム</span>
            </div>

            <h1 className="mt-6 text-[2.5rem] font-extrabold leading-[1.1] tracking-tight text-[#1A1917] sm:text-[3.5rem]">
              予約管理を、
              <br />
              <span className="bg-gradient-to-r from-[#E07B4C] to-[#D4577A] bg-clip-text text-transparent">
                もっと自由に。
              </span>
            </h1>

            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#706D65]">
              LINEアカウントがあれば、それだけでOK。
              お客さまも事業主も、アプリ不要・完全無料ではじめられる
              予約管理プラットフォームです。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {!isLoggedIn ? (
                <>
                  <a
                    href={loginUrl}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1A1917] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1A1917]/10 transition active:scale-[0.98]"
                  >
                    <LineIcon size={18} />
                    無料ではじめる
                  </a>
                  <Link
                    href="/explore"
                    className="inline-flex items-center rounded-full border border-[#D5D3CE] bg-white px-7 py-3.5 text-sm font-medium text-[#706D65] transition hover:border-[#1A1917]/20 active:scale-[0.98]"
                  >
                    事業主を探す
                  </Link>
                </>
              ) : role === "provider" ? (
                <Link href="/provider" className="inline-flex items-center rounded-full bg-[#1A1917] px-7 py-3.5 text-sm font-semibold text-white">
                  管理画面へ
                </Link>
              ) : (
                <a href={registerUrl} className="inline-flex items-center gap-2 rounded-full bg-[#1A1917] px-7 py-3.5 text-sm font-semibold text-white">
                  {isMobile && <LineIcon size={18} />}
                  事業主登録
                </a>
              )}
            </div>
          </div>

          {/* Right: Phone mockup */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Decorative rings */}
              <div className="absolute -left-10 -top-10 h-[320px] w-[320px] rounded-full border border-[#E07B4C]/10 sm:h-[380px] sm:w-[380px]" />
              <div className="absolute -left-5 -top-5 h-[290px] w-[290px] rounded-full border border-[#D4577A]/8 sm:h-[340px] sm:w-[340px]" />
              <MockupPhone variant="booking" className="relative z-10" />
              {/* Floating card top-left */}
              <div className="absolute -left-6 top-8 z-20 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-[#E8E6E1] sm:-left-12">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-success/10">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-[#1A1917]">予約確定</div>
                    <div className="text-[9px] text-[#706D65]">LINE通知を送信しました</div>
                  </div>
                </div>
              </div>
              {/* Floating card bottom-right */}
              <div className="absolute -right-4 bottom-16 z-20 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-[#E8E6E1] sm:-right-10">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-[#1A1917]">カレンダー同期</div>
                    <div className="text-[9px] text-[#706D65]">Google / Apple 対応</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-[#E8E6E1] bg-white py-10 sm:py-14">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-5 sm:grid-cols-4 sm:px-10">
          {[
            { icon: <ShieldIcon />, label: "完全無料", sub: "お客さまの利用料金" },
            { icon: <ZapIcon />, label: "30秒で登録", sub: "事業主アカウント作成" },
            { icon: <ClockIcon />, label: "24時間対応", sub: "自動で予約受付" },
            { icon: <SmartphoneIcon />, label: "アプリ不要", sub: "LINEだけで完結" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F4F0]">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-[#1A1917]">{item.label}</p>
                <p className="text-[11px] text-[#706D65]">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features overview */}
      <section id="features" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-10">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-wider text-[#E07B4C] uppercase">Features</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#1A1917] sm:text-4xl">
              予約に必要なすべてを、
              <br className="hidden sm:block" />
              ひとつに。
            </h2>
            <p className="mt-3 text-[15px] text-[#706D65]">
              シンプルな操作で、予約受付からスケジュール管理、通知まで一元化できます。
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "予約受付・管理",
                desc: "24時間自動で予約を受付。同一時間帯の重複を排他制御で防止し、二重予約の心配をゼロに。",
                gradient: "from-[#FFE8D6] to-[#FFF3EB]",
                iconColor: "text-[#E07B4C]",
              },
              {
                title: "LINE通知",
                desc: "予約確認・前日リマインダーをLINE Flex Messageで自動送信。お客さまも事業主もLINEで完結。",
                gradient: "from-[#D4F0D6] to-[#EEFAEF]",
                iconColor: "text-success",
              },
              {
                title: "カレンダー同期",
                desc: "Google・Appleカレンダーとワンタップで連携。既存のスケジュール管理と予約を一元化。",
                gradient: "from-[#D4E8F0] to-[#EDF5F8]",
                iconColor: "text-accent",
              },
              {
                title: "QRコード・URL発行",
                desc: "あなた専用の予約ページURLとQRコードを自動発行。名刺・SNS・店頭でお客さまを直接誘導。",
                gradient: "from-[#E8D4F0] to-[#F5EDF8]",
                iconColor: "text-[#9B6BB5]",
              },
              {
                title: "営業時間・インターバル",
                desc: "曜日ごとの営業時間・定休日を柔軟に設定。予約前後のバッファ時間も自動で考慮。",
                gradient: "from-[#F0E8D4] to-[#F8F3ED]",
                iconColor: "text-[#B5906B]",
              },
              {
                title: "プロフィールページ",
                desc: "ホームページ代わりの事業主プロフィール。屋号・サービス・メニューを美しく表示。",
                gradient: "from-[#F0D4D8] to-[#F8EDEE]",
                iconColor: "text-[#D4577A]",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-[#E8E6E1] transition hover:shadow-md hover:ring-[#D5D3CE]"
              >
                <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${feature.gradient} opacity-60 transition group-hover:opacity-100`} />
                <div className="relative">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F4F0] ${feature.iconColor}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-[15px] font-bold text-[#1A1917]">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#706D65]">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Customers */}
      <section id="for-customer" className="bg-white py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 sm:grid-cols-2 sm:gap-16 sm:px-10">
          {/* Left: Text */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-success/8 px-3 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="text-xs font-semibold text-success">For Customers</span>
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-[#1A1917] sm:text-3xl">
              予約する方へ
            </h2>
            <p className="mt-3 text-[15px] text-[#706D65]">
              LINEさえあれば、新しいアプリもアカウントも不要。完全無料で、かんたんに予約できます。
            </p>

            <div className="mt-8 space-y-5">
              {[
                {
                  step: "1",
                  title: "QRコードで即アクセス",
                  desc: "事業主のQRコードをスマホで読み取るだけ。LINEアプリ内で予約画面が開きます。",
                },
                {
                  step: "2",
                  title: "空き時間を見てワンタップ予約",
                  desc: "リアルタイムの空き状況を確認して、希望の日時をタップ。その場で予約が確定。",
                },
                {
                  step: "3",
                  title: "LINEで通知が届く",
                  desc: "予約確認・前日リマインダーがLINEのトーク画面に届きます。忘れる心配はありません。",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-sm font-bold text-success">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1917]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#706D65]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Mockup */}
          <div className="flex items-center justify-center">
            <div className="relative rounded-3xl bg-gradient-to-br from-success/5 to-[#D4F0D6]/20 p-8 sm:p-12">
              <MockupPhone variant="notification" />
            </div>
          </div>
        </div>
      </section>

      {/* For Providers */}
      <section id="for-provider" className="bg-[#1A1917] py-16 text-white sm:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 sm:grid-cols-2 sm:gap-16 sm:px-10">
          {/* Left: Mockup */}
          <div className="order-2 flex items-center justify-center sm:order-1">
            <div className="relative rounded-3xl bg-white/5 p-8 sm:p-12">
              <MockupPhone variant="dashboard" />
            </div>
          </div>

          {/* Right: Text */}
          <div className="order-1 flex flex-col justify-center sm:order-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#E07B4C]/15 px-3 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#E07B4C]" />
              <span className="text-xs font-semibold text-[#E07B4C]">For Business Owners</span>
            </div>
            <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">
              事業主の方へ
            </h2>
            <p className="mt-3 text-[15px] text-white/60">
              LINE公式アカウントを起点に、予約受付からスケジュール管理まで自動化。
              対応漏れ・二重予約をゼロにします。
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  title: "30秒で事業主登録",
                  desc: "LINEアカウントでログインして、プロフィールを入力するだけ。すぐに予約受付を開始。",
                },
                {
                  title: "予約管理を自動化",
                  desc: "空き時間の計算、予約の重複防止、LINE通知を自動で処理。手動の管理から解放。",
                },
                {
                  title: "QRコードで集客",
                  desc: "専用のQRコード・URLを名刺やSNSに掲載。お客さまを直接予約ページに誘導。",
                },
                {
                  title: "カレンダーと同期",
                  desc: "Google・Appleカレンダーとワンタップで連携。スケジュール管理を一元化。",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E07B4C]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-sm text-white/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              {!isLoggedIn ? (
                <a
                  href={loginUrl}
                  className="inline-flex items-center gap-2 rounded-full bg-[#E07B4C] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#E07B4C]/20 transition active:scale-[0.98]"
                >
                  <LineIcon size={18} />
                  無料で事業主登録
                </a>
              ) : role !== "provider" ? (
                <a
                  href={registerUrl}
                  className="inline-flex items-center gap-2 rounded-full bg-[#E07B4C] px-7 py-3.5 text-sm font-semibold text-white"
                >
                  事業主登録を始める
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-10">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-wider text-[#E07B4C] uppercase">How it Works</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#1A1917] sm:text-3xl">はじめかた</h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "LINEでログイン",
                desc: "LINEアカウントでワンタップログイン。新しいパスワードを覚える必要はありません。",
                color: "bg-gradient-to-br from-[#FFE8D6] to-[#FFF3EB]",
              },
              {
                step: "02",
                title: "プロフィール・メニューを設定",
                desc: "屋号、サービスメニュー、営業時間を入力。ステップウィザードで迷わず完了。",
                color: "bg-gradient-to-br from-[#D4E8F0] to-[#EDF5F8]",
              },
              {
                step: "03",
                title: "QRコードを共有",
                desc: "専用のURLとQRコードを取得。お客さまに共有すれば、すぐに予約受付がスタート。",
                color: "bg-gradient-to-br from-[#D4F0D6] to-[#EEFAEF]",
              },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 2 && (
                  <div className="absolute -right-3 top-12 hidden h-px w-6 bg-[#D5D3CE] sm:block" />
                )}
                <div className={`rounded-2xl ${item.color} p-6 sm:p-8`}>
                  <span className="text-3xl font-extrabold text-[#1A1917]/15">{item.step}</span>
                  <h3 className="mt-3 text-lg font-bold text-[#1A1917]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#706D65]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-[#E8E6E1] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-10">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-wider text-[#E07B4C] uppercase">Pricing</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#1A1917] sm:text-3xl">シンプルな料金体系</h2>
            <p className="mt-3 text-sm text-[#706D65]">お客さまは完全無料。事業主向けのわかりやすい料金プラン。</p>
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
                    ? "bg-[#1A1917] text-white ring-0 shadow-xl"
                    : "bg-white ring-1 ring-[#E8E6E1]"
                }`}
              >
                {plan.trial && (
                  <div className="absolute -top-3 right-4 rounded-full bg-[#E07B4C] px-3 py-0.5 text-[10px] font-bold text-white">
                    1ヶ月無料
                  </div>
                )}
                {plan.comingSoon && (
                  <div className="absolute -top-3 right-4 rounded-full bg-[#706D65] px-3 py-0.5 text-[10px] font-bold text-white">
                    Coming Soon
                  </div>
                )}
                <p className={`text-sm font-semibold ${plan.accent ? "text-[#E07B4C]" : "text-[#706D65]"}`}>
                  {plan.name}
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{plan.price.toLocaleString()}</span>
                  <span className={`text-sm ${plan.accent ? "text-white/50" : "text-[#706D65]"}`}>円/月</span>
                </div>
                <p className={`mt-1 text-xs ${plan.accent ? "text-white/50" : "text-[#706D65]"}`}>{plan.desc}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`mt-0.5 shrink-0 ${plan.accent ? "text-[#E07B4C]" : "text-accent"}`}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className={plan.accent ? "text-white/80" : ""}>{f}</span>
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
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFE8D6] via-[#FFF3EB] to-[#D4E8F0] p-10 sm:p-16">
              <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: "radial-gradient(circle, #1A1917 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }} />
              <div className="relative">
                <h2 className="text-2xl font-extrabold text-[#1A1917] sm:text-3xl">
                  予約管理を、もっと自由に。
                </h2>
                <p className="mt-3 text-sm text-[#706D65] sm:text-base">
                  LINEアカウントだけで、今すぐ無料ではじめられます。
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
                  <a
                    href={loginUrl}
                    className="flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#1A1917] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1A1917]/15 active:scale-[0.98] sm:w-auto sm:px-8"
                  >
                    <LineIcon />
                    無料ではじめる
                  </a>
                  <Link
                    href="/explore"
                    className="flex w-full max-w-xs items-center justify-center rounded-full border border-[#1A1917]/20 bg-white/80 py-3.5 text-sm font-medium text-[#706D65] active:scale-[0.98] sm:w-auto sm:px-8"
                  >
                    事業主を探す
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <PublicFooter maxWidth="max-w-6xl" />
    </div>
  );
}

/* Icon components */
function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#706D65" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function ZapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#706D65" strokeWidth="1.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#706D65" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}
function SmartphoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#706D65" strokeWidth="1.5">
      <rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" />
    </svg>
  );
}
