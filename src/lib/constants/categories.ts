import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface Category {
  value: string;
  label: string;
}

// サーバーコンポーネントでリクエスト単位でキャッシュ
export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("value, label")
    .eq("is_active", true)
    .order("sort_order");
  return (data || []) as Category[];
});

export async function getCategoryLabel(value: string | null): Promise<string | null> {
  if (!value) return null;
  const categories = await getCategories();
  return categories.find((c) => c.value === value)?.label ?? null;
}

// クライアントコンポーネント用: Server Componentからpropsで渡す用の型
export type CategoryOption = Category;
