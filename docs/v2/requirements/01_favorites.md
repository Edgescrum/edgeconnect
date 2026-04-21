# お気に入り機能

## 概要
ユーザーが事業主をお気に入り登録し、専用ページで管理できる機能。

## 要件

### 基本仕様
| 項目 | 内容 |
|------|------|
| 対象 | ユーザー → 事業主（事業主単位） |
| 上限 | 最大50件/ユーザー |
| 料金 | 全ユーザー無料 |
| 表示条件 | ログインユーザーのみハートアイコン表示 |

### 登録UI
- 事業主プロフィールページ（`/p/[slug]`）にハートアイコン
- 予約完了後に「お気に入りに追加しますか？」と表示

### 解除
- お気に入り一覧ページからワンタップで解除
- 事業主プロフィールページのハートアイコン再タップで解除

### 一覧ページ
- パス: `/favorites`
- カード内容: アイコン・事業主名・カテゴリ・bio抜粋・最終予約日
- タップで事業主ページ（`/p/[slug]`）へ遷移
- 並び順: お気に入り登録が新しい順
- フィルタ: カテゴリフィルタあり（CategorySelector使用）

### ダッシュボード導線
- `/home` ヒーローバナーの「予約一覧」を「お気に入り」に変更

## データモデル

```sql
CREATE TABLE favorites (
  id serial PRIMARY KEY,
  user_id int NOT NULL REFERENCES users(id),
  provider_id int NOT NULL REFERENCES providers(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
```

## 実装チケット

### FV-1: DBテーブル作成
- [ ] `favorites` テーブル作成（マイグレーション）
- [ ] RLSポリシー設定（自分のお気に入りのみ読み書き可能）

### FV-2: お気に入り登録/解除 Server Action
- [ ] `toggleFavorite(providerId)` — 登録/解除のトグル
- [ ] `getFavorites(userId)` — お気に入り一覧取得
- [ ] `isFavorited(userId, providerId)` — お気に入り済み判定
- [ ] 50件上限チェック

### FV-3: 事業主プロフィールページにハートアイコン
- [ ] `/p/[slug]/page.tsx` にハートアイコン追加（ログインユーザーのみ）
- [ ] お気に入り済みの場合は塗りつぶしハート
- [ ] タップでトグル（楽観的UI更新）

### FV-4: 予約完了画面にお気に入り追加提案
- [ ] `booking-flow.tsx` の完了ステップに「お気に入りに追加」ボタン
- [ ] 既にお気に入り済みの場合は非表示

### FV-5: お気に入り一覧ページ
- [ ] `/favorites/page.tsx` 新規作成
- [ ] カードコンポーネント（アイコン・名前・カテゴリ・bio・最終予約日）
- [ ] カテゴリフィルタ（CategorySelector）
- [ ] 解除ボタン（スワイプ or アイコン）
- [ ] 空状態の表示

### FV-6: ダッシュボード導線変更
- [ ] `/home` ヒーローの「予約一覧」ボタンを「お気に入り」に変更
- [ ] 予約一覧への導線は下部カードセクションに移動
