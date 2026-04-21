# 04. 事業主プロフィール（優先度3）

## 概要
事業主の基本情報を登録・編集し、お客さん向けにランディングページとして公開する。

## 仕様
| 機能 | 詳細 |
|------|------|
| 基本情報 | 氏名・屋号・プロフィール文・アイコン画像 |
| 経歴・専門分野 | テキストで自由入力 |
| 連絡先LINE URL | 個人LINEアカウントのURLを登録（必須） |
| ランディング表示 | LIFFページをホームページ的に表示。LINEログイン前でもURLアクセスで閲覧可能 |
| 専用URL/QRコード | 事業主ごとのURLを自動発行・QRコード生成 |

## 事業主識別
- スラッグ（`slug`）でURLパラメータから事業主を特定
- URL例: `https://liff.line.me/xxxx?provider=yamada-salon`

## Todo

### 事業主登録フロー
- [x] 事業主登録フォーム画面（氏名・屋号・プロフィール文・アイコン）→ `/provider/register`
- [x] アイコン画像アップロード（Supabase Storage `avatars` バケット）
- [x] 個人LINE URL入力（必須バリデーション）
- [x] スラッグユニーク性チェック → `checkSlugAvailability()` Server Action
- [x] `providers` テーブルへのINSERT → DB Function `register_provider()`
- [x] `provider_settings` 初期レコード作成 → DB Function内で同時作成

### プロフィール編集
- [x] プロフィール編集画面 → `/provider/profile`
- [x] 屋号・プロフィール文の更新（Server Action `updateProfile`）
- [x] アイコン画像の変更
- [x] 個人LINE URLの変更

### ランディングページ（公開）
- [x] 事業主プロフィール公開ページ → `/p/[slug]`
- [x] 未ログインでも閲覧可能（Proxyで `/p/` を公開パスに設定）
- [x] 屋号・プロフィール・アイコン・サービスメニュー一覧を表示

### URL / QRコード
- [x] 事業主専用URLの表示画面 → `/provider/qrcode`
- [x] QRコード生成・ダウンロード機能（`qrcode` ライブラリ使用）
