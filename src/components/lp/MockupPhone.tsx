/**
 * スマートフォンのモックアップフレーム
 * LP デザインバリエーションで使用するイメージ画像代わりのイラスト
 */
export function MockupPhone({
  variant = "booking",
  className = "",
}: {
  variant?: "booking" | "dashboard" | "notification" | "profile" | "calendar";
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Phone frame */}
      <div className="relative mx-auto w-[220px] rounded-[2rem] border-[6px] border-foreground/80 bg-white p-1 shadow-2xl sm:w-[260px]">
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-10 h-5 w-20 -translate-x-1/2 rounded-b-xl bg-foreground/80" />
        {/* Screen */}
        <div className="overflow-hidden rounded-[1.4rem] bg-background">
          <PhoneScreen variant={variant} />
        </div>
      </div>
    </div>
  );
}

function PhoneScreen({ variant }: { variant: string }) {
  switch (variant) {
    case "booking":
      return <BookingScreen />;
    case "dashboard":
      return <DashboardScreen />;
    case "notification":
      return <NotificationScreen />;
    case "profile":
      return <ProfileScreen />;
    case "calendar":
      return <CalendarScreen />;
    default:
      return <BookingScreen />;
  }
}

function BookingScreen() {
  return (
    <div className="px-3 pb-4 pt-8">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-accent/20" />
        <div>
          <div className="h-2.5 w-20 rounded bg-foreground/70" />
          <div className="mt-1 h-2 w-14 rounded bg-muted/40" />
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-accent/8 p-2.5">
        <div className="h-2 w-16 rounded bg-accent/60" />
        <div className="mt-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`h-${i}`} className="h-2 w-full rounded bg-muted/30 text-center" />
          ))}
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className={`h-4 w-full rounded text-center text-[6px] leading-4 ${
                i === 14
                  ? "bg-accent text-white font-bold"
                  : i === 10 || i === 17
                  ? "bg-accent/15 text-accent"
                  : "bg-card text-muted/60"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 space-y-1.5">
        {["10:00", "11:30", "14:00", "15:30"].map((time, i) => (
          <div
            key={time}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${
              i === 0 ? "bg-accent text-white" : "bg-card ring-1 ring-border"
            }`}
          >
            <span className="text-[9px] font-semibold">{time}</span>
            <span className={`text-[8px] ${i === 0 ? "text-white/80" : "text-muted"}`}>
              {i === 0 ? "選択中" : "空き"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="px-3 pb-4 pt-8">
      <div className="h-2.5 w-16 rounded bg-foreground/70" />
      <div className="mt-1 h-2 w-24 rounded bg-muted/40" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-accent/10 p-2">
          <div className="text-[8px] text-muted">今日の予約</div>
          <div className="mt-0.5 text-lg font-bold text-accent">3</div>
        </div>
        <div className="rounded-lg bg-success/10 p-2">
          <div className="text-[8px] text-muted">今月の合計</div>
          <div className="mt-0.5 text-lg font-bold text-success">28</div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {[
          { name: "田中さま", time: "10:00", service: "カット" },
          { name: "佐藤さま", time: "13:00", service: "カラー" },
          { name: "鈴木さま", time: "15:30", service: "パーマ" },
        ].map((b) => (
          <div key={b.name} className="flex items-center gap-2 rounded-lg bg-card p-2 ring-1 ring-border">
            <div className="h-6 w-6 rounded-full bg-accent/20" />
            <div className="flex-1">
              <div className="text-[9px] font-semibold">{b.name}</div>
              <div className="text-[7px] text-muted">{b.service}</div>
            </div>
            <div className="text-[8px] font-medium text-accent">{b.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationScreen() {
  return (
    <div className="px-3 pb-4 pt-8">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755z" />
          </svg>
        </div>
        <div className="h-2.5 w-12 rounded bg-foreground/70" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="rounded-xl bg-success/5 p-2.5 ring-1 ring-success/20">
          <div className="text-[8px] font-bold text-success">予約が確定しました</div>
          <div className="mt-1 text-[7px] text-muted">Yamada Salon</div>
          <div className="mt-0.5 text-[8px] font-semibold">5/15 (木) 10:00 - 11:00</div>
          <div className="mt-0.5 text-[7px] text-muted">カット + カラー</div>
          <div className="mt-2 flex gap-1.5">
            <div className="flex-1 rounded-md bg-success py-1 text-center text-[7px] font-bold text-white">
              予約を確認
            </div>
            <div className="flex-1 rounded-md bg-card py-1 text-center text-[7px] text-muted ring-1 ring-border">
              キャンセル
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-accent/5 p-2.5 ring-1 ring-accent/20">
          <div className="text-[8px] font-bold text-accent">明日の予約リマインド</div>
          <div className="mt-1 text-[7px] text-muted">Coach Tanaka</div>
          <div className="mt-0.5 text-[8px] font-semibold">5/16 (金) 14:00 - 15:00</div>
          <div className="mt-2 flex gap-1.5">
            <div className="flex-1 rounded-md bg-accent py-1 text-center text-[7px] font-bold text-white">
              予約詳細
            </div>
            <div className="flex-1 rounded-md bg-card py-1 text-center text-[7px] text-muted ring-1 ring-border">
              連絡する
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen() {
  return (
    <div className="px-3 pb-4 pt-8">
      <div className="flex flex-col items-center">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-accent/30 to-accent/60" />
        <div className="mt-2 h-3 w-24 rounded bg-foreground/70" />
        <div className="mt-1 h-2 w-16 rounded bg-muted/40" />
      </div>
      <div className="mt-3 rounded-lg bg-card p-2.5 ring-1 ring-border">
        <div className="text-[8px] text-muted">プロフィール</div>
        <div className="mt-1 h-2 w-full rounded bg-muted/20" />
        <div className="mt-1 h-2 w-4/5 rounded bg-muted/20" />
        <div className="mt-1 h-2 w-3/5 rounded bg-muted/20" />
      </div>
      <div className="mt-2">
        <div className="text-[8px] text-muted">メニュー</div>
        {["カット", "カラー", "パーマ"].map((m) => (
          <div key={m} className="mt-1.5 flex items-center justify-between rounded-lg bg-card p-2 ring-1 ring-border">
            <span className="text-[9px] font-semibold">{m}</span>
            <span className="text-[8px] text-accent">予約する</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarScreen() {
  return (
    <div className="px-3 pb-4 pt-8">
      <div className="h-2.5 w-20 rounded bg-foreground/70" />
      <div className="mt-3 rounded-lg bg-card p-2.5 ring-1 ring-border">
        <div className="grid grid-cols-7 gap-0.5 text-center text-[6px] text-muted">
          {["月", "火", "水", "木", "金", "土", "日"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-0.5">
          {Array.from({ length: 35 }).map((_, i) => {
            const day = i - 2;
            const hasBooking = [5, 8, 12, 15, 19, 22, 26].includes(i);
            return (
              <div
                key={i}
                className={`flex h-5 items-center justify-center rounded text-[7px] ${
                  day < 1 || day > 31
                    ? ""
                    : hasBooking
                    ? "bg-accent/15 font-bold text-accent"
                    : "text-foreground/60"
                }`}
              >
                {day >= 1 && day <= 31 ? day : ""}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 space-y-1">
        {[
          { time: "10:00-11:00", name: "田中さま", color: "bg-accent/10 text-accent" },
          { time: "13:00-14:30", name: "佐藤さま", color: "bg-success/10 text-success" },
        ].map((e) => (
          <div key={e.time} className={`rounded-lg p-2 ${e.color}`}>
            <div className="text-[8px] font-bold">{e.time}</div>
            <div className="text-[7px]">{e.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
