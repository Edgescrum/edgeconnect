/**
 * 予約実績タブ ひとことアドバイス テンプレート定義
 *
 * 条件分岐テンプレート方式で自動生成する。
 * メイン提案(1文) + サブ提案(1文) の2文構成。
 * バリエーション選択: new Date().getDate() % variants.length
 */

export type BookingAdviceCategory =
  | "data_shortage"    // A: データ不足
  | "booking_down"     // B: 予約減少
  | "cancel_high"      // C: キャンセル率高
  | "dormant_high"     // D: 休眠/離脱多い
  | "booking_up"       // E: 予約増加
  | "new_low"          // F: 新規少ない
  | "revenue_up"       // G: 売上好調
  | "stable_default";  // H: 安定/デフォルト

export interface BookingAdviceTemplate {
  category: BookingAdviceCategory;
  message: string;
}

// A: データ不足（累計予約 < 5件）
export const DATA_SHORTAGE_TEMPLATES: BookingAdviceTemplate[] = [
  {
    category: "data_shortage",
    message: "まだ予約が${N}件です。データが増えると傾向が見えてきます",
  },
  {
    category: "data_shortage",
    message: "予約データを蓄積している段階です。URLやQRコードをお客さんに積極的に共有しましょう",
  },
];

// B: 予約減少（前月比 -20%以上）— 優先度1
export const BOOKING_DOWN_TEMPLATES: BookingAdviceTemplate[] = [
  {
    category: "booking_down",
    message: "先月より予約が${diff}件減っています(${prev}件→${curr}件)。リピーターへの声かけを意識してみましょう",
  },
  {
    category: "booking_down",
    message: "予約数が${diffPct}%減少しています。季節的な要因でなければ、メニューや価格の見直しを検討してみましょう",
  },
];

// C: キャンセル率高（15%超）— 優先度2
export const CANCEL_HIGH_TEMPLATES: BookingAdviceTemplate[] = [
  {
    category: "cancel_high",
    message: "キャンセル率が${rate}%とやや高めです。リマインダー通知の効果を確認してみましょう",
  },
  {
    category: "cancel_high",
    message: "全${total}件中${cancel}件がキャンセルされています。キャンセルポリシーの案内を予約確定時に強調してみましょう",
  },
];

// D: 休眠/離脱多い（休眠+離脱リスク > 40%）— 優先度3
export const DORMANT_HIGH_TEMPLATES: BookingAdviceTemplate[] = [
  {
    category: "dormant_high",
    message: "休眠・離脱リスクのお客さんが${pct}%います。最近来ていないお客さんにLINEでメッセージを送ってみましょう",
  },
  {
    category: "dormant_high",
    message: "${count}人のお客さんが最近来店していません。限定クーポンや季節メニューの案内が再来店のきっかけになります",
  },
];

// E: 予約増加（前月比 +20%以上）— 優先度4
export const BOOKING_UP_TEMPLATES: BookingAdviceTemplate[] = [
  {
    category: "booking_up",
    message: "先月より予約が${diff}件増えています!この調子で新規のお客さんもリピーターに育てましょう",
  },
  {
    category: "booking_up",
    message: "予約数が${diffPct}%増加しました。今の集客方法が効いています",
  },
];

// F: 新規少ない（新規比率 < 20%）— 優先度5
export const NEW_LOW_TEMPLATES: BookingAdviceTemplate[] = [
  {
    category: "new_low",
    message: "新規のお客さんが全体の${pct}%と少なめです。QRコードの設置場所を増やしたり紹介をお願いしてみましょう",
  },
  {
    category: "new_low",
    message: "リピーターが多いのは素晴らしいですが、新規が${count}人と少なめです。SNSでの発信を検討しましょう",
  },
];

// G: 売上好調（前月比 +30%以上）— 優先度6
export const REVENUE_UP_TEMPLATES: BookingAdviceTemplate[] = [
  {
    category: "revenue_up",
    message: "売上が前月比+${pct}%と好調です!口コミや紹介につなげるチャンスです",
  },
  {
    category: "revenue_up",
    message: "顧客単価が${price}円に上昇しています。単価の高いメニューが好評です",
  },
];

// H: 安定/デフォルト — 優先度7
export const STABLE_DEFAULT_TEMPLATES: BookingAdviceTemplate[] = [
  {
    category: "stable_default",
    message: "予約状況は安定しています。少しずつ新しいお客さんを増やしていきましょう",
  },
  {
    category: "stable_default",
    message: "順調に予約が入っています。ヒートマップで空いている時間帯を確認し、そこを埋める施策を考えてみましょう",
  },
  {
    category: "stable_default",
    message: "大きな変動はありません。空き時間帯にキャンペーンを試してみるのも一つの手です",
  },
];

export interface BookingAdviceResult {
  main: string;
  sub: string;
}

/**
 * 予約実績のKPIデータからひとことアドバイスを生成する
 */
export function generateBookingAdvice(params: {
  cumulativeBookingCount: number;
  // 前月比データ
  lastMonthBookings: number | null;
  prevMonthBookings: number | null;
  lastMonthRevenue: number | null;
  prevMonthRevenue: number | null;
  // キャンセルデータ
  lastMonthCancelRate: number | null;
  lastMonthCancelCount: number | null;
  lastMonthTotalBookings: number | null; // booking + cancel
  // LTVセグメント
  ltvSegments: {
    excellent: number;
    normal: number;
    dormant: number;
    at_risk: number;
  };
  // 顧客単価
  lastMonthUnitPrice: number | null;
  prevMonthUnitPrice: number | null;
}): BookingAdviceResult {
  const dayIndex = new Date().getDate();
  const candidates: { category: BookingAdviceCategory; message: string }[] = [];

  // A: データ不足（累計予約 < 5件）
  if (params.cumulativeBookingCount < 5) {
    const templates = DATA_SHORTAGE_TEMPLATES;
    const idx = dayIndex % templates.length;
    const msg = fillTemplate(templates[idx].message, {
      N: String(params.cumulativeBookingCount),
    });
    return {
      main: msg,
      sub: "URLやQRコードの共有を続けて予約を増やしましょう。",
    };
  }

  // B: 予約減少（前月比 -20%以上）— 優先度1
  if (
    params.lastMonthBookings !== null &&
    params.prevMonthBookings !== null &&
    params.prevMonthBookings > 0
  ) {
    const diff = params.lastMonthBookings - params.prevMonthBookings;
    const diffPct = Math.round((diff / params.prevMonthBookings) * 100);
    if (diffPct <= -20) {
      const templates = BOOKING_DOWN_TEMPLATES;
      const idx = dayIndex % templates.length;
      candidates.push({
        category: "booking_down",
        message: fillTemplate(templates[idx].message, {
          diff: String(Math.abs(diff)),
          prev: String(params.prevMonthBookings),
          curr: String(params.lastMonthBookings),
          diffPct: String(Math.abs(diffPct)),
        }),
      });
    }
    // E: 予約増加（前月比 +20%以上）— 優先度4
    if (diffPct >= 20) {
      const templates = BOOKING_UP_TEMPLATES;
      const idx = dayIndex % templates.length;
      candidates.push({
        category: "booking_up",
        message: fillTemplate(templates[idx].message, {
          diff: String(diff),
          diffPct: String(diffPct),
        }),
      });
    }
  }

  // C: キャンセル率高（15%超）— 優先度2
  if (params.lastMonthCancelRate !== null && params.lastMonthCancelRate > 15) {
    const templates = CANCEL_HIGH_TEMPLATES;
    const idx = dayIndex % templates.length;
    candidates.push({
      category: "cancel_high",
      message: fillTemplate(templates[idx].message, {
        rate: String(Math.round(params.lastMonthCancelRate * 10) / 10),
        total: String(params.lastMonthTotalBookings ?? 0),
        cancel: String(params.lastMonthCancelCount ?? 0),
      }),
    });
  }

  // D: 休眠/離脱多い（休眠+離脱リスク > 40%）— 優先度3
  const totalSegments =
    params.ltvSegments.excellent +
    params.ltvSegments.normal +
    params.ltvSegments.dormant +
    params.ltvSegments.at_risk;
  if (totalSegments > 0) {
    const dormantAtRisk = params.ltvSegments.dormant + params.ltvSegments.at_risk;
    const dormantPct = Math.round((dormantAtRisk / totalSegments) * 100);
    if (dormantPct > 40) {
      const templates = DORMANT_HIGH_TEMPLATES;
      const idx = dayIndex % templates.length;
      candidates.push({
        category: "dormant_high",
        message: fillTemplate(templates[idx].message, {
          pct: String(dormantPct),
          count: String(dormantAtRisk),
        }),
      });
    }

    // F: 新規少ない — 優先度5
    // "新規" = normal + at_risk (通常+離脱リスク = 定着していないお客さん)
    // ここでは at_risk を新規相当と見なす（1回きりの来店）
    const newCount = params.ltvSegments.at_risk;
    const newPct = Math.round((newCount / totalSegments) * 100);
    if (newPct < 20 && totalSegments >= 5) {
      candidates.push({
        category: "new_low",
        message: fillTemplate(
          NEW_LOW_TEMPLATES[dayIndex % NEW_LOW_TEMPLATES.length].message,
          { pct: String(newPct), count: String(newCount) }
        ),
      });
    }
  }

  // G: 売上好調（前月比 +30%以上）— 優先度6
  if (
    params.lastMonthRevenue !== null &&
    params.prevMonthRevenue !== null &&
    params.prevMonthRevenue > 0
  ) {
    const revDiffPct = Math.round(
      ((params.lastMonthRevenue - params.prevMonthRevenue) / params.prevMonthRevenue) * 100
    );
    if (revDiffPct >= 30) {
      const templates = REVENUE_UP_TEMPLATES;
      const idx = dayIndex % templates.length;
      candidates.push({
        category: "revenue_up",
        message: fillTemplate(templates[idx].message, {
          pct: String(revDiffPct),
          price: params.lastMonthUnitPrice !== null
            ? params.lastMonthUnitPrice.toLocaleString()
            : "-",
        }),
      });
    }
  }

  // H: 安定/デフォルト（常にフォールバックとして追加）— 優先度7
  {
    const templates = STABLE_DEFAULT_TEMPLATES;
    const idx = dayIndex % templates.length;
    candidates.push({
      category: "stable_default",
      message: templates[idx].message,
    });
  }

  // メインを選択（優先度順: B > C > D > E > F > G > H）
  const priorityOrder: BookingAdviceCategory[] = [
    "booking_down",
    "cancel_high",
    "dormant_high",
    "booking_up",
    "new_low",
    "revenue_up",
    "stable_default",
  ];

  let main = candidates[candidates.length - 1]; // fallback
  for (const cat of priorityOrder) {
    const found = candidates.find((c) => c.category === cat);
    if (found) {
      main = found;
      break;
    }
  }

  // サブは異なるカテゴリから選択
  const subCandidates = candidates.filter((c) => c.category !== main.category);
  const sub = subCandidates.length > 0
    ? subCandidates[dayIndex % subCandidates.length]
    : { message: "引き続きお客さんとの接点を大切にしていきましょう。" };

  return {
    main: main.message,
    sub: sub.message,
  };
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`\${${key}}`, value);
  }
  return result;
}
