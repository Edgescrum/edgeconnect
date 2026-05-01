"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProviderId } from "@/lib/auth/provider-session";

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
  recentResponses: {
    id: number;
    csat: number;
    serviceName: string | null;
    bookingDate: string | null;
    comment: string | null;
    createdAt: string;
  }[];
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
}

// ============================================================
// Basic Stats (available for all plans)
// ============================================================

export async function getSurveyBasicStats(): Promise<SurveyBasicStats> {
  const provider = await getProviderWithPlan();
  const supabase = createAdminClient();

  // 全アンケート回答を取得
  const { data: responses } = await supabase
    .from("survey_responses")
    .select(`
      id, csat, comment, created_at,
      bookings:booking_id (
        start_at,
        services:service_id ( name )
      )
    `)
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // 回答率計算: 送信済み通知数 vs 回答数
  const { count: sentCount } = await supabase
    .from("pending_survey_notifications")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", provider.id)
    .eq("status", "sent");

  const { count: responseCount } = await supabase
    .from("survey_responses")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", provider.id);

  const totalResponses = responseCount || 0;
  const totalSent = sentCount || 0;
  const responseRate = totalSent > 0
    ? Math.round((totalResponses / totalSent) * 1000) / 10
    : 0;

  const avgCsat = totalResponses > 0
    ? (responses || []).reduce((sum, r) => sum + (r.csat as number), 0) / Math.min(totalResponses, (responses || []).length)
    : 0;

  const recentResponses = (responses || []).slice(0, 10).map((r) => {
    const booking = Array.isArray(r.bookings) ? r.bookings[0] : r.bookings;
    const service = booking
      ? Array.isArray((booking as Record<string, unknown>).services)
        ? ((booking as Record<string, unknown>).services as Record<string, unknown>[])[0]
        : (booking as Record<string, unknown>).services
      : null;

    return {
      id: r.id as number,
      csat: r.csat as number,
      serviceName: (service as Record<string, unknown>)?.name as string | null,
      bookingDate: (booking as Record<string, unknown>)?.start_at as string | null,
      comment: r.comment as string | null,
      createdAt: r.created_at as string,
    };
  });

  return {
    avgCsat: Number(avgCsat.toFixed(1)),
    totalResponses,
    responseRate,
    recentResponses,
  };
}

// ============================================================
// Advanced Stats (standard plan only)
// ============================================================

export async function getSurveyAdvancedStats(): Promise<SurveyAdvancedStats> {
  const provider = await getProviderWithPlan();
  if (provider.plan === "basic") {
    throw new Error("この機能はスタンダードプラン以上でご利用いただけます");
  }

  const supabase = createAdminClient();

  // 全回答データを一括取得（過去12ヶ月）
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: allResponses } = await supabase
    .from("survey_responses")
    .select(`
      id, csat, driver_service, driver_quality, driver_price,
      created_at, customer_user_id,
      bookings:booking_id (
        start_at,
        service_id,
        services:service_id ( id, name )
      )
    `)
    .eq("provider_id", provider.id)
    .gte("created_at", twelveMonthsAgo.toISOString())
    .order("created_at", { ascending: true });

  const responses = allResponses || [];

  // -- CSAT月次推移 --
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

  // -- ドライバー全体平均 --
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

  // -- メニュー別CSAT --
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

  // -- セグメント別CSAT --
  // 顧客のセグメント情報を取得
  const customerIds = [...new Set(responses.map((r) => r.customer_user_id as number))];
  let segmentCsat: SegmentCsat[] = [];

  if (customerIds.length > 0) {
    const { data: segmentData } = await supabase.rpc("get_segment_customer_ids", {
      p_provider_id: provider.id,
      p_segment: null,
    });

    // セグメントIDマップ作成（全セグメントを取得して分類）
    const segmentMap = new Map<number, string>();
    for (const seg of ["excellent", "normal", "dormant", "at_risk"]) {
      const { data: segIds } = await supabase.rpc("get_segment_customer_ids", {
        p_provider_id: provider.id,
        p_segment: seg,
      });
      if (segIds) {
        for (const row of segIds as { customer_user_id: number }[]) {
          segmentMap.set(row.customer_user_id, seg);
        }
      }
    }

    const segCsatMap = new Map<string, { csatSum: number; count: number }>();
    for (const r of responses) {
      const seg = segmentMap.get(r.customer_user_id as number) || "unknown";
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

  // -- 属性別CSAT（性別 / 年代） --
  let genderCsat: { gender: string; label: string; avgCsat: number; count: number }[] = [];
  let ageCsat: { ageGroup: string; avgCsat: number; count: number }[] = [];

  if (customerIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, gender, birth_date")
      .in("id", customerIds);

    if (users) {
      const userMap = new Map(users.map((u) => [u.id as number, u]));

      // 性別別CSAT
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
        male: "男性",
        female: "女性",
        other: "その他",
        prefer_not_to_say: "未回答",
        unknown: "未設定",
      };

      genderCsat = Array.from(genderMap.entries())
        .filter(([g]) => g !== "unknown")
        .map(([g, entry]) => ({
          gender: g,
          label: genderLabels[g] || g,
          avgCsat: Number((entry.csatSum / entry.count).toFixed(1)),
          count: entry.count,
        }));

      // 年代別CSAT
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
        .sort((a, b) => {
          const aNum = parseInt(a.ageGroup);
          const bNum = parseInt(b.ageGroup);
          return aNum - bNum;
        });
    }
  }

  return {
    csatTrend,
    driverTrend,
    menuCsat,
    segmentCsat,
    driverAverages,
    genderCsat,
    ageCsat,
  };
}
