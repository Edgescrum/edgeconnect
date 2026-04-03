import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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

  // 全ページでProxy認証チェックをスキップ
  // 認証はresolveUser()（cookie + lineUserId）で各ページ/Server Actionが個別に行う
  return NextResponse.next({ request });
}
