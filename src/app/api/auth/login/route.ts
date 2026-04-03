import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac } from "crypto";
import { log, logError } from "@/lib/log";

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

    log("login", "start", { hasToken: !!accessToken });
    const lineProfile = await getLineProfile(accessToken);
    log("login", "LINE profile", { userId: lineProfile.userId, name: lineProfile.displayName });

    const { email, password } = deriveCredentials(lineProfile.userId);
    const supabase = await createClient();
    let { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      log("login", "signIn failed, creating user");
      const admin = createAdminClient();
      const { error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { line_user_id: lineProfile.userId },
      });
      if (createError) logError("login", "createUser failed", createError);

      ({ data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password }));

      if (signInError) {
        logError("login", "signIn after create failed", signInError);
        return NextResponse.json({ error: "Auth failed" }, { status: 500 });
      }
    }

    const authUid = signInData.user?.id;
    log("login", "auth success", { authUid });

    void supabase.rpc("upsert_user_from_line", {
      p_line_user_id: lineProfile.userId,
      p_display_name: lineProfile.displayName,
      p_role: "customer",
      p_auth_uid: authUid,
    });

    const response = NextResponse.json({
      user: {
        lineUserId: lineProfile.userId,
        displayName: lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl,
      },
    });

    // lineUserIdをcookieに保存（Server Componentで使用）
    response.cookies.set("line_user_id", lineProfile.userId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30日
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
