

interface BookingInfo {
  bookingId: string;
  providerName: string;
  providerSlug: string;
  providerIconUrl?: string;
  brandColor: string;
  serviceName: string;
  durationMin: number;
  dateStr: string;
  timeStr: string;
  price: number;
  customerName: string;
  liffId: string;
  cancelDeadlineStr?: string;
  googleCalendarUrl?: string;
  appleCalendarUrl?: string;
}

function formatPrice(price: number) {
  return `¥${price.toLocaleString()}`;
}

// ── 共通パーツ ──

function badge(text: string, color: string) {
  return {
    type: "box" as const,
    layout: "vertical" as const,
    backgroundColor: color,
    cornerRadius: "xl",
    paddingAll: "6px",
    paddingStart: "12px",
    paddingEnd: "12px",
    flex: 0,
    contents: [
      {
        type: "text" as const,
        text,
        size: "xxs" as const,
        color: "#ffffff",
        weight: "bold" as const,
      },
    ],
  };
}

function badgeRow(text: string, color: string) {
  return {
    type: "box" as const,
    layout: "horizontal" as const,
    contents: [badge(text, color)],
  };
}

function detailRow(label: string, value: string, valueColor?: string) {
  return {
    type: "box" as const,
    layout: "horizontal" as const,
    contents: [
      {
        type: "text" as const,
        text: label,
        size: "sm" as const,
        color: "#888888",
        flex: 0,
      },
      {
        type: "text" as const,
        text: value,
        size: "sm" as const,
        weight: "bold" as const,
        color: valueColor || "#333333",
        align: "end" as const,
        wrap: true,
      },
    ],
  };
}

function separator() {
  return { type: "separator" as const, color: "#f0f0f0" };
}

function footerBrand() {
  return {
    type: "text" as const,
    text: "EdgeConnect",
    size: "xxs" as const,
    color: "#aaaaaa",
    align: "center" as const,
    margin: "lg" as const,
  };
}

function primaryButton(label: string, uri: string, color: string) {
  return {
    type: "button" as const,
    action: { type: "uri" as const, label, uri },
    style: "primary" as const,
    color,
    height: "sm" as const,
  };
}

function secondaryButton(label: string, uri: string) {
  return {
    type: "button" as const,
    action: { type: "uri" as const, label, uri },
    style: "secondary" as const,
    height: "sm" as const,
  };
}

// ── 予約確定 → お客さん向け ──

export function bookingConfirmedCustomer(info: BookingInfo): Record<string, unknown> {
  const color = info.brandColor;

  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "lg",
      paddingAll: "20px",
      contents: [
        badgeRow("予約確定", "#06C755"),
        {
          type: "text",
          text: "ご予約が確定しました",
          size: "xl",
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: info.providerName,
          size: "sm",
          color: "#888888",
        },
        separator(),
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            detailRow("日時", `${info.dateStr} ${info.timeStr}`),
            detailRow("メニュー", `${info.serviceName}（${info.durationMin}分）`),
            detailRow("料金", formatPrice(info.price), "#06C755"),
          ],
        },
        ...(info.cancelDeadlineStr
          ? [
              {
                type: "text" as const,
                text: `キャンセル期限：${info.cancelDeadlineStr}`,
                size: "xs" as const,
                color: "#06C755",
              },
            ]
          : []),
        separator(),
        ...(info.googleCalendarUrl || info.appleCalendarUrl
          ? [
              {
                type: "text" as const,
                text: "この予約をカレンダーに追加",
                size: "xs" as const,
                color: "#888888",
                align: "center" as const,
              },
              {
                type: "box" as const,
                layout: "vertical" as const,
                spacing: "sm" as const,
                contents: [
                  ...(info.googleCalendarUrl
                    ? [secondaryButton("Googleカレンダーに追加", info.googleCalendarUrl)]
                    : []),
                  ...(info.appleCalendarUrl
                    ? [secondaryButton("Appleカレンダーに追加", info.appleCalendarUrl)]
                    : []),
                ],
              },
              {
                type: "text" as const,
                text: "タップするとこの予約件が追加されます",
                size: "xxs" as const,
                color: "#aaaaaa",
                align: "center" as const,
              },
              separator(),
            ]
          : []),
        primaryButton(
          "予約詳細を見る",
          `https://liff.line.me/${info.liffId}?path=/bookings/${info.bookingId}`,
          color
        ),
        footerBrand(),
      ],
    },
  };
}

// ── 毎朝サマリー → 事業主向け ──

export interface DailySummaryBooking {
  time: string;
  customerName: string;
  serviceName: string;
  durationMin: number;
}

export interface DailySummaryInfo {
  providerName: string;
  dateStr: string;
  totalCount: number;
  bookings: DailySummaryBooking[];
  liffId: string;
}

export function dailySummaryProvider(info: DailySummaryInfo): Record<string, unknown> {
  const color = "#06C755";
  const maxShow = 3;
  const shown = info.bookings.slice(0, maxShow);
  const remaining = info.totalCount - shown.length;

  const bookingRows = shown.flatMap((b, i) => [
    ...(i > 0 ? [{ type: "separator" as const, color: "#f0f0f0" }] : []),
    {
      type: "box" as const,
      layout: "horizontal" as const,
      spacing: "lg" as const,
      contents: [
        {
          type: "text" as const,
          text: b.time,
          size: "sm" as const,
          color: "#333333",
          weight: "bold" as const,
          flex: 0,
        },
        {
          type: "box" as const,
          layout: "vertical" as const,
          contents: [
            {
              type: "text" as const,
              text: b.customerName,
              size: "sm" as const,
              weight: "bold" as const,
              color: "#333333",
            },
            {
              type: "text" as const,
              text: `${b.serviceName} ${b.durationMin}分`,
              size: "xs" as const,
              color: "#888888",
            },
          ],
        },
      ],
    },
  ]);

  return {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: color,
      paddingAll: "20px",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: `${info.dateStr} おはようサマリー`,
          size: "xs",
          color: "#ffffff",
        },
        {
          type: "text",
          text: `今日は ${info.totalCount}件 の予約です`,
          size: "xl",
          weight: "bold",
          color: "#ffffff",
        },
        {
          type: "text",
          text: info.providerName,
          size: "sm",
          color: "#ffffffcc",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      paddingAll: "20px",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: `${info.totalCount}`,
              size: "xxl",
              weight: "bold",
              color: color,
              flex: 0,
            },
            {
              type: "text",
              text: "件確定",
              size: "sm",
              color: "#888888",
              gravity: "bottom",
              margin: "sm",
              flex: 0,
            },
            { type: "filler" as const },
            {
              type: "text",
              text: `最初の${shown.length}件を表示`,
              size: "xxs",
              color: "#aaaaaa",
              gravity: "bottom",
              align: "end",
            },
          ],
        },
        separator(),
        ...bookingRows,
        ...(remaining > 0
          ? [
              separator(),
              {
                type: "text" as const,
                text: `他 ${remaining}件を管理画面で確認 →`,
                size: "xs" as const,
                color: "#888888",
                align: "center" as const,
              },
            ]
          : []),
        separator(),
        primaryButton(
          "予約管理を開く",
          `https://liff.line.me/${info.liffId}?path=/provider/bookings`,
          color
        ),
        footerBrand(),
      ],
    },
  };
}

// ── キャンセル通知 → お客さん向け ──

export function bookingCancelledCustomer(
  info: BookingInfo & { cancelledBy: "customer" | "provider" }
): Record<string, unknown> {
  const color = info.brandColor;
  const cancelText =
    info.cancelledBy === "provider"
      ? "事業主により予約がキャンセルされました"
      : "予約をキャンセルしました";

  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "lg",
      paddingAll: "20px",
      contents: [
        badgeRow("キャンセル", "#94a3b8"),
        {
          type: "text",
          text: cancelText,
          size: "lg",
          weight: "bold",
          color: "#333333",
          wrap: true,
        },
        {
          type: "text",
          text: info.providerName,
          size: "sm",
          color: "#888888",
        },
        separator(),
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            detailRow("日時", `${info.dateStr} ${info.timeStr}`),
            detailRow("メニュー", `${info.serviceName}（${info.durationMin}分）`),
          ],
        },
        separator(),
        {
          type: "box",
          layout: "horizontal",
          spacing: "sm",
          contents: [
            primaryButton(
              "再予約する",
              `https://liff.line.me/${info.liffId}?provider=${info.providerSlug}`,
              color
            ),
            primaryButton(
              "事業主に連絡",
              `https://liff.line.me/${info.liffId}?path=/p/${info.providerSlug}`,
              "#999999"
            ),
          ],
        },
        footerBrand(),
      ],
    },
  };
}

// ── キャンセル通知 → 事業主向け ──

export function bookingCancelledProvider(info: BookingInfo): Record<string, unknown> {
  const color = "#ef4444";

  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "lg",
      paddingAll: "20px",
      contents: [
        badgeRow("キャンセル", color),
        {
          type: "text",
          text: "予約がキャンセルされました",
          size: "xl",
          weight: "bold",
          color: "#333333",
        },
        separator(),
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            detailRow("お客さま", info.customerName),
            detailRow("日時", `${info.dateStr} ${info.timeStr}`),
            detailRow("メニュー", `${info.serviceName}（${info.durationMin}分）`),
          ],
        },
        separator(),
        primaryButton(
          "予約管理を開く",
          `https://liff.line.me/${info.liffId}?path=/provider/bookings`,
          "#6366f1"
        ),
        footerBrand(),
      ],
    },
  };
}

// ── リマインダー → お客さん向け ──

export function bookingReminder(info: BookingInfo): Record<string, unknown> {
  const color = info.brandColor;

  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "lg",
      paddingAll: "20px",
      contents: [
        badgeRow("リマインダー", "#f59e0b"),
        {
          type: "text",
          text: "明日の予約リマインダー",
          size: "xl",
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: info.providerName,
          size: "sm",
          color: "#888888",
        },
        separator(),
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            detailRow("日時", `${info.dateStr} ${info.timeStr}`),
            detailRow("メニュー", `${info.serviceName}（${info.durationMin}分）`),
            detailRow("料金", formatPrice(info.price), color),
          ],
        },
        separator(),
        {
          type: "box",
          layout: "horizontal",
          spacing: "sm",
          contents: [
            primaryButton(
              "予約詳細を見る",
              `https://liff.line.me/${info.liffId}?path=/bookings/${info.bookingId}`,
              color
            ),
            primaryButton(
              "事業主に連絡",
              `https://liff.line.me/${info.liffId}?path=/p/${info.providerSlug}`,
              "#999999"
            ),
          ],
        },
        footerBrand(),
      ],
    },
  };
}
