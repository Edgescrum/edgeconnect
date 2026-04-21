# ユーザー設定（名前・電話番号の事前登録）

## 概要
予約のたびに名前・電話番号を入力する手間を省くため、ユーザーが事前に登録・変更できる仕組み。

## 要件

### 保存項目
- 名前（customer_name）
- 電話番号（customer_phone）

### 保存方法
- `users`テーブルに`customer_name`, `customer_phone`カラムを追加
- RLSで本人のみ読み書き可能

### 入力タイミング
1. **設定ページ（`/settings`）** — 任意のタイミングで登録・変更可能
2. **予約時** — 登録済みならフォームにプリセット、未登録 or 変更した場合は保存・更新

### 予約フォームの挙動
- `customer_name`/`customer_phone`が登録済み → フォームに自動入力（編集可能）
- 未登録 → 空欄で表示（従来通り手入力）
- 予約確定時、入力値が登録値と異なれば`users`テーブルを更新

### 設定ページ
- パス: `/settings`
- 内容: 名前・電話番号の入力フォーム
- ダッシュボード（`/home`）からの導線

## データモデル

```sql
ALTER TABLE users ADD COLUMN customer_name text;
ALTER TABLE users ADD COLUMN customer_phone text;

-- RLS: 本人のみ読み書き可能
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (auth.uid()::text = auth_uid);
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid()::text = auth_uid);
```

## 実装チケット

### US-1: DBカラム追加
- [ ] `users`テーブルに`customer_name`, `customer_phone`追加（マイグレーション）
- [ ] RLSポリシー設定（本人のみ）

### US-2: ユーザー設定ページ
- [ ] `/settings/page.tsx` 新規作成
- [ ] 名前・電話番号の入力フォーム
- [ ] 保存Server Action
- [ ] ダッシュボードからの導線追加

### US-3: 予約フォームのプリセット
- [ ] `booking-flow.tsx` で`users`テーブルから名前・電話番号を取得
- [ ] フォームに自動入力（編集可能）
- [ ] 予約確定時に値が変更されていれば`users`テーブルを更新

### US-4: resolveUser拡張
- [ ] `resolveUser()`の返却値に`customerName`, `customerPhone`を追加
- [ ] booking-flowのServer Componentからpropsで渡す
