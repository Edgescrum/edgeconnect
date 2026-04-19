import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";

const PROBLEMS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
      </svg>
    ),
    title: "予約が電話・DM・LINEに分散",
    description: "対応漏れや二重予約が起きやすい",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    title: "スケジュール管理が手作業",
    description: "空き時間の把握・共有に手間がかかる",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "ITツール導入のハードルが高い",
    description: "複雑な設定や高い月額費用がネック",
  },
];

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#06C755]">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
    ),
    title: "LINE連携",
    description: "予約確定・リマインダー・キャンセル通知をLINEで自動送信",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
    title: "カレンダー同期",
    description: "Google/Appleカレンダーに予約を自動反映",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 7h10M7 12h10M7 17h4" />
      </svg>
    ),
    title: "QRコードで共有",
    description: "あなた専用の予約ページURLとQRコードを自動発行",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
    title: "営業時間・インターバル管理",
    description: "曜日ごとの営業時間と予約間のバッファを自動計算",
  },
];

const STEPS_PROVIDER = [
  { step: "1", title: "LINEで登録", description: "LINEアカウントで簡単に事業主登録" },
  { step: "2", title: "メニュー設定", description: "サービス内容・料金・営業時間を設定" },
  { step: "3", title: "QRコードを共有", description: "お客さまにシェアして予約受付開始" },
];

const STEPS_CUSTOMER = [
  { step: "1", title: "QRコードを読み取り", description: "事業主のQRコードやURLにアクセス" },
  { step: "2", title: "メニューを選択", description: "サービス内容を確認して希望メニューを選択" },
  { step: "3", title: "日時を選んで予約", description: "空き枠から日時を選んでワンタップで確定" },
];

const LINE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

export function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
              E
            </div>
            <span className="text-sm font-bold">EdgeConnect</span>
          </div>
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

      {/* Hero */}
      <section className="bg-gradient-to-b from-accent/8 to-background px-4 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-accent text-3xl font-bold text-white shadow-xl shadow-accent/20 sm:h-24 sm:w-24 sm:text-4xl">
            E
          </div>
          <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl sm:leading-tight">
            予約管理を
            <br className="sm:hidden" />
            <span className="text-accent"> もっとシンプルに</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted sm:mt-6 sm:text-base">
            LINEで予約受付・通知・スケジュール管理を自動化。
            <br />
            個人事業主のための無料予約プラットフォーム。
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
            <a href="/?action=login" className="flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3.5 text-base font-semibold text-white shadow-lg shadow-[#06C755]/25 active:scale-[0.98] sm:w-auto sm:px-8">
              {LINE_ICON}
              無料ではじめる
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

      {/* 課題提起 */}
      <section className="px-4 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-lg font-bold sm:text-2xl">
            予約管理、こんな悩みありませんか？
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-3">
            {PROBLEMS.map((p, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-2xl bg-card p-4 ring-1 ring-border sm:flex-col sm:items-center sm:p-6 sm:text-center"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-400 sm:h-14 sm:w-14">
                  {p.icon}
                </div>
                <div>
                  <p className="font-semibold sm:mt-3">{p.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 解決策 */}
      <section className="bg-card/60 px-4 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-lg font-bold sm:text-2xl">
            EdgeConnectが<span className="text-accent">すべて解決</span>
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            必要な機能がすべて無料で使えます
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl bg-card p-4 ring-1 ring-border sm:p-5"
              >
                <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/8 sm:h-12 sm:w-12">
                    {f.icon}
                  </div>
                  <p className="font-semibold text-sm sm:mt-3">{f.title}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使い方ステップ */}
      <section className="px-4 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-lg font-bold sm:text-2xl">かんたん3ステップ</h2>

          <div className="mt-8 grid grid-cols-1 gap-12 sm:mt-12 lg:grid-cols-2 lg:gap-16">
            {/* 事業主 */}
            <div>
              <p className="text-center text-xs font-semibold uppercase tracking-wider text-accent lg:text-left">
                事業主の方
              </p>
              <div className="mt-4 space-y-3">
                {STEPS_PROVIDER.map((s) => (
                  <div key={s.step} className="flex items-start gap-4 rounded-2xl bg-card p-4 ring-1 ring-border">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                      {s.step}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{s.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* お客さん */}
            <div>
              <p className="text-center text-xs font-semibold uppercase tracking-wider text-[#06C755] lg:text-left">
                お客さま
              </p>
              <div className="mt-4 space-y-3">
                {STEPS_CUSTOMER.map((s) => (
                  <div key={s.step} className="flex items-start gap-4 rounded-2xl bg-card p-4 ring-1 ring-border">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#06C755] text-sm font-bold text-white">
                      {s.step}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{s.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 料金 */}
      <section className="bg-card/60 px-4 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-lg font-bold sm:text-2xl">料金プラン</h2>
          <div className="mx-auto mt-8 max-w-sm rounded-2xl bg-card p-6 ring-1 ring-border sm:mt-12 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Free
            </p>
            <p className="mt-2 text-4xl font-extrabold sm:text-5xl">
              ¥0<span className="text-base font-normal text-muted">/月</span>
            </p>
            <ul className="mt-6 space-y-2.5 text-left text-sm">
              {[
                "予約受付・管理",
                "サービスメニュー登録",
                "営業時間・インターバル設定",
                "LINE通知（予約確定・リマインダー）",
                "カレンダー同期",
                "QRコード・URL発行",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-accent">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <a href="/?action=login" className="mt-6 flex w-full items-center justify-center rounded-xl bg-accent py-3 font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]">
              無料ではじめる
            </a>
          </div>
          <p className="mt-4 text-xs text-muted">
            有料プラン（決済連携・分析機能等）は今後追加予定
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-xl font-bold sm:text-3xl">
            今すぐ、予約管理を
            <br className="sm:hidden" />
            シンプルにしませんか？
          </h2>
          <p className="mt-3 text-sm text-muted sm:mt-4 sm:text-base">
            LINEアカウントがあれば30秒で始められます
          </p>
          <a href="/?action=login" className="mx-auto mt-8 flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3.5 text-base font-semibold text-white shadow-lg shadow-[#06C755]/25 active:scale-[0.98] sm:w-auto sm:px-10">
            {LINE_ICON}
            無料ではじめる
          </a>
        </div>
      </section>

      <PublicFooter maxWidth="max-w-5xl" />
    </div>
  );
}
