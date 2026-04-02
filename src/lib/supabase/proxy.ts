import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // セッションリフレッシュ: この直後に他のコードを挟まないこと
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

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

  // 認証不要パス: API、公開プロフィール、静的ファイル
  const isPublicPath =
    pathname.startsWith("/api/") ||
    pathname.startsWith("/p/") ||
    pathname === "/";

  // 未認証ユーザーを認証不要パス以外からリダイレクト
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
