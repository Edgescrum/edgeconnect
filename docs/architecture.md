# PeCo アーキテクチャ・設計ドキュメント

## 1. システム概要

PeCo は、個人事業主が LINE 公式アカウントを起点に予約受付・スケジュール管理を自動化できるプラットフォーム。

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 16 (App Router, React 19) |
| バックエンド | Next.js API Routes + Server Actions |
| データベース | Supabase (PostgreSQL) |
| 認証 | LINE LIFF → Supabase Auth ブリッジ |
| 通知 | LINE Messaging API (Flex Message) |
| ホスティング | Vercel (リージョン: hnd1 東京) |
| スタイリング | Tailwind CSS v4 |

---

## 2. ブランディング

### サービス名
**PeCo**（ペコ）— 旧名: EdgeConnect

### ブランドカラー
`src/lib/brand.ts` が単一の真実の源泉（Single Source of Truth）。

| カラー | 値 | 用途 |
|--------|-----|------|
| Primary | `#f08c79` (サーモンピンク) | メインアクセント |
| Primary Light | `#f5a899` | ホバー状態 |
| Primary Bg | `#fef2f0` | 薄い背景 |
| Primary Dark | `#d97365` | 押下状態 |
| Secondary | `#be7c7b` (モーヴ) | セカンダリ要素 |
| Background | `#faf8f6` (ウォームベージュ) | ページ背景 |
| Foreground | `#3d2c2c` | テキスト |
| Success | `#06C755` | LINE緑 |

### フォント
`DM Sans` + `Noto Sans JP` (Google Fonts via next/font)

### アセット
- ロゴ: `/public/logo.svg`
- ファビコン: `/public/favicon.svg`
- OGP画像: `/public/og-default.png`
- ドメイン: `peco-app.vercel.app`

### CSS変数
`src/app/globals.css` で `brand.ts` の値をCSS変数として定義:
```css
--background, --foreground, --accent, --accent-light, --accent-bg, --accent-dark, --success, --card, --border, --muted
```

全コンポーネントはハードコードされた色ではなく `brand.primary` インポートまたはCSS変数を使用する。

---

## 3. ディレクトリ構成

```
src/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── auth/login/route.ts   # LINE→Supabase Auth ログインAPI
│   │   ├── auth/callback/route.ts # OAuthコード交換
│   │   ├── auth/me/route.ts      # 現在のユーザー情報取得
│   │   ├── auth/logout/route.ts  # ログアウト
│   │   ├── webhook/route.ts      # LINE Messaging API Webhook
│   │   ├── qrcode/route.ts       # QRコード画像生成API
│   │   ├── calendar/             # iCalフィード・イベント
│   │   └── cron/reminder/        # リマインダー通知CRON
│   ├── auth/callback/page.tsx    # OAuth callback クライアントページ
│   ├── p/[slug]/                 # 公開プロフィール・予約フロー
│   ├── home/                     # ログイン後のホーム
│   ├── explore/                  # 事業主ディレクトリ
│   ├── about/                    # LP（固定URL）
│   ├── bookings/                 # 顧客予約一覧・詳細
│   ├── provider/                 # 事業主管理画面
│   ├── layout.tsx                # ルートレイアウト
│   ├── page.tsx                  # TOP画面（未ログイン: LP / ログイン済み: /home へ）
│   ├── liff-gate.tsx             # LIFF遷移中のLP非表示ゲート
│   ├── dashboard-client.tsx      # ログイン済みダッシュボード
│   └── globals.css               # Tailwind設定・CSS変数
├── components/
│   ├── LiffProvider.tsx          # LIFF SDK初期化・認証コンテキスト
│   ├── LoginRequired.tsx         # ログインモーダル（Cookie経由リダイレクト）
│   ├── NavigationLoader.tsx      # ページ遷移プログレスバー（capture phase click）
│   ├── LandingPage.tsx           # LP共通コンポーネント
│   ├── PublicFooter.tsx          # 公開ページ共通フッター
│   ├── FullScreenLoading.tsx     # 全画面ローディング
│   └── LineFriendBanner.tsx      # LINE友だち追加バナー
└── lib/
    ├── brand.ts                   # ブランド定義（カラー・フォント）
    ├── auth/
    │   ├── session.ts            # getCurrentUser / resolveUser
    │   └── provider-session.ts   # getProviderId (事業主認証ガード)
    ├── supabase/
    │   ├── server.ts             # Server用クライアント (RLS適用)
    │   ├── client.ts             # Browser用クライアント (シングルトン)
    │   ├── admin.ts              # Admin用クライアント (RLSバイパス)
    │   └── proxy.ts              # Middleware: OAuthインターセプト・セッションリフレッシュ
    ├── actions/                   # Server Actions
    │   ├── booking.ts            # 予約CRUD
    │   ├── provider.ts           # 事業主登録・更新
    │   ├── service.ts            # サービスメニューCRUD
    │   ├── schedule.ts           # スケジュール管理
    │   └── explore.ts            # Explore ページデータ取得
    ├── constants/
    │   └── categories.ts         # カテゴリ定義（Supabase DBから取得）
    ├── line/
    │   ├── messaging.ts          # pushFlexMessage (低レベルAPI)
    │   ├── notify.ts             # 通知ハンドラ (確定・キャンセル・リマインダー)
    │   └── templates.ts          # Flex Messageテンプレート (5種類)
    ├── calendar/
    │   └── ics.ts                # iCal生成ユーティリティ
    └── log.ts                    # 構造化ログ
```

---

## 4. 認証フロー

詳細は `docs/03_authentication.md` を参照。

### 概要
2つのアクセス経路:
1. **LIFF URL** (liff.line.me/{liffId}/path) — LINEアプリから。自動認証。
2. **直接URL** (peco-app.vercel.app) — ブラウザから。OAuth + Middleware interception。

### 認証関数の使い分け

| 関数 | 場所 | 用途 |
|------|------|------|
| `getCurrentUser()` | session.ts | Supabase Auth セッションから DB ユーザーを取得。RLS が効く |
| `resolveUser()` | session.ts | getCurrentUser を優先し、失敗時に cookie フォールバック |
| `getProviderId()` | provider-session.ts | resolveUser + role チェック + providers テーブル参照 |

### パスワード派生

```typescript
const email = `${lineUserId.toLowerCase()}@line.peco.local`;
const password = createHmac("sha256", LINE_CHANNEL_SECRET)
  .update(lineUserId)
  .digest("hex");
```

---

## 5. データベース設計

### 5-1. テーブル一覧

| テーブル | 概要 | RLS |
|---------|------|-----|
| `users` | 全ユーザー (事業主 + 顧客) | 有効 |
| `providers` | 事業主プロフィール | 有効 |
| `provider_settings` | 営業時間・インターバル | 有効 |
| `services` | サービスメニュー | 有効 |
| `bookings` | 予約 (UUID主キー) | 有効 |
| `blocked_slots` | 手動ブロック枠 | 有効 |
| `pending_bookings` | 予約処理中の排他制御用 | 有効 (ポリシーなし=全拒否) |
| `categories` | カテゴリマスタ（DBで管理） | 有効 |

### 5-2. RLS ポリシー設計

**基本方針**: すべてのテーブルで RLS 有効。`auth.uid()` と `users.auth_uid` の一致で認可。

| テーブル | SELECT | INSERT | UPDATE | DELETE |
|---------|--------|--------|--------|--------|
| `users` | 自分のみ | RPC経由 | 自分のみ | - |
| `providers` | **公開** (全員) | RPC経由 | 自分のみ | - |
| `provider_settings` | 認証済みユーザー | RPC経由 | 自分のみ | - |
| `services` | 公開(is_published) + 自分 | 自分のprovider | 自分のprovider | 自分のprovider |
| `bookings` | 顧客(自分) + 事業主(自分) | RPC経由 | RPC経由 | - |
| `blocked_slots` | 自分のprovider | 自分のprovider | 自分のprovider | 自分のprovider |
| `categories` | **公開** (全員) | - | - | - |

### 5-3. SECURITY DEFINER 関数

| 関数名 | 用途 | 排他制御 |
|--------|------|---------|
| `upsert_user_from_line` | ユーザー作成/更新 | - |
| `register_provider` | 事業主登録 (provider + settings 同時作成) | - |
| `get_provider_profile` | 公開プロフィール取得 | - |
| `get_available_slots` | 空き枠計算 | - |
| `create_booking` | 予約作成 | **あり** (アドバイザリーロック) |
| `cancel_booking` | 予約キャンセル | - |
| `search_providers` | 事業主検索（Explore用） | - |

### 5-4. Supabase クライアントの使い分け

| クライアント | キー | RLS | 用途 |
|-------------|------|-----|------|
| `createClient()` (server.ts) | ANON_KEY | **適用** | Server Component / Server Action / Route Handler |
| `createAdminClient()` (admin.ts) | SERVICE_ROLE_KEY | **バイパス** | Storage操作、Webhook、CRON、通知送信 |
| `createClient()` (client.ts) | ANON_KEY | 適用 | Client Component (未使用) |

> **重要**: adminClient は Storage 操作・Webhook・CRON・通知のみに限定。

---

## 6. LINE 連携

### 6-1. LIFF (LINE Front-end Framework)

- **初期化**: `LiffProvider.tsx` で `liff.init()` → `liff.isLoggedIn()` → `liff.getAccessToken()`
- **公開ルートスキップ**: `/p/*` (予約ページ除く) では LIFF SDK を初期化しない（パフォーマンス最適化）
- **URL形式**: `https://liff.line.me/{LIFF_ID}/path`（パス形式）
- **レガシー対応**: proxy.ts が `?path=` と `?provider=` パラメータも引き続きリダイレクト処理

### 6-2. Messaging API

- **Flex Message**: 5種類のテンプレート (templates.ts)
  - 予約確定 (顧客向け / 事業主向け)
  - キャンセル通知 (顧客向け / 事業主向け)
  - リマインダー (顧客向け)
- **Webhook**: 署名検証 (HMAC-SHA256) → follow イベントでユーザー自動作成
- **LIFF URL形式**: Flex Message内のリンクはパス形式 `https://liff.line.me/{liffId}/bookings/{id}`

### 6-3. 通知フロー

```
予約作成 → create_booking RPC → 成功
  → notifyBookingConfirmed(bookingId) [await]
    → 予約詳細をDB取得
    → Flex Message テンプレート生成
    → pushFlexMessage() で顧客 + 事業主に送信
```

> **重要**: 通知は `await` で待つ（fire-and-forget ではない）。Vercel Serverless Functions はレスポンス返却後にプロセスを終了するため。

---

## 7. パフォーマンス最適化

| 手法 | 実装箇所 | 詳細 |
|------|---------|------|
| Vercel hnd1 リージョン | vercel.json | 東京リージョン。Supabase ap-south-1 と近接 |
| LIFF SDK スキップ | LiffProvider.tsx | 公開ルート (/p/*) で ~150KB の SDK 読み込みを回避 |
| React `cache()` | session.ts, provider RPC | リクエスト内の重複DB呼び出しを排除 |
| sessionStorage キャッシュ | LiffProvider | ユーザー情報の即時復元（初期化待ちなし） |
| DB クエリ並列化 | 各ページ | `Promise.all` で独立クエリを並行実行 |
| `revalidatePath` | 全 Server Action | 変更後のキャッシュ無効化 |
| NavigationLoader | capture phase click | クリックイベントをキャプチャフェーズで検知 → プログレスバー表示 |
| Next.js Link prefetch | 内部リンク | 自動プリフェッチ（サービス編集リンクは prefetch=false） |
| 無限スクロール | 予約一覧、Explore | 20件ずつ IntersectionObserver で読込 |
| 複合インデックス | bookings テーブル | `bookings(provider_id, start_at, status)` |
| next/image | 全画像 | 自動最適化・WebP変換 |
| 通知 await | booking actions | Vercel serverless での確実な送信完了 |

---

## 8. カテゴリ管理

- カテゴリは Supabase `categories` テーブルで管理（ハードコードではない）
- `src/lib/constants/categories.ts` の `getCategories()` で DB から取得
- `CategorySelector` 共有コンポーネント: ドロップダウン + チップ + マルチセレクトUI
- 使用箇所: 事業主登録、プロフィール編集、Explore ページ
- `search_providers` RPC は `text[]` 型で複数カテゴリフィルタを受け付ける

---

## 9. レイアウト

- 全ページ: `max-w-5xl` でコンテンツ中央寄せ
- 事業主管理画面: `provider/layout.tsx` で中央寄せ + サイドバー
- PublicFooter: コンパクト1行レイアウト（ロゴ | リンク / コピーライト）
- NavigationLoader: capture phase クリックリスナー（Next.js Link と共存）

---

## 10. 注意すべき点・既知の問題

### 10-1. LIFF SDK OAuth バグ

- `liff.init()` は URL に `?code=&liffClientId=` が存在すると**ハングする**
- **対策**: Middleware で OAuth パラメータを検知し `/auth/callback` にリダイレクト

### 10-2. bfcache / Hydration

- LINE アプリ内ブラウザのバックボタンで bfcache が復元される
- React の hydration が壊れる場合がある
- **対策**: 重要な操作はServer Componentで処理、Client Componentは最小化

### 10-3. LINE アプリ内ブラウザの制限

- `navigator.share` 非対応
- `<a download>` 非対応
- `window.open` ポップアップブロック
- **対策**: QRコードは `<img src="/api/qrcode">` で表示し長押し保存

### 10-4. タイムゾーン

- DB は `timestamptz` (UTC) で保存
- `addBlockedSlot()` はタイムゾーン未指定時に `+09:00` を付与
- `get_available_slots` は `AT TIME ZONE 'Asia/Tokyo'` で計算

### 10-5. Cookie とセッションの同期

- Middleware で `supabase.auth.getUser()` を呼ばないと JWT が更新されない
- Middleware のレスポンスから `Set-Cookie` を正しく返す必要がある
- 新しい `NextResponse.next()` を作る場合は cookie を必ずコピー

### 10-6. RLS とクライアント切り替え

- `createClient()` (anon) を使う場合、Supabase Auth セッションが必須
- セッションがない場合（cookie フォールバック）は RLS でクエリがブロックされる
- **対処**: resolveUser が auth を優先し、セッションがない場合はリダイレクト

### 10-7. メール正規化

- LINE userId は大文字 `U` で始まるが、Supabase Auth はメールを小文字に正規化する
- `lineUserId.toLowerCase()` でメール生成時に統一が必要

---

## 11. 環境変数

| 変数名 | 公開 | 用途 |
|--------|------|------|
| `NEXT_PUBLIC_LIFF_ID` | クライアント | LIFF アプリID |
| `NEXT_PUBLIC_SUPABASE_URL` | クライアント | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | クライアント | Supabase 匿名キー |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバーのみ | Supabase サービスロールキー |
| `LINE_CHANNEL_ACCESS_TOKEN` | サーバーのみ | LINE Messaging API トークン |
| `LINE_CHANNEL_SECRET` | サーバーのみ | Messaging APIチャネルシークレット (署名検証・パスワード派生) |
| `LIFF_CHANNEL_SECRET` | サーバーのみ | LINEログインチャネルシークレット (OAuthコード交換) |

---

## 12. デプロイ

### Vercel

- `main` ブランチへの push で自動デプロイ
- リージョン: `hnd1` (東京)
- 環境変数は Vercel Settings → Environment Variables で設定
- `next.config.ts` の matcher でMiddleware対象パスを制御

### LINE Developers

- LIFF Endpoint URL → `https://peco-app.vercel.app`
- Webhook URL → `https://peco-app.vercel.app/api/webhook`
- LINEログインチャネル (2009680755): OAuthコールバック用
- Messaging APIチャネル (2009680720): 通知送信・Webhook受信用

### Supabase

- RLS ポリシーは SQL で直接管理（マイグレーションファイルなし）
- SECURITY DEFINER 関数も SQL で管理
- Storage バケット `avatars` をアイコン画像に使用

---

## 13. オンボーディング

事業主登録完了後、ダッシュボードにチェックリストを表示:

1. サービスメニューを追加 → `/provider/services/new`
2. 営業時間を設定 → `/provider/schedule`
3. プロフィールを仕上げる → `/provider/profile`
4. (全完了後) QRコードをお客さまに共有 → `/provider/qrcode`

判定ロジック: services テーブルのレコード数、provider_settings の business_hours、provider の icon_url を確認。
