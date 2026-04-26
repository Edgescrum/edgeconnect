"use server";

import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logError } from "@/lib/log";

const MAX_FAVORITES = 50;

/**
 * お気に入り登録/解除のトグル
 */
export async function toggleFavorite(providerId: number): Promise<{
  success: boolean;
  isFavorited: boolean;
  error?: string;
}> {
  const user = await resolveUser();
  if (!user) {
    return { success: false, isFavorited: false, error: "ログインが必要です" };
  }

  try {
    const supabase = createAdminClient();

    // 現在の状態を確認
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider_id", providerId)
      .single();

    if (existing) {
      // 解除
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("provider_id", providerId);

      revalidatePath("/favorites");
      return { success: true, isFavorited: false };
    }

    // 上限チェック
    const { count } = await supabase
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (count !== null && count >= MAX_FAVORITES) {
      return {
        success: false,
        isFavorited: false,
        error: `お気に入りは最大${MAX_FAVORITES}件までです`,
      };
    }

    // 登録
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, provider_id: providerId });

    if (error) {
      // UNIQUEエラーの場合は既に登録済み
      if (error.code === "23505") {
        return { success: true, isFavorited: true };
      }
      throw error;
    }

    revalidatePath("/favorites");
    return { success: true, isFavorited: true };
  } catch (error) {
    logError("favorite", "toggleFavorite failed", error);
    return { success: false, isFavorited: false, error: "エラーが発生しました" };
  }
}

/**
 * お気に入り済み判定
 */
export async function isFavorited(providerId: number): Promise<boolean> {
  const user = await resolveUser();
  if (!user) return false;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider_id", providerId)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

/**
 * お気に入り一覧取得（カテゴリフィルタ対応）
 */
export async function getFavorites(category?: string): Promise<{
  favorites: FavoriteItem[];
  error?: string;
}> {
  const user = await resolveUser();
  if (!user) {
    return { favorites: [], error: "ログインが必要です" };
  }

  try {
    const supabase = createAdminClient();

    // お気に入りと事業主情報をJOIN取得
    let query = supabase
      .from("favorites")
      .select(
        `
        id,
        created_at,
        providers:provider_id (
          id,
          slug,
          name,
          bio,
          icon_url,
          category
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    // 最終予約日を取得
    const providerIds = (data || [])
      .map((f) => {
        const p = Array.isArray(f.providers) ? f.providers[0] : f.providers;
        return p?.id;
      })
      .filter(Boolean) as number[];

    let lastBookingMap: Record<number, string> = {};
    if (providerIds.length > 0) {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("provider_id, start_at")
        .eq("customer_user_id", user.id)
        .in("provider_id", providerIds)
        .order("start_at", { ascending: false });

      if (bookings) {
        for (const b of bookings) {
          if (!lastBookingMap[b.provider_id]) {
            lastBookingMap[b.provider_id] = b.start_at;
          }
        }
      }
    }

    const favorites: FavoriteItem[] = (data || [])
      .map((f) => {
        const p = Array.isArray(f.providers) ? f.providers[0] : f.providers;
        if (!p) return null;

        // カテゴリフィルタ
        if (category && p.category !== category) return null;

        return {
          id: f.id,
          provider: {
            id: p.id,
            slug: p.slug,
            name: p.name || "",
            bio: p.bio || "",
            icon_url: p.icon_url || null,
            category: p.category || null,
          },
          lastBookingDate: lastBookingMap[p.id] || null,
          createdAt: f.created_at,
        };
      })
      .filter(Boolean) as FavoriteItem[];

    return { favorites };
  } catch (error) {
    logError("favorite", "getFavorites failed", error);
    return { favorites: [], error: "エラーが発生しました" };
  }
}

export interface FavoriteItem {
  id: number;
  provider: {
    id: number;
    slug: string;
    name: string;
    bio: string;
    icon_url: string | null;
    category: string | null;
  };
  lastBookingDate: string | null;
  createdAt: string;
}
