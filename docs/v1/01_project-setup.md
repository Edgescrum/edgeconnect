# 01. プロジェクト初期セットアップ

## 概要
Next.js + Supabase + LINE連携の開発環境を構築し、基盤となる設定を整える。

## Todo

### 依存パッケージ
- [x] `@supabase/supabase-js` `@supabase/ssr` をインストール
- [x] LIFF SDK (`@line/liff`) をインストール
- [x] LINE Messaging API SDK (`@line/bot-sdk`) をインストール

### 環境変数
- [x] `.env.local` を作成し以下を設定
  - `NEXT_PUBLIC_LIFF_ID`
  - `LINE_CHANNEL_ACCESS_TOKEN`
  - `LINE_CHANNEL_SECRET`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - ~~`SUPABASE_SERVICE_ROLE_KEY`~~ → Database Functionsで代替（不要）
- [x] `.env.example` を作成（値は空欄で）

### Supabaseクライアント
- [x] `src/lib/supabase/client.ts` を作成（`createBrowserClient`）
- [x] `src/lib/supabase/server.ts` を作成（`createServerClient` + `cookies()`）
- [x] `src/lib/supabase/proxy.ts` を作成（Proxy用セッション更新ロジック）

### Proxy（旧Middleware）
- [x] `src/proxy.ts` を作成し `updateSession` を呼び出す（Next.js 16で`middleware.ts`→`proxy.ts`に変更）
- [x] matcher設定（`_next/static`, `_next/image`, `favicon.ico`, 静的アセットを除外）

### LINE Developers
- [x] LINE Developersアカウント作成
- [x] LINEログインチャネル作成
- [x] Messaging APIチャネル作成
- [x] LIFFアプリ登録（エンドポイントURL設定）

### 開発環境
- [x] ngrokセットアップ（LIFF実機テスト用HTTPS）
- [x] LIFFモックモード設定（localhost:3000でUI確認用）→ ngrok経由で外部ブラウザモードを使用
