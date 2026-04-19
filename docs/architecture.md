# EdgeConnect アーキテクチャ・設計ドキュメント

## 1. システム概要

EdgeConnect は、個人事業主が LINE 公式アカウントを起点に予約受付・スケジュール管理を自動化できるプラットフォーム。

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 16 (App Router, React 19) |
| バックエンド | Next.js API Routes + Server Actions |
| データベース | Supabase (PostgreSQL) |
| 認証 | LINE LIFF → Supabase Auth ブリッジ |
| 通知 | LINE Messaging API (Flex Message) |
| ホスティング | Vercel |
| スタイリング | Tailwind CSS v4 |

---

## 2. ディレクトリ構成

```
src/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── auth/login/route.ts   # LINE→Supabase Auth ログインAPI
│   │   ├── auth/me/route.ts      # 現在のユーザー情報取得
│   │   ├── webhook/route.ts      # LINE Messaging API Webhook
│   │   ├── qrcode/route.ts       # QRコード画像生成API
│   │   ├── calendar/             # iCalフィード・イベント
│   │   └── cron/reminder/        # リマインダー通知CRON
│   ├── p/[slug]/                 # 公開プロフィール・予約フロー
│   ├── bookings/                 # 顧客予約一覧・詳細
│   ├── provider/                 # 事業主管理画面
│   ├── layout.tsx                # ルートレイアウト
│   ├── page.tsx                  # TOP画面 (Client Component)
│   └── globals.css               # Tailwind設定・CSS変数
├── components/
│   ├── LiffProvider.tsx          # LIFF SDK初期化・認証コンテキスト
│   └── NavigationLoader.tsx      # ページ遷移プログレスバー
└── lib/
    ├── auth/
    │   ├── session.ts            # getCurrentUser / resolveUser
    │   └── provider-session.ts   # getProviderId (事業主認証ガード)
    ├── supabase/
    │   ├── server.ts             # Server用クライアント (RLS適用)
    │   ├── client.ts             # Browser用クライアント (シングルトン)
    │   ├── admin.ts              # Admin用クライアント (RLSバイパス)
    │   └── proxy.ts              # Middleware: セッションリフレッシュ
    ├── actions/                   # Server Actions
    │   ├── booking.ts            # 予約CRUD
    │   ├── provider.ts           # 事業主登録・更新
    │   ├── service.ts            # サービスメニューCRUD
    │   └── schedule.ts           # スケジュール管理
    ├── line/
    │   ├── messaging.ts          # pushFlexMessage (低レベルAPI)
    │   ├── notify.ts             # 通知ハンドラ (確定・キャンセル・リマインダー)
    │   └── templates.ts          # Flex Messageテンプレート (5種類)
    ├── calendar/
    │   └── ics.ts                # iCal生成ユーティリティ
    └── log.ts                    # 構造化ログ
```

---

## 3. 認証フロー

### 3-1. 全体の流れ

```
LIFFアプリ起動
  → liff.init() + liff.getAccessToken()
  → POST /api/auth/login { accessToken }
  → LINE Profile API でユーザー情報取得
  → lineUserId から email/password を派生 (HMAC-SHA256)
  → Supabase Auth で signIn（なければ createUser）
  → RPC upsert_user_from_line() で users テーブルに auth_uid を保存
  → httpOnly cookie に line_user_id をセット
  → クライアントに user 情報を返す
```

### 3-2. 認証関数の使い分け

| 関数 | 場所 | 用途 |
|------|------|------|
| `getCurrentUser()` | session.ts | Supabase Auth セッションから DB ユーザーを取得。RLS が効く |
| `resolveUser()` | session.ts | getCurrentUser を優先し、失敗時に cookie フォールバック |
| `getProviderId()` | provider-session.ts | resolveUser + role チェック + providers テーブル参照 |

### 3-3. resolveUser の優先順位

```
1. Supabase Auth セッション (getCurrentUser)  ← RLSメインパス
2. httpOnly cookie (line_user_id) → DB検索     ← フォールバック
3. cookie のみでDB未登録 → 自動作成 (customer)
4. すべて失敗 → null
```

### 3-4. セッション管理

- **proxy.ts (Middleware)**: 全リクエストで `supabase.auth.getUser()` を呼び、JWT をリフレッシュ
- **httpOnly cookie**: `line_user_id` を 30 日間保持。JavaScript からアクセス不可
- **sessionStorage**: LiffProvider がユーザー情報をキャッシュ（UI表示用）

### 3-5. パスワード派生

```typescript
const email = `${lineUserId.toLowerCase()}@line.edgeconnect.local`;
const password = createHmac("sha256", LINE_CHANNEL_SECRET)
  .update(lineUserId)
  .digest("hex");
```

> **注意**: `LINE_CHANNEL_SECRET` を変更するとすべてのユーザーのパスワードが無効になる

---

## 4. データベース設計

### 4-1. テーブル一覧

| テーブル | 概要 | RLS |
|---------|------|-----|
| `users` | 全ユーザー (事業主 + 顧客) | 有効 |
| `providers` | 事業主プロフィール | 有効 |
| `provider_settings` | 営業時間・インターバル | 有効 |
| `services` | サービスメニュー | 有効 |
| `bookings` | 予約 (UUID主キー) | 有効 |
| `blocked_slots` | 手動ブロック枠 | 有効 |
| `pending_bookings` | 予約処理中の排他制御用 | 有効 (ポリシーなし=全拒否) |

### 4-2. RLS ポリシー設計

**基本方針**: すべてのテーブルで RLS 有効。`auth.uid()` と `users.auth_uid` の一致で認可。

| テーブル | SELECT | INSERT | UPDATE | DELETE |
|---------|--------|--------|--------|--------|
| `users` | 自分のみ | RPC経由 | 自分のみ | - |
| `providers` | **公開** (全員) | RPC経由 | 自分のみ | - |
| `provider_settings` | 認証済みユーザー | RPC経由 | 自分のみ | - |
| `services` | 公開(is_published) + 自分 | 自分のprovider | 自分のprovider | 自分のprovider |
| `bookings` | 顧客(自分) + 事業主(自分) | RPC経由 | RPC経由 | - |
| `blocked_slots` | 自分のprovider | 自分のprovider | 自分のprovider | 自分のprovider |

### 4-3. SECURITY DEFINER 関数

| 関数名 | 用途 | 排他制御 |
|--------|------|---------|
| `upsert_user_from_line` | ユーザー作成/更新 | - |
| `register_provider` | 事業主登録 (provider + settings 同時作成) | - |
| `get_provider_profile` | 公開プロフィール取得 | - |
| `get_available_slots` | 空き枠計算 | - |
| `create_booking` | 予約作成 | **あり** (アドバイザリーロック) |
| `cancel_booking` | 予約キャンセル | - |

### 4-4. Supabase クライアントの使い分け

| クライアント | キー | RLS | 用途 |
|-------------|------|-----|------|
| `createClient()` (server.ts) | ANON_KEY | **適用** | Server Component / Server Action / Route Handler |
| `createAdminClient()` (admin.ts) | SERVICE_ROLE_KEY | **バイパス** | Storage操作、Webhook、CRON、通知送信 |
| `createClient()` (client.ts) | ANON_KEY | 適用 | Client Component (未使用) |

> **重要**: Phase 4 で 16 ファイルを `createAdminClient` → `createClient` に切り替え済み。adminClient は Storage 操作・Webhook・CRON・通知のみに限定。

---

## 5. LINE 連携

### 5-1. LIFF (LINE Front-end Framework)

- **初期化**: `LiffProvider.tsx` で `liff.init()` → `liff.isLoggedIn()` → `liff.getAccessToken()`
- **URL形式**: `https://liff.line.me/{LIFF_ID}?provider={slug}`
- **ディープリンク**: proxy.ts が `?path=` と `?provider=` を処理してリダイレクト

### 5-2. Messaging API

- **Flex Message**: 5種類のテンプレート (templates.ts)
  - 予約確定 (顧客向け / 事業主向け)
  - キャンセル通知 (顧客向け / 事業主向け)
  - リマインダー (顧客向け)
- **Webhook**: 署名検証 (HMAC-SHA256) → follow イベントでユーザー自動作成

### 5-3. 通知フロー

```
予約作成 → create_booking RPC → 成功
  → notifyBookingConfirmed(bookingId) [非同期]
    → 予約詳細をDB取得
    → Flex Message テンプレート生成
    → pushFlexMessage() で顧客 + 事業主に送信
```

---

## 6. パフォーマンス最適化

| 手法 | 実装箇所 |
|------|---------|
| React `cache()` | getCurrentUser, resolveUser, getProviderId (リクエスト内重複排除) |
| sessionStorage キャッシュ | LiffProvider (ユーザー情報) |
| `revalidatePath` | 全 Server Action (変更後のキャッシュ無効化) |
| NavigationLoader | クリック検知 → プログレスバー表示 |
| Next.js Link prefetch | 内部リンクの自動プリフェッチ |
| 無限スクロール | 予約一覧 (20件ずつ IntersectionObserver で読込) |
| 複合インデックス | `bookings(provider_id, start_at, status)` |

---

## 7. 注意すべき点・既知の問題

### 7-1. bfcache / Hydration

- LINE アプリ内ブラウザのバックボタンで bfcache が復元される
- React の hydration が壊れる場合がある
- **対策**: 重要な操作はServer Componentで処理、Client Componentは最小化

### 7-2. LINE アプリ内ブラウザの制限

- `navigator.share` 非対応
- `<a download>` 非対応
- `window.open` ポップアップブロック
- **対策**: QRコードは `<img src="/api/qrcode">` で表示し長押し保存

### 7-3. タイムゾーン

- DB は `timestamptz` (UTC) で保存
- `addBlockedSlot()` はタイムゾーン未指定時に `+09:00` を付与
- `get_available_slots` は `AT TIME ZONE 'Asia/Tokyo'` で計算

### 7-4. Cookie とセッションの同期

- Middleware で `supabase.auth.getUser()` を呼ばないと JWT が更新されない
- Middleware のレスポンスから `Set-Cookie` を正しく返す必要がある
- 新しい `NextResponse.next()` を作る場合は cookie を必ずコピー

### 7-5. RLS とクライアント切り替え

- `createClient()` (anon) を使う場合、Supabase Auth セッションが必須
- セッションがない場合（cookie フォールバック）は RLS でクエリがブロックされる
- **対処**: resolveUser が auth を優先し、セッションがない場合はリダイレクト

### 7-6. メール正規化

- LINE userId は大文字 `U` で始まるが、Supabase Auth はメールを小文字に正規化する
- `lineUserId.toLowerCase()` でメール生成時に統一が必要

---

## 8. 環境変数

| 変数名 | 公開 | 用途 |
|--------|------|------|
| `NEXT_PUBLIC_LIFF_ID` | クライアント | LIFF アプリID |
| `NEXT_PUBLIC_SUPABASE_URL` | クライアント | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | クライアント | Supabase 匿名キー |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバーのみ | Supabase サービスロールキー |
| `LINE_CHANNEL_ACCESS_TOKEN` | サーバーのみ | LINE Messaging API トークン |
| `LINE_CHANNEL_SECRET` | サーバーのみ | LINE チャネルシークレット (署名検証・パスワード派生) |

---

## 9. デプロイ

### Vercel

- `main` ブランチへの push で自動デプロイ
- 環境変数は Vercel Settings → Environment Variables で設定
- `next.config.ts` の matcher でMiddleware対象パスを制御

### LINE Developers

- LIFF Endpoint URL → Vercel のドメイン
- Webhook URL → `https://{domain}/api/webhook`
- コールバックURL → `https://{domain}/api/auth/callback`

### Supabase

- RLS ポリシーは SQL で直接管理（マイグレーションファイルなし）
- SECURITY DEFINER 関数も SQL で管理
- Storage バケット `avatars` をアイコン画像に使用

---

## 10. オンボーディング

事業主登録完了後、ダッシュボードにチェックリストを表示:

1. サービスメニューを追加 → `/provider/services/new`
2. 営業時間を設定 → `/provider/schedule`
3. プロフィールを仕上げる → `/provider/profile`
4. (全完了後) QRコードをお客さまに共有 → `/provider/qrcode`

判定ロジック: services テーブルのレコード数、provider_settings の business_hours、provider の icon_url を確認。
