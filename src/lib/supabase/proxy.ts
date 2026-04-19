import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // OAuthコールバック: /auth/callback に302リダイレクト（LIFF SDKが認識しないパラメータ名でcodeを渡す）
  if (request.nextUrl.searchParams.has("code") && request.nextUrl.searchParams.has("liffClientId")) {
    const code = request.nextUrl.searchParams.get("code")!;
    const liffRedirectUri = request.nextUrl.searchParams.get("liffRedirectUri") || request.nextUrl.origin;
    const liffState = request.nextUrl.searchParams.get("liff.state");
    const loginRedirect = request.cookies.get("login_redirect")?.value;
    const dest = liffState || loginRedirect || "/home";

    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    url.search = new URLSearchParams({
      auth_code: code,
      redirect_uri: liffRedirectUri,
      redirect: dest,
    }).toString();
    return NextResponse.redirect(url);
  }

  // トップページの ?path= / ?provider= パラメータをサーバーサイドでリダイレクト
  if (pathname === "/") {
    const path = request.nextUrl.searchParams.get("path");
    if (path) {
      const url = request.nextUrl.clone();
      url.pathname = path;
      url.search = "";
      return NextResponse.redirect(url);
    }
    const providerSlug = request.nextUrl.searchParams.get("provider");
    if (providerSlug) {
      const url = request.nextUrl.clone();
      url.pathname = `/p/${providerSlug}`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Supabase Authセッションリフレッシュ（全ルートで実行）
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // セッションリフレッシュ（JWTの有効期限を延長）
  await supabase.auth.getUser();

  return supabaseResponse;
}
