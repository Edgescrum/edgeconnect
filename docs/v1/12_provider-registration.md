# 12. 事業主登録フロー

## 概要
LINEログイン後、事業主として初回登録を完了するまでのオンボーディングフロー。
モバイル（LIFF内）とPC（ブラウザ直接アクセス）で異なるUIを提供する。

## 登録ステップ
```
① LIFFページまたは直接URLにアクセス
② LINEログインで認証・usersテーブルにアカウント作成
③ プロフィール入力（氏名・屋号・プロフィール文・アイコン・カテゴリ）
④ 連絡先登録（LINE URL / メール / 電話番号）
⑤ サービスメニュー登録（最初の1件）
⑥ 営業時間・インターバル設定
⑦ 自分専用URL/QRコードを取得 → お客さんに共有
```

## UI設計

### モバイル版（ステップウィザード）
`src/app/provider/register/register-wizard.tsx`

ステップバーで進捗を表示し、1画面1ステップで進行する:
1. 基本情報（氏名・屋号・bio・アイコン）
2. カテゴリ選択（CategorySelector）
3. 連絡先（LINE URL / メール / 電話番号）
4. 完了（QRコード表示・共有案内）

### PC版（単一ページフォーム）
`src/app/provider/register/register-form.tsx`

全項目を1ページにまとめて表示。セクション区切りで視認性を確保。

### レスポンシブ切り替え
`src/app/provider/register/page.tsx` でデバイス幅に基づいてウィザード/フォームを出し分け。

## 連絡先の種類

事業主は以下の連絡方法をお客さんに公開できる:

| 種類 | フィールド | 必須 |
|------|-----------|------|
| LINE | `providers.line_contact_url` | いずれか1つ |
| メール | `providers.contact_email` | いずれか1つ |
| 電話番号 | `providers.contact_phone` | いずれか1つ |

少なくとも1つの連絡方法が登録されていることをバリデーションで確認する。

## CategorySelector コンポーネント

`src/app/provider/register/` 内で共有UIコンポーネントとして使用。

- カテゴリは `categories` テーブルから動的に取得（`getCategories()`）
- ドロップダウン + チップ表示のマルチセレクトUI
- 使用箇所:
  - 事業主登録ウィザード
  - プロフィール編集ページ (`/provider/profile`)
  - Explore ページのフィルタ

## 実装状況

### オンボーディング画面
- [x] 事業主登録ページ（`/provider/register`）
- [x] モバイル版: ステップウィザード (`register-wizard.tsx`)
- [x] PC版: 単一ページフォーム (`register-form.tsx`)
- [x] プロフィール入力フォーム（氏名・屋号・プロフィール文・アイコン）
- [x] カテゴリ選択（CategorySelector）
- [x] 連絡先登録（LINE / メール / 電話番号）
- [x] 完了画面: 専用URL/QRコードの表示 + 共有案内

### バックエンド処理
- [x] `users.role` を `"provider"` に更新（Server Action）
- [x] `providers` テーブルへINSERT（スラッグ自動生成）
- [x] `provider_settings` 初期レコード作成
- [x] `register_provider` RPC で provider + settings を同時作成
- [ ] `services` テーブルへ最初のメニューINSERT（登録フロー内では省略、オンボーディングチェックリストで誘導）

### データベース
- [x] `providers.contact_phone` カラム追加
- [x] `categories` テーブル作成（マスタデータ）
- [x] `providers.categories` カラム（text[] 型）
