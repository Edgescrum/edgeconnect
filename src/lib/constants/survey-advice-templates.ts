/**
 * ひとことアドバイス テンプレート定義
 *
 * 条件分岐テンプレート方式で自動生成する。
 * メイン提案(1文) + サブ提案(1文) の2文構成。
 * バリエーション選択: new Date().getDate() % variants.length
 */

export type AdviceCategory =
  | "data_shortage"       // A: データ不足
  | "csat_up"            // B-up: 満足度上昇
  | "csat_down"          // B-down: 満足度下降
  | "driver_weakness"    // C: ドライバー弱点
  | "driver_strength"    // D: ドライバー強み
  | "new_vs_repeat"      // E: 新規vsリピーター差
  | "menu_gap"           // F: メニュー間差
  | "high_level"         // G: 高水準
  | "stable_default"     // H: 安定/デフォルト

export interface AdviceTemplate {
  category: AdviceCategory;
  message: string; // テンプレート文字列。${変数名} で埋め込み
}

// A: データ不足（回答 < 5件）
export const DATA_SHORTAGE_TEMPLATES: AdviceTemplate[] = [
  {
    category: "data_shortage",
    message: "まだ回答が${count}件です。あと数件集まると傾向が見えてきます。",
  },
  {
    category: "data_shortage",
    message: "回答を集めている段階です。アンケートの案内を続けましょう。",
  },
];

// B-up: 満足度上昇（前月比 +0.3以上）
export const CSAT_UP_TEMPLATES: AdviceTemplate[] = [
  {
    category: "csat_up",
    message: "満足度が${prevMonth}の${prev}から${curr}に上がっています。この調子です!",
  },
  {
    category: "csat_up",
    message: "先月より満足度が+${diff}上昇しました。今の取り組みが成果に出ています。",
  },
  {
    category: "csat_up",
    message: "お客さんの満足度が上昇傾向です(${prev} → ${curr})。好調をキープしましょう。",
  },
];

// B-down: 満足度下降（前月比 -0.3以上）
export const CSAT_DOWN_TEMPLATES: AdviceTemplate[] = [
  {
    category: "csat_down",
    message: "満足度が${prevMonth}の${prev}から${curr}に下がっています。最近のお客さんの声を振り返ってみましょう。",
  },
  {
    category: "csat_down",
    message: "先月より満足度が${diff}低下しました。直近の回答コメントを確認してみてください。",
  },
  {
    category: "csat_down",
    message: "満足度が下降傾向です(${prev} → ${curr})。気になるコメントがないかチェックしましょう。",
  },
];

// C: ドライバー弱点（最低スコアが他より0.5点以上低い）
export const DRIVER_WEAKNESS_TEMPLATES: AdviceTemplate[] = [
  {
    category: "driver_weakness",
    message: "「${weakDriver}」の評価(${weakScore})が他より低めです。${action}",
  },
  {
    category: "driver_weakness",
    message: "${weakDriver}のスコアが${weakScore}と改善余地があります。${action}",
  },
  {
    category: "driver_weakness",
    message: "3つの評価の中で「${weakDriver}」が${weakScore}と目立ちます。${action}",
  },
];

// D: ドライバー強み（最高スコアが4.5以上）
export const DRIVER_STRENGTH_TEMPLATES: AdviceTemplate[] = [
  {
    category: "driver_strength",
    message: "「${strongDriver}」の評価が${strongScore}と非常に高いです。お客さんに喜ばれているポイントですね。",
  },
  {
    category: "driver_strength",
    message: "${strongDriver}が${strongScore}で高い評価を得ています。この強みをアピールに活かしましょう。",
  },
];

// E: 新規vsリピーター差（差0.5以上）
export const NEW_VS_REPEAT_TEMPLATES: AdviceTemplate[] = [
  {
    category: "new_vs_repeat",
    message: "リピーターの満足度(${repeatScore})が初回(${newScore})より高いです。初回の接客を特に丁寧にすると全体が上がりそうです。",
  },
  {
    category: "new_vs_repeat",
    message: "初回のお客さん(${newScore})よりリピーター(${repeatScore})の評価が高めです。初回体験の改善が伸びしろです。",
  },
  {
    category: "new_vs_repeat",
    message: "初回のお客さんの満足度(${newScore})がリピーター(${repeatScore})より高いです。常連さんに新鮮さを提供する工夫を試してみましょう。",
  },
  {
    category: "new_vs_repeat",
    message: "新規のお客さん(${newScore})の評価が高めです。初回印象が良い証拠。リピーター(${repeatScore})にもその体験を維持しましょう。",
  },
];

// F: メニュー間差（スコア差1.0以上）
export const MENU_GAP_TEMPLATES: AdviceTemplate[] = [
  {
    category: "menu_gap",
    message: "「${highMenu}」(${highScore})と「${lowMenu}」(${lowScore})で満足度に差があります。低い方のメニューを見直してみましょう。",
  },
  {
    category: "menu_gap",
    message: "メニュー間の満足度差が大きいです。「${lowMenu}」(${lowScore})の内容や提供方法を工夫すると全体が底上げされます。",
  },
];

// G: 高水準（平均4.5以上）
export const HIGH_LEVEL_TEMPLATES: AdviceTemplate[] = [
  {
    category: "high_level",
    message: "平均${avg}と非常に高い満足度です。この品質を維持しつつ、口コミでの紹介を促してみましょう。",
  },
  {
    category: "high_level",
    message: "満足度${avg}は素晴らしい水準です。お客さんの声を新規集客のアピール材料に使えます。",
  },
  {
    category: "high_level",
    message: "高い満足度(${avg})をキープできています。更なる向上よりもこの水準の安定維持を意識しましょう。",
  },
];

// H: 安定/デフォルト
export const STABLE_DEFAULT_TEMPLATES: AdviceTemplate[] = [
  {
    category: "stable_default",
    message: "満足度は安定しています。お客さんのコメントを定期的にチェックして小さな改善を積み重ねましょう。",
  },
  {
    category: "stable_default",
    message: "大きな変動はありません。一つ一つの接客を丁寧に続けていきましょう。",
  },
];

// ドライバーごとのアクション提案
export const DRIVER_ACTIONS: Record<string, string> = {
  price: "料金メニューの見せ方を工夫してみましょう。",
  service: "初回の接客を特に丁寧にしてみましょう。",
  quality: "施術内容や仕上がりを振り返ってみましょう。",
};

// ドライバーラベル
export const DRIVER_LABELS: Record<string, string> = {
  service: "接客・対応",
  quality: "品質・仕上がり",
  price: "価格",
};

export interface AdviceResult {
  main: string;
  sub: string;
}

/**
 * 条件分岐でアドバイスを生成する
 */
export function generateSurveyAdvice(params: {
  totalResponses: number;
  avgCsat: number;
  // 前月の満足度（csatTrend の末尾2つ）
  prevMonthCsat: number | null;
  prevMonthLabel: string | null;
  // ドライバー
  driverService: number;
  driverQuality: number;
  driverPrice: number;
  // 新規 vs リピーター
  newCsat: number | null;
  repeatCsat: number | null;
  // メニュー間
  menuHighName: string | null;
  menuHighScore: number | null;
  menuLowName: string | null;
  menuLowScore: number | null;
}): AdviceResult {
  const dayIndex = new Date().getDate();
  const candidates: { category: AdviceCategory; message: string }[] = [];

  // A: データ不足
  if (params.totalResponses < 5) {
    const templates = DATA_SHORTAGE_TEMPLATES;
    const idx = dayIndex % templates.length;
    const msg = templates[idx].message.replace("${count}", String(params.totalResponses));
    return {
      main: msg,
      sub: pickSub(candidates, "data_shortage", dayIndex, params),
    };
  }

  // B: 満足度変動
  if (params.prevMonthCsat !== null && params.prevMonthLabel) {
    const diff = params.avgCsat - params.prevMonthCsat;
    if (diff >= 0.3) {
      const templates = CSAT_UP_TEMPLATES;
      const idx = dayIndex % templates.length;
      candidates.push({
        category: "csat_up",
        message: fillTemplate(templates[idx].message, {
          prevMonth: params.prevMonthLabel,
          prev: String(params.prevMonthCsat),
          curr: String(params.avgCsat),
          diff: `+${diff.toFixed(1)}`,
        }),
      });
    } else if (diff <= -0.3) {
      const templates = CSAT_DOWN_TEMPLATES;
      const idx = dayIndex % templates.length;
      candidates.push({
        category: "csat_down",
        message: fillTemplate(templates[idx].message, {
          prevMonth: params.prevMonthLabel,
          prev: String(params.prevMonthCsat),
          curr: String(params.avgCsat),
          diff: diff.toFixed(1),
        }),
      });
    }
  }

  // C: ドライバー弱点
  const drivers = [
    { key: "service", label: DRIVER_LABELS.service, score: params.driverService },
    { key: "quality", label: DRIVER_LABELS.quality, score: params.driverQuality },
    { key: "price", label: DRIVER_LABELS.price, score: params.driverPrice },
  ].filter((d) => d.score > 0);

  if (drivers.length >= 2) {
    const sorted = [...drivers].sort((a, b) => a.score - b.score);
    const weakest = sorted[0];
    const secondBest = sorted[1];
    if (secondBest.score - weakest.score >= 0.5) {
      const templates = DRIVER_WEAKNESS_TEMPLATES;
      const idx = dayIndex % templates.length;
      candidates.push({
        category: "driver_weakness",
        message: fillTemplate(templates[idx].message, {
          weakDriver: weakest.label,
          weakScore: String(weakest.score),
          action: DRIVER_ACTIONS[weakest.key] || "",
        }),
      });
    }

    // D: ドライバー強み
    const strongest = sorted[sorted.length - 1];
    if (strongest.score >= 4.5) {
      const templates = DRIVER_STRENGTH_TEMPLATES;
      const idx = dayIndex % templates.length;
      candidates.push({
        category: "driver_strength",
        message: fillTemplate(templates[idx].message, {
          strongDriver: strongest.label,
          strongScore: String(strongest.score),
        }),
      });
    }
  }

  // E: 新規 vs リピーター差
  if (params.newCsat !== null && params.repeatCsat !== null) {
    const diff = Math.abs(params.newCsat - params.repeatCsat);
    if (diff >= 0.5) {
      const templates = NEW_VS_REPEAT_TEMPLATES;
      // Select appropriate variant based on which is higher
      const isRepeatHigher = params.repeatCsat > params.newCsat;
      const filteredIdx = isRepeatHigher ? [0, 1] : [2, 3];
      const pickIdx = filteredIdx[dayIndex % filteredIdx.length];
      candidates.push({
        category: "new_vs_repeat",
        message: fillTemplate(templates[pickIdx].message, {
          newScore: String(params.newCsat),
          repeatScore: String(params.repeatCsat),
        }),
      });
    }
  }

  // F: メニュー間差
  if (
    params.menuHighName && params.menuLowName &&
    params.menuHighScore !== null && params.menuLowScore !== null &&
    params.menuHighScore - params.menuLowScore >= 1.0
  ) {
    const templates = MENU_GAP_TEMPLATES;
    const idx = dayIndex % templates.length;
    candidates.push({
      category: "menu_gap",
      message: fillTemplate(templates[idx].message, {
        highMenu: params.menuHighName,
        highScore: String(params.menuHighScore),
        lowMenu: params.menuLowName,
        lowScore: String(params.menuLowScore),
      }),
    });
  }

  // G: 高水準
  if (params.avgCsat >= 4.5) {
    const templates = HIGH_LEVEL_TEMPLATES;
    const idx = dayIndex % templates.length;
    candidates.push({
      category: "high_level",
      message: fillTemplate(templates[idx].message, {
        avg: String(params.avgCsat),
      }),
    });
  }

  // H: 安定/デフォルト（常にフォールバックとして追加）
  {
    const templates = STABLE_DEFAULT_TEMPLATES;
    const idx = dayIndex % templates.length;
    candidates.push({
      category: "stable_default",
      message: templates[idx].message,
    });
  }

  // メインを選択（優先度順: B > C > E > F > G > D > H）
  const priorityOrder: AdviceCategory[] = [
    "csat_down", "csat_up", "driver_weakness", "new_vs_repeat",
    "menu_gap", "high_level", "driver_strength", "stable_default",
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
    : { message: "引き続きお客さんの声に耳を傾けていきましょう。" };

  return {
    main: main.message,
    sub: sub.message,
  };
}

function pickSub(
  _candidates: { category: AdviceCategory; message: string }[],
  _excludeCategory: AdviceCategory,
  _dayIndex: number,
  _params: unknown
): string {
  return "アンケートの回答が増えると、より具体的なアドバイスが表示されます。";
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`\${${key}}`, value);
  }
  return result;
}
