import { cache } from "react";
import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { log, logError } from "@/lib/log";

export const getProviderId = cache(async () => {
  const user = await resolveUser();
  if (!user || user.role !== "provider") {
    logError("provider-session", "getProviderId: not a provider", { role: user?.role });
    throw new Error("Not authorized");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    logError("provider-session", "getProviderId: provider not found", error);
    throw new Error("Provider not found");
  }

  log("provider-session", "getProviderId: resolved", { id: data.id, slug: data.slug });
  return data;
});
