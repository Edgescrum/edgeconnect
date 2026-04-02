

interface BookingInfo {
  bookingId: string;
  providerName: string;
  providerSlug: string;
  serviceName: string;
  dateStr: string;
  timeStr: string;
  price: number;
  customerName: string;
  liffId: string;
  googleCalendarUrl?: string;
  appleCalendarUrl?: string;
}

function formatPrice(price: number) {
  return `¥${price.toLocaleString()}`;
}

// 予約確定 → お客さん向け
export function bookingConfirmedCustomer(info: BookingInfo): Record<string, unknown> {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#6366f1",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: info.providerName,
          color: "#ffffff",
          size: "xs",
        },
        {
          type: "text",
          text: "予約が確定しました",
          color: "#ffffff",
          size: "lg",
          weight: "bold",
          margin: "xs",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            detailRow("メニュー", info.serviceName),
            detailRow("日時", `${info.dateStr} ${info.timeStr}`),
            detailRow("料金", formatPrice(info.price)),
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "予約を確認する",
            uri: `https://liff.line.me/${info.liffId}?path=/bookings/${info.bookingId}`,
          },
          style: "primary",
          color: "#6366f1",
        },
        ...(info.googleCalendarUrl
          ? [
              {
                type: "button" as const,
                action: {
                  type: "uri" as const,
                  label: "Googleカレンダーに追加",
                  uri: info.googleCalendarUrl,
                },
                style: "link" as const,
              },
            ]
          : []),
        ...(info.appleCalendarUrl
          ? [
              {
                type: "button" as const,
                action: {
                  type: "uri" as const,
                  label: "Appleカレンダーに追加",
                  uri: info.appleCalendarUrl,
                },
                style: "link" as const,
              },
            ]
          : []),
      ],
    },
  };
}

// 予約確定 → 事業主向け
export function bookingConfirmedProvider(info: BookingInfo): Record<string, unknown> {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#06C755",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: "新しい予約",
          color: "#ffffff",
          size: "lg",
          weight: "bold",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            detailRow("お客さま", info.customerName),
            detailRow("メニュー", info.serviceName),
            detailRow("日時", `${info.dateStr} ${info.timeStr}`),
            detailRow("料金", formatPrice(info.price)),
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "予約を確認する",
            uri: `https://liff.line.me/${info.liffId}?path=/provider/bookings/${info.bookingId}`,
          },
          style: "primary",
          color: "#6366f1",
        },
      ],
    },
  };
}

// キャンセル通知 → お客さん向け
export function bookingCancelledCustomer(
  info: BookingInfo & { cancelledBy: "customer" | "provider" }
): Record<string, unknown> {
  const cancelText =
    info.cancelledBy === "provider"
      ? "事業主により予約がキャンセルされました"
      : "予約をキャンセルしました";

  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#94a3b8",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: info.providerName,
          color: "#ffffff",
          size: "xs",
        },
        {
          type: "text",
          text: cancelText,
          color: "#ffffff",
          size: "lg",
          weight: "bold",
          margin: "xs",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            detailRow("メニュー", info.serviceName),
            detailRow("日時", `${info.dateStr} ${info.timeStr}`),
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "再予約する",
            uri: `https://liff.line.me/${info.liffId}?provider=${info.providerSlug}`,
          },
          style: "primary",
          color: "#6366f1",
        },
      ],
    },
  };
}

// キャンセル通知 → 事業主向け
export function bookingCancelledProvider(info: BookingInfo): Record<string, unknown> {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#ef4444",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: "予約キャンセル",
          color: "#ffffff",
          size: "lg",
          weight: "bold",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            detailRow("お客さま", info.customerName),
            detailRow("メニュー", info.serviceName),
            detailRow("日時", `${info.dateStr} ${info.timeStr}`),
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "予約管理を開く",
            uri: `https://liff.line.me/${info.liffId}?path=/provider/bookings`,
          },
          style: "primary",
          color: "#6366f1",
        },
      ],
    },
  };
}

// リマインダー → お客さん向け
export function bookingReminder(info: BookingInfo): Record<string, unknown> {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#f59e0b",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: info.providerName,
          color: "#ffffff",
          size: "xs",
        },
        {
          type: "text",
          text: "明日の予約リマインダー",
          color: "#ffffff",
          size: "lg",
          weight: "bold",
          margin: "xs",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            detailRow("メニュー", info.serviceName),
            detailRow("日時", `${info.dateStr} ${info.timeStr}`),
            detailRow("料金", formatPrice(info.price)),
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "予約詳細を見る",
            uri: `https://liff.line.me/${info.liffId}?path=/bookings/${info.bookingId}`,
          },
          style: "primary",
          color: "#6366f1",
        },
      ],
    },
  };
}

function detailRow(label: string, value: string) {
  return {
    type: "box" as const,
    layout: "horizontal" as const,
    contents: [
      {
        type: "text" as const,
        text: label,
        size: "sm" as const,
        color: "#94a3b8",
        flex: 0,
      },
      {
        type: "text" as const,
        text: value,
        size: "sm" as const,
        weight: "bold" as const,
        align: "end" as const,
        wrap: true,
      },
    ],
  };
}
