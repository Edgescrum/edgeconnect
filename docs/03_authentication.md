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

## Supabase Auth SSR 連携
- Middleware で `supabase.auth.getClaims()` によるセッションリフレッシュ
- `getSession()` はサーバー側で使用禁止（JWT再検証なし）
- Cookie経由でセッション管理

## Todo

### LIFF認証
- [x] LIFF初期化処理を実装（`liff.init()`）→ `src/components/LiffProvider.tsx`
- [x] ログイン状態チェック（`liff.isLoggedIn()`）→ LiffProvider内で自動チェック
- [x] 未ログイン時のリダイレクト処理（`liff.login()`）→ LiffProvider内で自動リダイレクト
- [x] LINEプロフィール取得（`liff.getProfile()`）→ LINE Verify API経由でサーバーサイド取得

### ユーザー管理
- [x] LINEログイン後の `users` テーブルUPSERTロジック → `POST /api/auth/login` + DB Function `upsert_user_from_line`
- [x] `line_user_id` から内部ユーザーを取得するヘルパー関数 → `src/lib/auth/session.ts` `getCurrentUser()`
- [x] ロール判定ロジック（`provider` / `customer`）→ `getCurrentUser()` で role を返却
- [ ] 管理者による事業主アカウント停止機能（`is_active` フラグ更新）

### Proxy認証ガード（旧Middleware）
- [x] 認証必須ページへの未ログインリダイレクト → `src/lib/supabase/proxy.ts`
- [ ] 事業主管理画面への `role` チェック（`provider` 以外はリダイレクト）
