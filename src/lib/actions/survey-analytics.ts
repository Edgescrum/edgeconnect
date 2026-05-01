"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProviderId } from "@/lib/auth/provider-session";
import type { SegmentKey, DateRangeKey } from "@/lib/actions/analytics";

async function getProviderWithPlan() {
  const supabase = await createClient();
  const provider = await getProviderId();
  const { data } = await supabase
    .from("providers")
    .select("plan, category")
    .eq("id", provider.id)
    .single();
  return { ...provider, plan: data?.plan || "basic", category: data?.category || null };
}

// ============================================================
// Types
// ============================================================

export interface SurveyBasicStats {
  avgCsat: number;
  totalResponses: number;
  responseRate: number; // 回答率 (%)
}

export interface MonthlyCsatTrend {
  month: string;
  avgCsat: number;
  responseCount: number;
}

export interface DriverTrend {
  month: string;
  avgService: number;
  avgQuality: number;
  avgPrice: number;
}

export interface MenuCsat {
  serviceName: string;
  serviceId: number;
  avgCsat: number;
  responseCount: number;
}

export interface SegmentCsat {
  segment: string;
  segmentLabel: string;
  avgCsat: number;
  responseCount: number;
}

// Cross-analysis types
export interface UnitPriceCsat {
  tier: string;
  tierLabel: string;
  avgCsat: number;
  count: number;
  avgUnitPrice: number;
}

export interface NewVsRepeaterCsat {
  type: "new" | "repeater";
  label: string;
  avgCsat: number;
  count: number;
}

export interface RevenueCorrelation {
  month: string;
  revenue: number;
  avgCsat: number;
}

export interface MenuCsatMatrix {
  serviceName: string;
  serviceId: number;
  avgCsat: number;
  bookingCount: number;
  responseCount: number;
}

export interface WordCloudItem {
  word: string;
  count: number;
}

export interface SurveyAdvancedStats {
  csatTrend: MonthlyCsatTrend[];
  driverTrend: DriverTrend[];
  menuCsat: MenuCsat[];
  segmentCsat: SegmentCsat[];
  driverAverages: {
    service: number;
    quality: number;
    price: number;
  };
  // 属性別CSAT
  genderCsat: { gender: string; label: string; avgCsat: number; count: number }[];
  ageCsat: { ageGroup: string; avgCsat: number; count: number }[];
  // Cross-analysis
  unitPriceCsat: UnitPriceCsat[];
  newVsRepeaterCsat: NewVsRepeaterCsat[];
  revenueCorrelation: RevenueCorrelation[];
  menuCsatMatrix: MenuCsatMatrix[];
  wordCloud: WordCloudItem[];
}

// ============================================================
// Basic Stats (available for all plans)
// ============================================================

export async function getSurveyBasicStats(): Promise<SurveyBasicStats> {
  const provider = await getProviderWithPlan();
  const supabase = createAdminClient();

  const [
    { count: sentCount },
    { count: responseCount },
    { data: avgData },
  ] = await Promise.all([
    supabase
      .from("pending_survey_notifications")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", provider.id)
      .eq("status", "sent"),
    supabase
      .from("survey_responses")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", provider.id),
    supabase
      .from("survey_responses")
      .select("csat")
      .eq("provider_id", provider.id),
  ]);

  const totalResponses = responseCount || 0;
  const totalSent = sentCount || 0;
  const responseRate = totalSent > 0
    ? Math.round((totalResponses / totalSent) * 1000) / 10
    : 0;

  const avgCsat = (avgData && avgData.length > 0)
    ? avgData.reduce((sum, r) => sum + (r.csat as number), 0) / avgData.length
    : 0;

  return {
    avgCsat: Number(avgCsat.toFixed(1)),
    totalResponses,
    responseRate,
  };
}

// ============================================================
// Date range helper
// ============================================================

function computeDateRange(dateRange: DateRangeKey): { startDate: string | null; endDate: string | null } {
  if (dateRange === "all") return { startDate: null, endDate: null };
  const now = new Date();
  if (dateRange === "this_month") {
    return { startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), endDate: now.toISOString() };
  }
  return { startDate: new Date(now.getFullYear(), 0, 1).toISOString(), endDate: now.toISOString() };
}

// ============================================================
// Predefined keywords for word cloud (Japanese)
// ============================================================

const PREDEFINED_KEYWORDS = [
  "丁寧", "満足", "待ち時間", "価格", "雰囲気", "清潔", "対応", "説明",
  "技術", "仕上がり", "接客", "リラックス", "快適", "親切", "安心",
  "予約", "時間", "スタッフ", "おすすめ", "感謝", "嬉しい", "良い",
  "悪い", "遅い", "早い", "高い", "安い", "綺麗", "上手", "丁寧",
  "また来たい", "気持ちいい", "居心地", "笑顔", "プロ", "信頼",
];

// ============================================================
// Advanced Stats (standard plan only, with segment/date filters)
// ============================================================

export async function getSurveyAdvancedStats(
  segment: SegmentKey = "all",
  dateRange: DateRangeKey = "all"
): Promise<SurveyAdvancedStats> {
  const provider = await getProviderWithPlan();
  if (provider.plan === "basic") {
    throw new Error("この機能はスタンダードプラン以上でご利用いただけます");
  }

  const supabase = createAdminClient();
  const { startDate, endDate } = computeDateRange(dateRange);

  // Get customer IDs for segment filter
  let segmentCustomerIds: number[] | null = null;
  if (segment !== "all") {
    const { data: segData } = await supabase.rpc("get_segment_customer_ids", {
      p_provider_id: provider.id,
      p_segment: segment,
    });
    segmentCustomerIds = segData
      ? (segData as { customer_user_id: number }[]).map((r) => r.customer_user_id)
      : [];
  }

  // Build query for survey responses
  let query = supabase
    .from("survey_responses")
    .select(`
      id, csat, driver_service, driver_quality, driver_price,
      comment, review_text,
      created_at, customer_user_id,
      bookings:booking_id (
        start_at,
        service_id,
        services:service_id ( id, name, price )
      )
    `)
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: true });

  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", endDate);
  if (segmentCustomerIds && segmentCustomerIds.length > 0) {
    query = query.in("customer_user_id", segmentCustomerIds);
  } else if (segmentCustomerIds && segmentCustomerIds.length === 0) {
    // No customers in segment, return empty
    return emptyAdvancedStats();
  }

  const { data: allResponses } = await query;
  const responses = allResponses || [];

  if (responses.length === 0) return emptyAdvancedStats();

  // -- CSAT monthly trend --
  const monthlyMap = new Map<string, { csatSum: number; count: number; serviceSum: number; qualitySum: number; priceSum: number; serviceCount: number; qualityCount: number; priceCount: number }>();
  for (const r of responses) {
    const month = (r.created_at as string).slice(0, 7);
    const entry = monthlyMap.get(month) || { csatSum: 0, count: 0, serviceSum: 0, qualitySum: 0, priceSum: 0, serviceCount: 0, qualityCount: 0, priceCount: 0 };
    entry.csatSum += r.csat as number;
    entry.count++;
    if (r.driver_service != null) { entry.serviceSum += r.driver_service as number; entry.serviceCount++; }
    if (r.driver_quality != null) { entry.qualitySum += r.driver_quality as number; entry.qualityCount++; }
    if (r.driver_price != null) { entry.priceSum += r.driver_price as number; entry.priceCount++; }
    monthlyMap.set(month, entry);
  }

  const csatTrend: MonthlyCsatTrend[] = [];
  const driverTrend: DriverTrend[] = [];
  for (const [month, entry] of monthlyMap) {
    csatTrend.push({
      month,
      avgCsat: Number((entry.csatSum / entry.count).toFixed(1)),
      responseCount: entry.count,
    });
    driverTrend.push({
      month,
      avgService: entry.serviceCount > 0 ? Number((entry.serviceSum / entry.serviceCount).toFixed(1)) : 0,
      avgQuality: entry.qualityCount > 0 ? Number((entry.qualitySum / entry.qualityCount).toFixed(1)) : 0,
      avgPrice: entry.priceCount > 0 ? Number((entry.priceSum / entry.priceCount).toFixed(1)) : 0,
    });
  }

  // -- Driver averages --
  const driverServiceAll = responses.filter((r) => r.driver_service != null);
  const driverQualityAll = responses.filter((r) => r.driver_quality != null);
  const driverPriceAll = responses.filter((r) => r.driver_price != null);

  const driverAverages = {
    service: driverServiceAll.length > 0
      ? Number((driverServiceAll.reduce((s, r) => s + (r.driver_service as number), 0) / driverServiceAll.length).toFixed(1))
      : 0,
    quality: driverQualityAll.length > 0
      ? Number((driverQualityAll.reduce((s, r) => s + (r.driver_quality as number), 0) / driverQualityAll.length).toFixed(1))
      : 0,
    price: driverPriceAll.length > 0
      ? Number((driverPriceAll.reduce((s, r) => s + (r.driver_price as number), 0) / driverPriceAll.length).toFixed(1))
      : 0,
  };

  // -- Menu CSAT --
  const menuMap = new Map<number, { name: string; csatSum: number; count: number }>();
  for (const r of responses) {
    const booking = Array.isArray(r.bookings) ? r.bookings[0] : r.bookings;
    if (!booking) continue;
    const service = Array.isArray((booking as Record<string, unknown>).services)
      ? ((booking as Record<string, unknown>).services as Record<string, unknown>[])[0]
      : (booking as Record<string, unknown>).services;
    if (!service) continue;
    const serviceId = (service as Record<string, unknown>).id as number;
    const serviceName = (service as Record<string, unknown>).name as string;
    const entry = menuMap.get(serviceId) || { name: serviceName, csatSum: 0, count: 0 };
    entry.csatSum += r.csat as number;
    entry.count++;
    menuMap.set(serviceId, entry);
  }
  const menuCsat: MenuCsat[] = Array.from(menuMap.entries())
    .map(([serviceId, entry]) => ({
      serviceId,
      serviceName: entry.name,
      avgCsat: Number((entry.csatSum / entry.count).toFixed(1)),
      responseCount: entry.count,
    }))
    .sort((a, b) => b.avgCsat - a.avgCsat);

  // -- Segment CSAT --
  const customerIds = [...new Set(responses.map((r) => r.customer_user_id as number))];
  let segmentCsat: SegmentCsat[] = [];

  // Build segment map for cross-analysis
  const segmentMapAll = new Map<number, string>();
  if (customerIds.length > 0) {
    const segmentNames = ["excellent", "normal", "dormant", "at_risk"];
    const segmentResults = await Promise.all(
      segmentNames.map((seg) =>
        supabase.rpc("get_segment_customer_ids", {
          p_provider_id: provider.id,
          p_segment: seg,
        }).then(({ data }) => ({ seg, data }))
      )
    );
    for (const { seg, data: segIds } of segmentResults) {
      if (segIds) {
        for (const row of segIds as { customer_user_id: number }[]) {
          segmentMapAll.set(row.customer_user_id, seg);
        }
      }
    }

    const segCsatMap = new Map<string, { csatSum: number; count: number }>();
    for (const r of responses) {
      const seg = segmentMapAll.get(r.customer_user_id as number) || "unknown";
      const entry = segCsatMap.get(seg) || { csatSum: 0, count: 0 };
      entry.csatSum += r.csat as number;
      entry.count++;
      segCsatMap.set(seg, entry);
    }

    const segmentLabels: Record<string, string> = {
      excellent: "優良",
      normal: "通常",
      dormant: "休眠",
      at_risk: "離脱リスク",
    };

    segmentCsat = Array.from(segCsatMap.entries())
      .filter(([seg]) => seg !== "unknown")
      .map(([seg, entry]) => ({
        segment: seg,
        segmentLabel: segmentLabels[seg] || seg,
        avgCsat: Number((entry.csatSum / entry.count).toFixed(1)),
        responseCount: entry.count,
      }));
  }

  // -- Gender/Age CSAT --
  let genderCsat: { gender: string; label: string; avgCsat: number; count: number }[] = [];
  let ageCsat: { ageGroup: string; avgCsat: number; count: number }[] = [];

  if (customerIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, gender, birth_date")
      .in("id", customerIds);

    if (users) {
      const userMap = new Map(users.map((u) => [u.id as number, u]));

      const genderMap = new Map<string, { csatSum: number; count: number }>();
      for (const r of responses) {
        const u = userMap.get(r.customer_user_id as number);
        const g = (u?.gender as string) || "unknown";
        const entry = genderMap.get(g) || { csatSum: 0, count: 0 };
        entry.csatSum += r.csat as number;
        entry.count++;
        genderMap.set(g, entry);
      }

      const genderLabels: Record<string, string> = {
        male: "男性", female: "女性", other: "その他",
        prefer_not_to_say: "未回答", unknown: "未設定",
      };

      genderCsat = Array.from(genderMap.entries())
        .filter(([g]) => g !== "unknown")
        .map(([g, entry]) => ({
          gender: g,
          label: genderLabels[g] || g,
          avgCsat: Number((entry.csatSum / entry.count).toFixed(1)),
          count: entry.count,
        }));

      const ageGroupMap = new Map<string, { csatSum: number; count: number }>();
      const now = new Date();
      for (const r of responses) {
        const u = userMap.get(r.customer_user_id as number);
        if (!u?.birth_date) continue;
        const bd = new Date(u.birth_date as string);
        let age = now.getFullYear() - bd.getFullYear();
        const m = now.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
        const ageGroup = `${Math.floor(age / 10) * 10}代`;
        const entry = ageGroupMap.get(ageGroup) || { csatSum: 0, count: 0 };
        entry.csatSum += r.csat as number;
        entry.count++;
        ageGroupMap.set(ageGroup, entry);
      }

      ageCsat = Array.from(ageGroupMap.entries())
        .map(([ageGroup, entry]) => ({
          ageGroup,
          avgCsat: Number((entry.csatSum / entry.count).toFixed(1)),
          count: entry.count,
        }))
        .sort((a, b) => parseInt(a.ageGroup) - parseInt(b.ageGroup));
    }
  }

  // ============================================================
  // Cross-analysis: booking data x survey data
  // ============================================================

  // Get all bookings for this provider in the date range for cross-analysis
  let bookingQuery = supabase
    .from("bookings")
    .select("id, customer_user_id, service_id, start_at, status, services:service_id ( id, name, price )")
    .eq("provider_id", provider.id)
    .eq("status", "confirmed");

  if (startDate) bookingQuery = bookingQuery.gte("start_at", startDate);
  if (endDate) bookingQuery = bookingQuery.lte("start_at", endDate);
  if (segmentCustomerIds && segmentCustomerIds.length > 0) {
    bookingQuery = bookingQuery.in("customer_user_id", segmentCustomerIds);
  }

  const { data: allBookings } = await bookingQuery;
  const bookings = allBookings || [];

  // -- a. Unit Price x CSAT --
  // Calculate per-customer unit price, then cross with their avg CSAT
  const customerSpend = new Map<number, { totalRevenue: number; bookingCount: number }>();
  for (const b of bookings) {
    const custId = b.customer_user_id as number;
    const service = Array.isArray(b.services) ? b.services[0] : b.services;
    const price = service ? Number((service as Record<string, unknown>).price ?? 0) : 0;
    const entry = customerSpend.get(custId) || { totalRevenue: 0, bookingCount: 0 };
    entry.totalRevenue += price;
    entry.bookingCount++;
    customerSpend.set(custId, entry);
  }

  const customerCsat = new Map<number, { csatSum: number; count: number }>();
  for (const r of responses) {
    const custId = r.customer_user_id as number;
    const entry = customerCsat.get(custId) || { csatSum: 0, count: 0 };
    entry.csatSum += r.csat as number;
    entry.count++;
    customerCsat.set(custId, entry);
  }

  // Classify customers into unit price tiers
  const customerUnitPrices: { custId: number; unitPrice: number; avgCsat: number }[] = [];
  for (const [custId, spend] of customerSpend) {
    const csat = customerCsat.get(custId);
    if (!csat) continue;
    customerUnitPrices.push({
      custId,
      unitPrice: Math.round(spend.totalRevenue / spend.bookingCount),
      avgCsat: Number((csat.csatSum / csat.count).toFixed(1)),
    });
  }

  let unitPriceCsat: UnitPriceCsat[] = [];
  if (customerUnitPrices.length > 0) {
    const allPrices = customerUnitPrices.map((c) => c.unitPrice).sort((a, b) => a - b);
    const p33 = allPrices[Math.floor(allPrices.length / 3)] || 0;
    const p66 = allPrices[Math.floor((allPrices.length * 2) / 3)] || 0;

    const tiers: { tier: string; tierLabel: string; customers: typeof customerUnitPrices }[] = [
      { tier: "low", tierLabel: "低単価", customers: customerUnitPrices.filter((c) => c.unitPrice <= p33) },
      { tier: "mid", tierLabel: "中単価", customers: customerUnitPrices.filter((c) => c.unitPrice > p33 && c.unitPrice <= p66) },
      { tier: "high", tierLabel: "高単価", customers: customerUnitPrices.filter((c) => c.unitPrice > p66) },
    ];

    unitPriceCsat = tiers
      .filter((t) => t.customers.length > 0)
      .map((t) => ({
        tier: t.tier,
        tierLabel: t.tierLabel,
        avgCsat: Number((t.customers.reduce((s, c) => s + c.avgCsat, 0) / t.customers.length).toFixed(1)),
        count: t.customers.length,
        avgUnitPrice: Math.round(t.customers.reduce((s, c) => s + c.unitPrice, 0) / t.customers.length),
      }));
  }

  // -- b. New vs Repeater x CSAT --
  // Count bookings per customer to determine new vs repeater
  const customerBookingCounts = new Map<number, number>();
  for (const b of bookings) {
    const custId = b.customer_user_id as number;
    customerBookingCounts.set(custId, (customerBookingCounts.get(custId) || 0) + 1);
  }

  const newCsatList: number[] = [];
  const repeaterCsatList: number[] = [];
  for (const r of responses) {
    const custId = r.customer_user_id as number;
    const count = customerBookingCounts.get(custId) || 0;
    if (count <= 1) {
      newCsatList.push(r.csat as number);
    } else {
      repeaterCsatList.push(r.csat as number);
    }
  }

  const newVsRepeaterCsat: NewVsRepeaterCsat[] = [];
  if (newCsatList.length > 0) {
    newVsRepeaterCsat.push({
      type: "new",
      label: "新規",
      avgCsat: Number((newCsatList.reduce((s, c) => s + c, 0) / newCsatList.length).toFixed(1)),
      count: newCsatList.length,
    });
  }
  if (repeaterCsatList.length > 0) {
    newVsRepeaterCsat.push({
      type: "repeater",
      label: "リピーター",
      avgCsat: Number((repeaterCsatList.reduce((s, c) => s + c, 0) / repeaterCsatList.length).toFixed(1)),
      count: repeaterCsatList.length,
    });
  }

  // -- c. Revenue x CSAT correlation (monthly) --
  const monthlyRevenue = new Map<string, number>();
  for (const b of bookings) {
    const month = (b.start_at as string).slice(0, 7);
    const service = Array.isArray(b.services) ? b.services[0] : b.services;
    const price = service ? Number((service as Record<string, unknown>).price ?? 0) : 0;
    monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + price);
  }

  const revenueCorrelation: RevenueCorrelation[] = [];
  for (const [month, entry] of monthlyMap) {
    const revenue = monthlyRevenue.get(month) || 0;
    if (revenue > 0) {
      revenueCorrelation.push({
        month,
        revenue,
        avgCsat: Number((entry.csatSum / entry.count).toFixed(1)),
      });
    }
  }

  // -- d. Menu CSAT x booking count matrix --
  const menuBookingCounts = new Map<number, number>();
  for (const b of bookings) {
    const service = Array.isArray(b.services) ? b.services[0] : b.services;
    if (!service) continue;
    const sid = (service as Record<string, unknown>).id as number;
    menuBookingCounts.set(sid, (menuBookingCounts.get(sid) || 0) + 1);
  }

  const menuCsatMatrix: MenuCsatMatrix[] = menuCsat.map((m) => ({
    serviceName: m.serviceName,
    serviceId: m.serviceId,
    avgCsat: m.avgCsat,
    bookingCount: menuBookingCounts.get(m.serviceId) || 0,
    responseCount: m.responseCount,
  }));

  // -- e. Word cloud from comments --
  const allComments: string[] = [];
  for (const r of responses) {
    if (r.comment) allComments.push(r.comment as string);
    if (r.review_text) allComments.push(r.review_text as string);
  }

  const wordCounts = new Map<string, number>();
  const fullText = allComments.join(" ");

  // Predefined keyword matching
  for (const keyword of PREDEFINED_KEYWORDS) {
    const regex = new RegExp(keyword, "g");
    const matches = fullText.match(regex);
    if (matches && matches.length > 0) {
      wordCounts.set(keyword, (wordCounts.get(keyword) || 0) + matches.length);
    }
  }

  // N-gram extraction (2-4 chars) for additional words
  for (const comment of allComments) {
    for (let n = 2; n <= 4; n++) {
      for (let i = 0; i <= comment.length - n; i++) {
        const gram = comment.slice(i, i + n);
        // Skip if contains space, punctuation, or numbers
        if (/[\s\d.,!?、。！？\n\r\t()（）「」『』]/.test(gram)) continue;
        // Skip if already covered by predefined keywords
        if (PREDEFINED_KEYWORDS.includes(gram)) continue;
        wordCounts.set(gram, (wordCounts.get(gram) || 0) + 1);
      }
    }
  }

  // Filter: min count 2, sort by count desc, top 30
  const wordCloud: WordCloudItem[] = Array.from(wordCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word, count]) => ({ word, count }));

  return {
    csatTrend,
    driverTrend,
    menuCsat,
    segmentCsat,
    driverAverages,
    genderCsat,
    ageCsat,
    unitPriceCsat,
    newVsRepeaterCsat,
    revenueCorrelation,
    menuCsatMatrix,
    wordCloud,
  };
}

function emptyAdvancedStats(): SurveyAdvancedStats {
  return {
    csatTrend: [], driverTrend: [], menuCsat: [], segmentCsat: [],
    driverAverages: { service: 0, quality: 0, price: 0 },
    genderCsat: [], ageCsat: [],
    unitPriceCsat: [], newVsRepeaterCsat: [], revenueCorrelation: [],
    menuCsatMatrix: [], wordCloud: [],
  };
}
