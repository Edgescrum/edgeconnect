# ユーザー設定 実装チケット

## US-1: DBカラム追加
**優先度: 最優先 | 工数: 小**

### タスク
- [ ] `users`テーブルに`customer_name`(text), `customer_phone`(text)追加
- [ ] RLSポリシー追加（本人のみ読み書き）

### マイグレーションSQL
```sql
ALTER TABLE users ADD COLUMN customer_name text;
ALTER TABLE users ADD COLUMN customer_phone text;
```

### 完了条件
- カラムが追加されている
- RLSで本人以外アクセス不可

---

## US-2: resolveUser拡張
**優先度: 最優先 | 工数: 小**

### タスク
- [ ] `CurrentUser`型に`customerName`, `customerPhone`を追加
- [ ] `resolveUser()`のSELECTに`customer_name`, `customer_phone`を含める
- [ ] 返却値にマッピング

### 対象ファイル
- `src/lib/auth/session.ts`

### 完了条件
- `resolveUser()`が`customerName`, `customerPhone`を返す

---

## US-3: 予約フォームのプリセット
**優先度: 高 | 工数: 中**

### タスク
- [ ] `/p/[slug]/book/[serviceId]/page.tsx` で`resolveUser()`から名前・電話番号を取得
- [ ] `BookingFlow`コンポーネントにpropsで渡す（`defaultName`, `defaultPhone`）
- [ ] `booking-flow.tsx`の`customerName`, `customerPhone`のstateのデフォルト値をpropsから設定
- [ ] 予約確定時、入力値が元と異なれば`users`テーブルを更新するServer Action追加

### 対象ファイル
- `src/app/p/[slug]/book/[serviceId]/page.tsx`
- `src/app/p/[slug]/book/[serviceId]/booking-flow.tsx`
- `src/lib/actions/booking.ts`（updateUserInfo追加）

### 完了条件
- 登録済みユーザーは名前・電話番号が自動入力される
- 未登録ユーザーは空欄のまま
- 入力値を変更して予約すると、usersテーブルが更新される

---

## US-4: ユーザー設定ページ
**優先度: 高 | 工数: 中**

### タスク
- [ ] `/settings/page.tsx` 新規作成（Server Component）
- [ ] `resolveUser()`で現在の名前・電話番号を取得
- [ ] 未ログイン時は`/`にリダイレクト
- [ ] 設定フォームコンポーネント作成（Client Component）
  - 名前入力
  - 電話番号入力
  - 保存ボタン
  - 保存成功フィードバック
- [ ] `updateUserSettings(name, phone)` Server Action作成
- [ ] ヘッダーorフッターに「設定」リンク追加（ログイン時のみ）

### 対象ファイル
- `src/app/settings/page.tsx`（新規）
- `src/lib/actions/user.ts`（新規）
- ダッシュボード or ヘッダーからの導線

### 完了条件
- `/settings`で名前・電話番号を登録・変更できる
- 保存後に成功メッセージが表示される
- ダッシュボードから遷移できる

---

## 実装順序

```
US-1（DB） → US-2（resolveUser） → US-3（予約プリセット） → US-4（設定ページ）
```

US-3まで実装すれば予約時の自動入力は動作する。US-4は後から追加しても問題ない。
