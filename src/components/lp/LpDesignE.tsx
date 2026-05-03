import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { LineIcon } from "@/components/icons";
import { MockupPhone } from "@/components/lp/MockupPhone";
import { buildLiffUrl } from "@/lib/device";

/**
 * LP Design E -- "Bold Gradient & Cards"
 *
 * unipos.me/ja をインスピレーションとした大胆なグラデーション背景、
 * カード型セクション、アイコン重視の機能紹介、明るくポジティブなトーン。
 * パープル〜ブルーのグラデーションをアクセントに使い、
 * 白ベースのカードで情報を整理する洗練されたデザイン。
 */
export function LpDesignE({
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
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-10">
          <img src="/logo.svg" alt="PeCo" className="h-6 sm:h-7" />
          <nav className="hidden items-center gap-6 text-[13px] sm:flex">
            <a href="#value" className="text-gray-500 transition hover:text-gray-900">特長</a>
            <a href="#for-customer" className="text-gray-500 transition hover:text-gray-900">予約する方</a>
            <a href="#for-provider" className="text-gray-500 transition hover:text-gray-900">事業主の方</a>
            <a href="#pricing" className="text-gray-500 transition hover:text-gray-900">料金</a>
            <Link href="/explore" className="text-gray-500 transition hover:text-gray-900">事業主を探す</Link>
          </nav>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/home" className="rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-[#6366F1]/20">
                マイページ
              </Link>
            ) : (
              <a href={loginUrl} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-[#6366F1]/20">
                {isMobile && <LineIcon size={14} />}
                ログイン
              </a>
            )}
          </div>
        </div>
        <div className="h-px bg-gray-100" />
      </header>

      {/* Hero -- Full gradient background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#6366F1] via-[#7C3AED] to-[#A855F7] pb-20 pt-16 sm:pb-32 sm:pt-24">
        {/* Background pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute left-0 top-0 h-full w-full" style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)",
          }} />
        </div>
        {/* Floating shapes */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[10%] top-[20%] h-32 w-32 rounded-full border border-white/10" />
          <div className="absolute right-[15%] top-[30%] h-20 w-20 rounded-full border border-white/10" />
          <div className="absolute bottom-[20%] left-[30%] h-16 w-16 rounded-full bg-white/5" />
        </div>

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 sm:grid-cols-2 sm:gap-16 sm:px-10">
          {/* Left: Text */}
          <div className="flex flex-col justify-center text-white">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 backdrop-blur-sm">
              <span className="text-xs font-semibold">LINE x Reservation Platform</span>
            </div>

            <h1 className="mt-6 text-[2.5rem] font-extrabold leading-[1.08] tracking-tight sm:text-[3.5rem]">
              LINEで始める、
              <br />
              スマートな予約。
            </h1>

            <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
              アプリ不要、登録不要、完全無料。
              LINEアカウントがあれば、お客さまも事業主も、
              すべてがシンプルに。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {!isLoggedIn ? (
                <>
                  <a
                    href={loginUrl}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-[#6366F1] shadow-xl shadow-black/10 transition active:scale-[0.98]"
                  >
                    <LineIcon size={18} />
                    無料ではじめる
                  </a>
                  <Link
                    href="/explore"
                    className="inline-flex items-center rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition active:scale-[0.98]"
                  >
                    事業主を探す
                  </Link>
                </>
              ) : role === "provider" ? (
                <Link href="/provider" className="inline-flex items-center rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-[#6366F1]">
                  管理画面へ
                </Link>
              ) : (
                <a href={registerUrl} className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-[#6366F1]">
                  {isMobile && <LineIcon size={18} />}
                  事業主登録
                </a>
              )}
            </div>

            {/* Micro stats */}
            <div className="mt-10 flex gap-8">
              {[
                { value: "0", unit: "円", label: "お客さまの利用料" },
                { value: "30", unit: "秒", label: "事業主の登録時間" },
                { value: "24", unit: "h", label: "予約受付対応" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-extrabold">{s.value}</span>
                    <span className="text-sm font-medium text-white/60">{s.unit}</span>
                  </div>
                  <div className="text-[10px] text-white/50">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Phone mockup */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-white/10 blur-xl" />
              <MockupPhone variant="booking" className="relative z-10" />
              {/* Floating notification */}
              <div className="absolute -left-6 top-10 z-20 rounded-xl bg-white p-2.5 shadow-xl sm:-left-12">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6366F1]/10">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-gray-900">新しい予約</div>
                    <div className="text-[8px] text-gray-500">田中さま / 10:00</div>
                  </div>
                </div>
              </div>
              {/* Floating check */}
              <div className="absolute -right-2 bottom-24 z-20 rounded-xl bg-white p-2.5 shadow-xl sm:-right-8">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-bold text-gray-900">LINE通知済</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute -bottom-1 left-0 w-full">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Value propositions -- Card grid */}
      <section id="value" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-10">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#6366F1]/5 px-4 py-1.5">
              <span className="text-xs font-bold text-[#6366F1]">Why PeCo?</span>
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-gray-900 sm:text-4xl">
              PeCoが選ばれる理由
            </h2>
            <p className="mt-3 text-sm text-gray-500 sm:text-base">
              LINEを起点にしたシンプルな予約体験で、お客さまも事業主も楽になります。
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <PhoneIcon />,
                title: "アプリ不要",
                desc: "LINEアカウントがあればOK。新しいアプリのダウンロードや面倒な会員登録は一切不要。",
                bg: "bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF]",
                iconBg: "bg-[#6366F1]/10",
                iconColor: "text-[#6366F1]",
              },
              {
                icon: <CreditCardIcon />,
                title: "完全無料",
                desc: "お客さまは完全無料で利用可能。隠れた費用は一切ありません。LINEで予約するだけ。",
                bg: "bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7]",
                iconBg: "bg-success/10",
                iconColor: "text-success",
              },
              {
                icon: <LightningIcon />,
                title: "30秒で開始",
                desc: "事業主登録はLINEログイン + プロフィール入力のみ。メールもパスワードも不要。",
                bg: "bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5]",
                iconBg: "bg-[#F97316]/10",
                iconColor: "text-[#F97316]",
              },
              {
                icon: <BellIcon />,
                title: "LINE通知",
                desc: "予約確認・前日リマインダーをLINE Flex Messageで自動送信。漏れなく確実に届けます。",
                bg: "bg-gradient-to-br from-[#FDF2F8] to-[#FCE7F3]",
                iconBg: "bg-[#EC4899]/10",
                iconColor: "text-[#EC4899]",
              },
              {
                icon: <CalendarSyncIcon />,
                title: "カレンダー同期",
                desc: "Google・Appleカレンダーとワンタップで連携。既存のスケジュール管理と一元化。",
                bg: "bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE]",
                iconBg: "bg-[#8B5CF6]/10",
                iconColor: "text-[#8B5CF6]",
              },
              {
                icon: <QRIcon />,
                title: "QRコード集客",
                desc: "専用のQRコード・URLを名刺やSNSに掲載。お客さまを直接予約ページに誘導。",
                bg: "bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5]",
                iconBg: "bg-[#10B981]/10",
                iconColor: "text-[#10B981]",
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`group rounded-2xl ${card.bg} p-6 transition hover:shadow-lg sm:p-7`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
                  {card.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Customers -- Split */}
      <section id="for-customer" className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 sm:grid-cols-2 sm:gap-16 sm:px-10">
          {/* Left: Text */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-success/10 px-3.5 py-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <span className="text-xs font-bold text-success">予約する方へ</span>
            </div>

            <h2 className="mt-4 text-2xl font-extrabold text-gray-900 sm:text-3xl">
              LINEで完結する
              <br />
              かんたん予約体験
            </h2>
            <p className="mt-3 text-[15px] text-gray-500">
              QRコードを読み取るだけでLINEアプリ内に予約画面が開きます。
              新しいアプリのダウンロードも、会員登録も不要です。
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  title: "QRコードで即アクセス",
                  desc: "事業主のQRを読み取るだけ。アプリDL・アカウント作成は一切不要。",
                  num: "01",
                },
                {
                  title: "空き時間からワンタップ予約",
                  desc: "リアルタイムの空き状況を確認して、希望の日時をタップで予約確定。",
                  num: "02",
                },
                {
                  title: "LINEでリマインド通知",
                  desc: "予約確認・前日リマインダーがLINEに届くので予約を忘れない。",
                  num: "03",
                },
                {
                  title: "カレンダーにワンタップ追加",
                  desc: "Google・Appleカレンダーに予約をワンタップで追加できます。",
                  num: "04",
                },
              ].map((item) => (
                <div key={item.num} className="flex gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-xs font-bold text-white">
                    {item.num}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Mockup */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[#6366F1]/5 to-[#A855F7]/5" />
              <MockupPhone variant="notification" className="relative z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* For Providers */}
      <section id="for-provider" className="py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 sm:grid-cols-2 sm:gap-16 sm:px-10">
          {/* Left: Mockup */}
          <div className="order-2 flex items-center justify-center sm:order-1">
            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[#8B5CF6]/5 to-[#6366F1]/5" />
              <MockupPhone variant="dashboard" className="relative z-10" />
            </div>
          </div>

          {/* Right: Text */}
          <div className="order-1 flex flex-col justify-center sm:order-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#6366F1]/10 px-3.5 py-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6366F1]">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 7h10M7 12h10M7 17h4" />
              </svg>
              <span className="text-xs font-bold text-[#6366F1]">事業主の方へ</span>
            </div>

            <h2 className="mt-4 text-2xl font-extrabold text-gray-900 sm:text-3xl">
              予約管理を自動化して
              <br />
              本業に集中
            </h2>
            <p className="mt-3 text-[15px] text-gray-500">
              LINE公式アカウントを起点に、予約受付からスケジュール管理まで自動化。
              対応漏れ・二重予約をゼロにします。
            </p>

            <div className="mt-8 space-y-3">
              {[
                {
                  title: "30秒で事業主登録",
                  desc: "LINEアカウントでログインして、プロフィールを入力するだけ。すぐに予約受付を開始。",
                },
                {
                  title: "予約管理を自動化",
                  desc: "空き時間の計算、予約の重複防止、LINE通知を自動で処理。",
                },
                {
                  title: "QRコードで集客",
                  desc: "専用のQRコード・URLを名刺やSNSに掲載。お客さまを直接誘導。",
                },
                {
                  title: "カレンダーと同期",
                  desc: "Google・Appleカレンダーとワンタップで連携。一元管理が可能に。",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              {!isLoggedIn ? (
                <a
                  href={loginUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#6366F1]/20 transition active:scale-[0.98]"
                >
                  <LineIcon size={18} />
                  無料で事業主登録
                </a>
              ) : role !== "provider" ? (
                <a
                  href={registerUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-7 py-3.5 text-sm font-semibold text-white"
                >
                  事業主登録を始める
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-br from-[#6366F1] via-[#7C3AED] to-[#A855F7] py-16 text-white sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-10">
          <div className="text-center">
            <p className="text-xs font-bold tracking-wider uppercase text-white/60">How it Works</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">はじめかた</h2>
            <p className="mt-2 text-sm text-white/60">たった3ステップで予約受付を開始できます</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "LINEでログイン",
                desc: "LINEアカウントでワンタップログイン。新しいパスワードを覚える必要はありません。",
              },
              {
                step: "2",
                title: "プロフィール・メニューを設定",
                desc: "屋号、サービスメニュー、営業時間を入力。ステップウィザードで迷わず完了。",
              },
              {
                step: "3",
                title: "QRコードを共有して受付開始",
                desc: "専用のURLとQRコードを取得。お客さまに共有すれば、すぐに予約受付がスタート。",
              },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 2 && (
                  <div className="absolute -right-3 top-10 hidden h-px w-6 bg-white/20 sm:block" />
                )}
                <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm sm:p-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-extrabold text-[#6366F1]">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-white/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-10">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#6366F1]/5 px-4 py-1.5">
              <span className="text-xs font-bold text-[#6366F1]">Pricing</span>
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-gray-900 sm:text-3xl">シンプルな料金体系</h2>
            <p className="mt-3 text-sm text-gray-500">お客さまは完全無料。事業主向けのわかりやすい料金プラン。</p>
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
                    ? "bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-xl shadow-[#6366F1]/20"
                    : "bg-white ring-1 ring-gray-200"
                }`}
              >
                {plan.trial && (
                  <div className="absolute -top-3 right-4 rounded-full bg-white px-3 py-0.5 text-[10px] font-bold text-[#6366F1] shadow-md">
                    1ヶ月無料
                  </div>
                )}
                {plan.comingSoon && (
                  <div className="absolute -top-3 right-4 rounded-full bg-gray-500 px-3 py-0.5 text-[10px] font-bold text-white">
                    Coming Soon
                  </div>
                )}
                <p className={`text-sm font-semibold ${plan.accent ? "text-white/70" : "text-gray-500"}`}>
                  {plan.name}
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{plan.price.toLocaleString()}</span>
                  <span className={`text-sm ${plan.accent ? "text-white/50" : "text-gray-500"}`}>円/月</span>
                </div>
                <p className={`mt-1 text-xs ${plan.accent ? "text-white/50" : "text-gray-500"}`}>{plan.desc}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`mt-0.5 shrink-0 ${plan.accent ? "text-white/70" : "text-[#6366F1]"}`}>
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

      {/* FAQ */}
      <section className="border-t border-gray-100 bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-10">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">よくある質問</h2>
          </div>
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
                a: "いいえ。PeCoが共通のLINE公式アカウントを運営しており、事業主の方はLINE個人アカウントで登録するだけで始められます。",
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-6">
                <h3 className="font-bold text-gray-900">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {!isLoggedIn && (
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-10">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6366F1] via-[#7C3AED] to-[#A855F7] p-10 text-white sm:p-16">
              {/* Background elements */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[10%] top-[20%] h-24 w-24 rounded-full border border-white/10" />
                <div className="absolute bottom-[10%] right-[15%] h-16 w-16 rounded-full bg-white/5" />
              </div>
              <div className="relative">
                <h2 className="text-2xl font-extrabold sm:text-3xl">
                  LINEで始める、スマートな予約。
                </h2>
                <p className="mt-3 text-sm text-white/60 sm:text-base">
                  LINEアカウントだけで、今すぐ無料ではじめられます。
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
                  <a
                    href={loginUrl}
                    className="flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-[#6366F1] shadow-xl shadow-black/10 active:scale-[0.98] sm:w-auto sm:px-8"
                  >
                    <LineIcon />
                    無料ではじめる
                  </a>
                  <Link
                    href="/explore"
                    className="flex w-full max-w-xs items-center justify-center rounded-xl border border-white/30 bg-white/10 py-3.5 text-sm font-semibold text-white backdrop-blur-sm active:scale-[0.98] sm:w-auto sm:px-8"
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
function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" />
    </svg>
  );
}
function CreditCardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
    </svg>
  );
}
function LightningIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function CalendarSyncIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function QRIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M17 17h4v4M14 21h3" />
    </svg>
  );
}
