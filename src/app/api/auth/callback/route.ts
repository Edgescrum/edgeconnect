// TODO: Add rate limiting (e.g., @vercel/ratelimit) before production
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac } from "crypto";
import { log, logError } from "@/lib/log";
import { signCookieValue } from "@/lib/auth/cookie";

function deriveCredentials(lineUserId: string) {
  const email = `${lineUserId.toLowerCase()}@line.peco.local`;
  const password = createHmac("sha256", process.env.LINE_CHANNEL_SECRET!)
    .update(lineUserId)
    .digest("hex");
  return { email, password };
}

// LINE OAuth code → access token（PKCE対応）
async function exchangeCodeForToken(code: string, redirectUri: string, codeVerifier?: string) {
  const channelId = process.env.NEXT_PUBLIC_LIFF_ID!.split("-")[0];
  const channelSecret = process.env.LIFF_CHANNEL_SECRET || process.env.LINE_CHANNEL_SECRET!;

  const params: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: channelId,
    client_secret: channelSecret,
  };
  if (codeVerifier) {
    params.code_verifier = codeVerifier;
  }

  const res = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${error}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// access token → LINE profile
async function getLineProfile(accessToken: string) {
  const res = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to get LINE profile");
  const profile = await res.json();
  return {
    userId: profile.userId as string,
    displayName: profile.displayName as string,
    pictureUrl: profile.pictureUrl as string | undefined,
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code, redirect_uri: redirectUri, code_verifier: codeVerifier } = body;

  if (!code || !redirectUri) {
    return NextResponse.json({ error: "code and redirect_uri required" }, { status: 400 });
  }

  try {
    log("callback", "exchanging code for token", { hasCodeVerifier: !!codeVerifier });
    const accessToken = await exchangeCodeForToken(code, redirectUri, codeVerifier);

    log("callback", "getting LINE profile");
    const lineProfile = await getLineProfile(accessToken);
    log("callback", "profile", { userId: lineProfile.userId, name: lineProfile.displayName });

    // Supabase Auth セッション作成
    const { email, password } = deriveCredentials(lineProfile.userId);
    const supabase = await createClient();
    let { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      log("callback", "signIn failed, creating user");
      const admin = createAdminClient();
      const { error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { line_user_id: lineProfile.userId },
      });
      if (createError) logError("callback", "createUser failed", createError);

      ({ data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password }));

      if (signInError) {
        logError("callback", "signIn after create failed", signInError);
        return NextResponse.json({ error: "Auth failed" }, { status: 500 });
      }
    }

    const authUid = signInData.user?.id;
    log("callback", "auth success", { authUid });

    // usersテーブル更新
    const { error: upsertError } = await supabase.rpc("upsert_user_from_line", {
      p_line_user_id: lineProfile.userId,
      p_display_name: lineProfile.displayName,
      p_role: "customer",
      p_auth_uid: authUid,
    });
    if (upsertError) logError("callback", "upsert failed", upsertError);

    const response = NextResponse.json({ ok: true });
    response.cookies.set("line_user_id", signCookieValue(lineProfile.userId), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    log("callback", "login success", { userId: lineProfile.userId });
    return response;
  } catch (error) {
    logError("callback", "failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 500 }
    );
  }
}
