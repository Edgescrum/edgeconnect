# 03. 認証（LINEログイン）

## 概要
LINEログインで事業主・お客さんの両方を認証する。LINEの `userId` を内部IDとして管理し、`role` で事業主/お客さんを区別する。

## 仕様
- 認証方式: LINEログインのみ（メール/パスワードはMVP対象外）
- LIFF内で自動認証（`liff.login()`）
- 初回ログイン時に `users` テーブルへレコード作成
- 事業主登録時に `role` を `"provider"` に設定
- お客さんは初回予約アクセス時に `role: "customer"` で自動作成
- スパム対策: LINEアカウント必須（電話番号認証済み）

---

## 2つのアクセス経路

PeCoには2つの認証パスがあり、それぞれ異なるフローで処理される。

### 経路1: LIFF URL（LINEアプリ内からのアクセス）

```
https://liff.line.me/{liffId}/path
```

1. LINEアプリがURLを開く → ハッシュフラグメント (`#context_token`, `#access_token`) を自動付与
2. `liff.init()` がトークンを処理 → `liff.isLoggedIn()` = true
3. `liff.getAccessToken()` でアクセストークン取得
4. LiffProvider が `POST /api/auth/login { accessToken }` を呼び出し
5. サーバーで LINE Profile API 検証 → Supabase Auth セッション作成 → Cookie 設定
6. ログイン済みで `/` にいる場合 → `/home` にリダイレクト

### 経路2: 直接URL（ブラウザからのアクセス）

```
https://peco-app.vercel.app/
```

1. ユーザーがログインボタンをクリック → `liff.login()` が LINE OAuth を開始
2. LINE が OAuth パラメータ付きでリダイレクト (`?code=&liffClientId=`)
3. **重要**: `liff.init()` は OAuth パラメータがURLに存在すると**ハングする**（LIFF SDK既知バグ）
4. **解決策**: Middleware (proxy.ts) が OAuth コールバックを検知 → `/auth/callback` に 302 リダイレクト
5. `/auth/callback` クライアントページが localStorage から PKCE `code_verifier` を取得
6. `POST /api/auth/callback` でサーバーサイドのコード交換を実行
7. サーバーが LINE token endpoint でアクセストークンを取得 → セッション Cookie 設定
8. 目的ページにリダイレクト

---

## 認証フロー詳細

### Middleware (proxy.ts) の OAuth インターセプト

```typescript
// ?code= と ?liffClientId= の両方が存在する場合 = OAuth コールバック
if (searchParams.has("code") && searchParams.has("liffClientId")) {
  // /auth/callback に 302 リダイレクト
  // auth_code パラメータでコードを渡す（LIFF SDKが認識しないパラメータ名）
  // redirect パラメータで元の遷移先を渡す
}
```

リダイレクト先の決定ロジック:
- `liff.state` パラメータ（LIFF URL経由の場合）
- `login_redirect` Cookie（LoginRequired コンポーネントが設定）
- デフォルト: `/home`
- `/` の場合は `/home` に変換（LPを見せないため）

### /auth/callback クライアントページ

```
1. URL から auth_code, redirect_uri, redirect を取得
2. localStorage から LIFF SDK の code_verifier を取得
   キー: LIFF_STORE:{liffId}:loginTmp → .codeVerifier
3. LIFF関連の localStorage をクリア
4. POST /api/auth/callback { code, redirect_uri, code_verifier }
5. 成功 → window.location.href = dest（フルリロードでCookie反映）
```

### /api/auth/callback (Route Handler)

```
1. code + redirect_uri + code_verifier を受け取る
2. LINE token endpoint にPOSTしてアクセストークンを取得
   - client_id: LIFF_CHANNEL_ID（LIFF_IDの先頭10桁）
   - client_secret: LIFF_CHANNEL_SECRET
   - grant_type: authorization_code
3. アクセストークンで LINE Profile API を呼び出し → userId, displayName, pictureUrl
4. Supabase Auth で signIn（なければ createUser）
5. RPC upsert_user_from_line() で users テーブルに auth_uid を保存
6. httpOnly cookie に line_user_id をセット
7. セッション Cookie を返す
```

### /api/auth/login (Route Handler) — LIFF経由用

```
1. { accessToken } を受け取る
2. LINE Profile API でアクセストークンを検証 → userId, displayName, pictureUrl
3. lineUserId から email/password を派生 (HMAC-SHA256)
4. Supabase Auth で signIn（なければ createUser）
5. RPC upsert_user_from_line() で users テーブルに auth_uid を保存
6. httpOnly cookie に line_user_id をセット
7. { user } を返す
```

---

## Supabase Auth 連携

### パスワード派生

```typescript
const email = `${lineUserId.toLowerCase()}@line.peco.local`;
const password = createHmac("sha256", LINE_CHANNEL_SECRET)
  .update(lineUserId)
  .digest("hex");
```

> **注意**: `LINE_CHANNEL_SECRET` を変更するとすべてのユーザーのパスワードが無効になる

### セッション管理
- **proxy.ts (Middleware)**: 全リクエストで `supabase.auth.getUser()` を呼び、JWT をリフレッシュ
- **httpOnly cookie**: `line_user_id` を 30 日間保持。JavaScript からアクセス不可
- **sessionStorage**: LiffProvider がユーザー情報をキャッシュ（UI表示用、キー: `peco_user`）

---

## 認証関数の使い分け

| 関数 | 場所 | 用途 |
|------|------|------|
| `getCurrentUser()` | session.ts | Supabase Auth セッションから DB ユーザーを取得。RLS が効く |
| `resolveUser()` | session.ts | getCurrentUser を優先し、失敗時に cookie フォールバック |
| `getProviderId()` | provider-session.ts | resolveUser + role チェック + providers テーブル参照 |

### resolveUser の優先順位

```
1. Supabase Auth セッション (getCurrentUser)  ← RLSメインパス
2. httpOnly cookie (line_user_id) → DB検索     ← フォールバック
3. cookie のみでDB未登録 → 自動作成 (customer)
4. すべて失敗 → null
```

---

## LiffProvider の動作

`src/components/LiffProvider.tsx` は以下の順序で認証を試みる:

1. sessionStorage キャッシュ復元（即座にUIに反映）
2. LIFF SDK 初期化
   - **公開ルート** (`/p/*` かつ `/book/` を含まない): LIFF初期化スキップ → パフォーマンス最適化
   - それ以外: `liff.init()` 実行
3. `liff.isLoggedIn()` = true → `/api/auth/login` でサーバーセッション作成
4. `liff.isLoggedIn()` = false かつキャッシュなし → `/api/auth/me` でサーバーセッション確認
   - サーバーセッションあり（OAuth callback経由でログイン済み） → ユーザー情報取得
5. `?action=login` パラメータがある場合 → `liff.login()` を自動実行

### LoginRequired コンポーネント

`src/components/LoginRequired.tsx` は未ログイン時にログインモーダルを表示する。

- ログインボタン押下時に `login_redirect` を Cookie + sessionStorage + localStorage に保存
- Cookie はMiddleware (proxy.ts) で読み取り、OAuth後のリダイレクト先に使う
- sessionStorage/localStorage は LiffProvider で読み取り、LIFF経由ログイン後のリダイレクトに使う

### liff-gate.tsx

`src/app/liff-gate.tsx` は LIFF/ログイン遷移中にLPを非表示にするゲートコンポーネント。
LIFF URLで `/` にアクセスした場合、認証完了→ `/home` リダイレクトまでの間にLPが一瞬見えるのを防ぐ。

---

## 環境変数

| 変数名 | 用途 |
|--------|------|
| `NEXT_PUBLIC_LIFF_ID` | LIFF アプリID |
| `LIFF_CHANNEL_SECRET` | サーバーサイドOAuthコード交換用（LINEログインチャネル 2009680755） |
| `LINE_CHANNEL_SECRET` | Messaging APIチャネルシークレット（チャネル 2009680720）、パスワード派生にも使用 |

> **重要**: `LIFF_CHANNEL_SECRET` と `LINE_CHANNEL_SECRET` は異なるLINEチャネルに紐づく別の値。

---

## キーファイル一覧

| ファイル | 役割 |
|---------|------|
| `src/lib/supabase/proxy.ts` | Middleware: OAuthインターセプト、?path= リダイレクト、セッションリフレッシュ |
| `src/components/LiffProvider.tsx` | クライアントサイド認証オーケストレーション |
| `src/components/LoginRequired.tsx` | ログインモーダル（Cookie経由リダイレクト） |
| `src/app/auth/callback/page.tsx` | OAuthコールバック処理（クライアントページ） |
| `src/app/api/auth/callback/route.ts` | サーバーサイドコード交換 |
| `src/app/api/auth/login/route.ts` | LIFFトークン → セッション変換 |
| `src/app/api/auth/me/route.ts` | 現在のユーザー情報取得 |
| `src/app/api/auth/logout/route.ts` | ログアウト処理 |
| `src/app/liff-gate.tsx` | LIFF/ログイン遷移中のLP非表示ゲート |
| `src/lib/auth/session.ts` | getCurrentUser / resolveUser |
| `src/lib/auth/provider-session.ts` | getProviderId (事業主認証ガード) |

---

## Todo

### 未実装
- [ ] 管理者による事業主アカウント停止機能（`is_active` フラグ更新）
- [ ] 事業主管理画面への `role` チェック（`provider` 以外はリダイレクト）
