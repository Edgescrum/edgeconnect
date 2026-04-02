import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac } from "crypto";

function deriveCredentials(lineUserId: string) {
  const email = `${lineUserId}@line.edgeconnect.local`;
  const password = createHmac("sha256", process.env.LINE_CHANNEL_SECRET!)
    .update(lineUserId)
    .digest("hex");
  return { email, password };
}

// LINE プロフィール取得（verify + profile を1リクエストに最適化）
async function getLineProfile(accessToken: string) {
  const res = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Invalid LINE access token");
  const profile = await res.json();
  return {
    userId: profile.userId as string,
    displayName: profile.displayName as string,
    pictureUrl: profile.pictureUrl as string | undefined,
  };
}

export async function POST(request: Request) {
  try {
    const { accessToken } = await request.json();
    if (!accessToken) {
      return NextResponse.json({ error: "accessToken is required" }, { status: 400 });
    }

    // 1. LINEプロフィール取得（verify APIスキップ、profile APIのみ）
    const lineProfile = await getLineProfile(accessToken);

    // 2. Supabase Auth サインイン
    const { email, password } = deriveCredentials(lineProfile.userId);
    const supabase = await createClient();
    let { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    // 3. 初回のみ: ユーザー作成 → サインイン
    if (signInError) {
      const admin = createAdminClient();
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { line_user_id: lineProfile.userId },
      });

      ({ data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password }));

      if (signInError) {
        return NextResponse.json({ error: "Auth failed" }, { status: 500 });
      }
    }

    // 4. users テーブル UPSERT（バックグラウンド、レスポンスをブロックしない）
    const authUid = signInData.user?.id;
    // fire-and-forget
    void supabase.rpc("upsert_user_from_line", {
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
    const message = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
