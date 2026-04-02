"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function registerProvider(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const slug = (formData.get("slug") as string).toLowerCase().trim();
  const name = formData.get("name") as string;
  const bio = (formData.get("bio") as string) || null;
  const lineContactUrl = formData.get("line_contact_url") as string;

  const supabase = await createClient();

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

  // Database Function で事業主登録
  const { data, error } = await supabase.rpc("register_provider", {
    p_line_user_id: user.lineUserId,
    p_slug: slug,
    p_name: name,
    p_line_contact_url: lineContactUrl,
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

  // 事業主情報取得
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

  if (name) updates.name = name;
  if (bio !== null) updates.bio = bio;
  if (lineContactUrl) updates.line_contact_url = lineContactUrl;

  // アイコン画像アップロード
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
  const supabase = await createClient();
  const { data } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return !data;
}
