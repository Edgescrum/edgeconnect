import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyLineAccessToken } from "@/lib/auth/line";
import { createHmac } from "crypto";

// LINE userId から Supabase Auth 用のメールとパスワードを生成
function deriveCredentials(lineUserId: string) {
  const email = `${lineUserId}@line.edgeconnect.local`;
  const password = createHmac("sha256", process.env.LINE_CHANNEL_SECRET!)
    .update(lineUserId)
    .digest("hex");
  return { email, password };
}

export async function POST(request: Request) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "accessToken is required" },
        { status: 400 }
      );
    }

    // 1. LINE アクセストークンを検証してプロフィール取得
    const lineProfile = await verifyLineAccessToken(accessToken);

    // 2. Supabase Auth の認証情報を生成
    const { email, password } = deriveCredentials(lineProfile.userId);

    // 3. Supabase Auth にサインイン試行
    const supabase = await createClient();
    let { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    // 4. ユーザーが存在しない場合は作成
    if (signInError) {
      const admin = createAdminClient();
      const { error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          line_user_id: lineProfile.userId,
          display_name: lineProfile.displayName,
        },
      });

      if (createError) {
        return NextResponse.json(
          { error: "Failed to create auth user" },
          { status: 500 }
        );
      }

      // 作成後にサインイン
      ({ data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password }));

      if (signInError) {
        return NextResponse.json(
          { error: "Failed to sign in after creation" },
          { status: 500 }
        );
      }
    }

    // 5. users テーブルに UPSERT（auth_uid を紐付け）
    const authUid = signInData.user?.id;
    await supabase.rpc("upsert_user_from_line", {
      p_line_user_id: lineProfile.userId,
      p_display_name: lineProfile.displayName,
      p_role: "customer",
      p_auth_uid: authUid,
    });

    return NextResponse.json({
      user: {
        lineUserId: lineProfile.userId,
        displayName: lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
