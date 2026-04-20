"use server";

import { createClient } from "@/lib/supabase/server";

export interface ProviderCard {
  slug: string;
  name: string;
  bio: string | null;
  icon_url: string | null;
  category: string | null;
  brand_color: string | null;
}

export async function searchProviders(
  categories: string[] | null,
  query: string | null,
  offset: number = 0,
  limit: number = 20
): Promise<ProviderCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_providers", {
    p_categories: categories && categories.length > 0 ? categories : null,
    p_query: query || null,
    p_offset: offset,
    p_limit: limit,
  });

  if (error) throw new Error(error.message);
  return (data || []) as ProviderCard[];
}
