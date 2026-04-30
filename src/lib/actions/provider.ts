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
import { isValidEmail } from "@/lib/validation/email";
import { isValidJapanesePhone, formatPhone } from "@/lib/phone";

async function cleanOldIcons(adminSupabase: SupabaseClient, lineUserId: string) {
  const { data: files } = await adminSupabase.storage
    .from("avatars")
    .list(lineUserId);
  if (!files) return;
  // 古いファイルを削除
  const toDelete = files.map((f) => `${lineUserId}/${f.name}`);
  if (toDelete.length > 0) {
    await adminSupabase.storage.from("avatars").remove(toDelete);
  }
}

async function uploadIcon(
  adminSupabase: SupabaseClient,
  lineUserId: string,
  file: File
): Promise<string> {
  let pngBuffer: Buffer;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    pngBuffer = await sharp(buffer)
      .rotate() // EXIF orientationに基づいて自動回転
      .resize(512, 512, { fit: "cover" })
      .png({ quality: 85 })
      .toBuffer();
  } catch (err) {
    logError("uploadIcon", "image processing failed", err);
    throw new Error("画像の処理に失敗しました。別の画像をお試しください");
  }
  // 古いアイコンを削除（デフォルトは残す）
  try {
    await cleanOldIcons(adminSupabase, lineUserId);
  } catch (err) {
    logError("uploadIcon", "cleanOldIcons failed (non-fatal)", err);
  }
  // キャッシュバスティング: タイムスタンプをファイル名に含める
  const path = `${lineUserId}/icon-${Date.now()}.png`;
  const { error } = await adminSupabase.storage
    .from("avatars")
    .upload(path, pngBuffer, { upsert: true, contentType: "image/png" });
  if (error) {
    logError("uploadIcon", "storage upload failed", error);
    throw new Error("画像のアップロードに失敗しました。しばらく時間をおいてお試しください");
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
  const contactEmailRaw = (formData.get("contact_email") as string) || null;
  const contactEmail = contactEmailRaw && isValidEmail(contactEmailRaw) ? contactEmailRaw : null;
  if (contactEmailRaw && !contactEmail) {
    throw new Error("メールアドレスの形式が正しくありません");
  }
  const contactPhoneRaw = (formData.get("contact_phone") as string)?.trim() || null;
  const contactPhone = contactPhoneRaw && isValidJapanesePhone(contactPhoneRaw)
    ? formatPhone(contactPhoneRaw)
    : null;
  if (contactPhoneRaw && !contactPhone) {
    throw new Error("電話番号の形式が正しくありません。日本の電話番号を入力してください");
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // アイコン画像アップロード（512x512 PNGにリサイズ）
  let iconUrl: string | null = null;
  const preUploadedIconUrl = formData.get("icon_url") as string | null;
  const iconFile = formData.get("icon") as File | null;
  try {
    if (preUploadedIconUrl) {
      // Stripe Checkout フロー: 事前アップロード済みのURLを使用
      iconUrl = preUploadedIconUrl;
    } else if (iconFile && iconFile.size > 0) {
      validateImageFile(iconFile);
      iconUrl = await uploadIcon(adminSupabase, user.lineUserId, iconFile);
    } else {
      // 未設定時: LINE プロフィール画像をフォールバックとして使用
      const { data: userData } = await supabase
        .from("users")
        .select("picture_url")
        .eq("id", user.id)
        .single();
      iconUrl = userData?.picture_url || null;
    }
  } catch (err) {
    // アップロードエラーは日本語メッセージを持つ Error をそのまま投げる
    if (err instanceof Error && err.message.startsWith("画像")) throw err;
    logError("registerProvider", "icon upload failed", err);
    // アイコンなしで登録を続行
    iconUrl = null;
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
  if (emailEnabled && contactEmail && !isValidEmail(contactEmail)) {
    throw new Error("メールアドレスの形式が正しくありません");
  }
  const phoneEnabled = formData.get("phone_enabled") === "1";
  const contactPhoneRaw = (formData.get("contact_phone") as string)?.trim();
  const contactPhoneVal = contactPhoneRaw && isValidJapanesePhone(contactPhoneRaw)
    ? formatPhone(contactPhoneRaw)
    : contactPhoneRaw;
  if (phoneEnabled && contactPhoneRaw && !isValidJapanesePhone(contactPhoneRaw)) {
    throw new Error("電話番号の形式が正しくありません。日本の電話番号を入力してください");
  }
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
    try {
      updates.icon_url = await uploadIcon(adminSupabase, user.lineUserId, iconFile);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("画像")) throw err;
      logError("updateProfile", "icon upload failed", err);
      throw new Error("画像のアップロードに失敗しました。しばらく時間をおいてお試しください");
    }
  }

  const { error } = await supabase
    .from("providers")
    .update(updates)
    .eq("id", provider.id);

  if (error) throw new Error(error.message);

  // オンボーディングフラグ: プロフィール保存完了
  await supabase
    .from("provider_settings")
    .update({ profile_completed: true })
    .eq("provider_id", provider.id);

  revalidatePath(`/p/${provider.slug}`);
  revalidatePath("/provider/profile");
  revalidatePath("/provider");
}

/** Stripe Checkout 前にアイコンを事前アップロードする */
export async function uploadProviderIcon(formData: FormData): Promise<string | null> {
  const user = await resolveUser();
  if (!user) throw new Error("Not authenticated");

  const iconFile = formData.get("icon") as File | null;
  if (!iconFile || iconFile.size === 0) return null;

  validateImageFile(iconFile);
  const adminSupabase = createAdminClient();
  return await uploadIcon(adminSupabase, user.lineUserId, iconFile);
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
