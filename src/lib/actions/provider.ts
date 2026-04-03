"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, resolveUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { log, logError } from "@/lib/log";

export async function registerProvider(formData: FormData) {
  const lineUserId = formData.get("line_user_id") as string | null;
  log("registerProvider", "start", { lineUserId });
  const user = await resolveUser(lineUserId);
  if (!user) {
    logError("registerProvider", "user not resolved", { lineUserId });
    throw new Error("Not authenticated");
  }
  log("registerProvider", "user resolved", { id: user.id });

  const slug = (formData.get("slug") as string).toLowerCase().trim();
  const name = formData.get("name") as string;
  const bio = (formData.get("bio") as string) || null;
  const lineContactUrl = (formData.get("line_contact_url") as string) || null;
  const contactEmail = (formData.get("contact_email") as string) || null;

  const supabase = createAdminClient();

  // アイコン画像アップロード
  let iconUrl: string | null = null;
  const iconFile = formData.get("icon") as File | null;
  if (iconFile && iconFile.size > 0) {
    const ext = iconFile.name.split(".").pop();
    const path = `${user.lineUserId}/icon.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, iconFile, { upsert: true });
    if (uploadError) throw new Error("Icon upload failed");
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    iconUrl = publicUrl;
  }

  const { data, error } = await supabase.rpc("register_provider", {
    p_line_user_id: user.lineUserId,
    p_slug: slug,
    p_name: name,
    p_line_contact_url: lineContactUrl,
    p_contact_email: contactEmail,
    p_bio: bio,
    p_icon_url: iconUrl,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/provider");
  return data;
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();

  if (!provider) throw new Error("Provider not found");

  const updates: Record<string, unknown> = {};
  const name = formData.get("name") as string;
  const bio = formData.get("bio") as string;
  const lineContactUrl = formData.get("line_contact_url") as string;
  const contactEmail = formData.get("contact_email") as string;

  if (name) updates.name = name;
  if (bio !== null) updates.bio = bio;
  updates.line_contact_url = lineContactUrl || null;
  updates.contact_email = contactEmail || null;

  const iconFile = formData.get("icon") as File | null;
  if (iconFile && iconFile.size > 0) {
    const ext = iconFile.name.split(".").pop();
    const path = `${user.lineUserId}/icon.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, iconFile, { upsert: true });
    if (uploadError) throw new Error("Icon upload failed");
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    updates.icon_url = publicUrl;
  }

  const { error } = await supabase
    .from("providers")
    .update(updates)
    .eq("id", provider.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/p/${provider.slug}`);
  revalidatePath("/provider/profile");
}

export async function checkSlugAvailability(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return !data;
}
