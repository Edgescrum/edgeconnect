"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { log, logError } from "@/lib/log";
import { isReservedSlug } from "@/lib/constants/reserved-slugs";
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { brand } from "@/lib/brand";
import { validateImageFile } from "@/lib/constants/upload";

async function cleanOldIcons(adminSupabase: SupabaseClient, lineUserId: string) {
  const { data: files } = await adminSupabase.storage
    .from("avatars")
    .list(lineUserId);
  if (!files) return;
  // icon-default.png以外の古いファイルを削除
  const toDelete = files
    .filter((f) => f.name !== "icon-default.png")
    .map((f) => `${lineUserId}/${f.name}`);
  if (toDelete.length > 0) {
    await adminSupabase.storage.from("avatars").remove(toDelete);
  }
}

async function uploadIcon(
  adminSupabase: SupabaseClient,
  lineUserId: string,
  file: File
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const pngBuffer = await sharp(buffer)
    .rotate() // EXIF orientationに基づいて自動回転
    .resize(512, 512, { fit: "cover" })
    .png({ quality: 85 })
    .toBuffer();
  // 古いアイコンを削除（デフォルトは残す）
  await cleanOldIcons(adminSupabase, lineUserId);
  // キャッシュバスティング: タイムスタンプをファイル名に含める
  const path = `${lineUserId}/icon-${Date.now()}.png`;
  const { error } = await adminSupabase.storage
    .from("avatars")
    .upload(path, pngBuffer, { upsert: true, contentType: "image/png" });
  if (error) throw new Error("Icon upload failed");
  const { data: { publicUrl } } = adminSupabase.storage.from("avatars").getPublicUrl(path);
  return publicUrl;
}

async function generateDefaultIcon(
  adminSupabase: SupabaseClient,
  lineUserId: string,
  name: string
): Promise<string | null> {
  const initial = (name || "?")[0];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
    <rect width="256" height="256" rx="48" fill="${brand.primary}"/>
    <text x="128" y="140" text-anchor="middle" dominant-baseline="middle"
      font-family="sans-serif" font-size="120" font-weight="bold" fill="#fff">${initial}</text>
  </svg>`;
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  const path = `${lineUserId}/icon-default.png`;
  const { error } = await adminSupabase.storage
    .from("avatars")
    .upload(path, pngBuffer, {
      upsert: true,
      contentType: "image/png",
    });
  if (error) {
    logError("generateDefaultIcon", "upload failed", error);
    return null;
  }
  const { data: { publicUrl } } = adminSupabase.storage.from("avatars").getPublicUrl(path);
  return publicUrl;
}

export async function registerProvider(formData: FormData) {
  // cookieからのみ認証（formDataのlineUserIdは受け付けない）
  const user = await resolveUser();
  if (!user) {
    logError("registerProvider", "user not resolved");
    throw new Error("Not authenticated");
  }
  log("registerProvider", "user resolved", { id: user.id });

  const slug = (formData.get("slug") as string).toLowerCase().trim();
  const name = formData.get("name") as string;
  const bio = (formData.get("bio") as string) || null;
  const category = (formData.get("category") as string) || null;
  const lineId = (formData.get("line_id") as string)?.trim();
  const lineContactUrl = lineId ? `https://line.me/ti/p/~${lineId}` : null;
  const contactEmail = (formData.get("contact_email") as string) || null;
  const contactPhone = (formData.get("contact_phone") as string)?.trim() || null;

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // アイコン画像アップロード（512x512 PNGにリサイズ）
  let iconUrl: string | null = null;
  const iconFile = formData.get("icon") as File | null;
  if (iconFile && iconFile.size > 0) {
    validateImageFile(iconFile);
    iconUrl = await uploadIcon(adminSupabase, user.lineUserId, iconFile);
  } else {
    // 未設定時: 頭文字のデフォルトアイコンを生成
    iconUrl = await generateDefaultIcon(adminSupabase, user.lineUserId, name);
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

  // 利用規約同意日時を記録
  const termsAgreed = formData.get("terms_agreed") === "1";
  if (termsAgreed) {
    await supabase
      .from("users")
      .update({ terms_agreed_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  // category, contact_phone, plan, emailはRPC外で更新
  const providerId = typeof data === "object" && data !== null ? (data as { id: number }).id : null;
  if (providerId) {
    const extra: Record<string, unknown> = {};
    if (category) extra.category = category;
    if (contactPhone) extra.contact_phone = contactPhone;
    const plan = formData.get("plan") as string;
    if (plan && ["basic", "standard", "team"].includes(plan)) {
      extra.plan = plan;
    }
    if (Object.keys(extra).length > 0) {
      await supabase.from("providers").update(extra).eq("id", providerId);
    }
  }

  // revalidateは完了画面表示後にrouter.pushで遷移する際に行う
  return data;
}

export async function updateProfile(formData: FormData) {
  const user = await resolveUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();

  if (!provider) throw new Error("Provider not found");

  const updates: Record<string, unknown> = {};
  const name = formData.get("name") as string;
  const bio = formData.get("bio") as string;
  const category = (formData.get("category") as string) || null;
  const lineEnabled = formData.get("line_enabled") === "1";
  const lineId = (formData.get("line_id") as string)?.trim();
  const emailEnabled = formData.get("email_enabled") === "1";
  const contactEmail = formData.get("contact_email") as string;
  const phoneEnabled = formData.get("phone_enabled") === "1";
  const contactPhoneVal = (formData.get("contact_phone") as string)?.trim();
  const brandColor = formData.get("brand_color") as string;

  // 連絡先が1つも設定されていない場合はエラー
  const hasContact = (lineEnabled && lineId) || (emailEnabled && contactEmail) || (phoneEnabled && contactPhoneVal);
  if (!hasContact) throw new Error("連絡方法を1つ以上設定してください");

  if (name) updates.name = name;
  if (bio !== null) updates.bio = bio;
  updates.category = category;
  // LINE ID → URL自動生成、OFFならクリア
  updates.line_contact_url = lineEnabled && lineId
    ? `https://line.me/ti/p/~${lineId}`
    : null;
  // メール: OFFならクリア
  updates.contact_email = emailEnabled && contactEmail
    ? contactEmail
    : null;
  // 電話: OFFならクリア
  updates.contact_phone = phoneEnabled && contactPhoneVal
    ? contactPhoneVal
    : null;
  if (brandColor) updates.brand_color = brandColor;

  const iconFile = formData.get("icon") as File | null;
  if (iconFile && iconFile.size > 0) {
    validateImageFile(iconFile);
    updates.icon_url = await uploadIcon(adminSupabase, user.lineUserId, iconFile);
  }

  const { error } = await supabase
    .from("providers")
    .update(updates)
    .eq("id", provider.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/p/${provider.slug}`);
  revalidatePath("/provider/profile");
}

export async function checkSlugAvailability(slug: string): Promise<{ available: boolean; reason?: string }> {
  // 予約語チェック
  if (isReservedSlug(slug)) {
    return { available: false, reason: "reserved" };
  }
  // DB重複チェック
  const supabase = await createClient();
  const { data } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (data) {
    return { available: false, reason: "taken" };
  }
  return { available: true };
}
