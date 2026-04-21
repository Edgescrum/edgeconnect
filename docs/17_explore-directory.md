# 17. 事業主ディレクトリ（Explore）

## 概要
お客さんがカテゴリや検索で事業主を探し、予約ページに遷移できるディレクトリページ。

## URL
`/explore`（認証不要・公開ページ）

## 機能

| 機能 | 詳細 |
|------|------|
| 事業主一覧 | アイコン・屋号・カテゴリ・bio先頭をカード表示 |
| カテゴリフィルタ | CategorySelector コンポーネントでマルチセレクト（複数カテゴリ同時フィルタ） |
| 検索 | 屋号・bioのテキスト検索 |
| ページネーション | 無限スクロール（20件ずつ） |
| カード遷移先 | `/p/[slug]` |

## カテゴリフィルタ

### CategorySelector コンポーネント
- カテゴリは `categories` テーブルから動的取得（`getCategories()`）
- ドロップダウン + チップUI
- 複数カテゴリ選択可能（AND/OR はRPCで制御）
- 同じコンポーネントを事業主登録・プロフィール編集でも共有

### DB Function
`search_providers` RPC が `text[]` 型の `p_categories` パラメータを受け付ける:

```sql
search_providers(
  p_categories text[],  -- 複数カテゴリフィルタ
  p_query text,         -- テキスト検索
  p_offset int,
  p_limit int
)
```

## 表示条件
- `providers.is_active = true` のみ
- `services` が1件以上ある事業主のみ（メニュー未設定は非表示）
- ソート: 新着順（デフォルト）

## データ取得
- `search_providers` DB Function（SECURITY DEFINER）
- Server Action: `src/lib/actions/explore.ts`
- クライアントから無限スクロールで追加読み込み

## カードUI

```
┌──────────────────────────────┐
│ [icon]  屋号                  │
│         カテゴリチップ(複数)    │
│         bio先頭50文字...       │
│                        → 詳細 │
└──────────────────────────────┘
```

## 実装状況

### DB
- [x] `search_providers` DB Function 作成（カテゴリ・テキスト検索・ページネーション）
- [x] `categories` テーブル作成（マスタデータ）
- [x] サービス0件の事業主を除外するクエリ条件

### ページ実装
- [x] `/explore/page.tsx` を作成
- [x] 事業主カード一覧コンポーネント
- [x] CategorySelector UI（マルチセレクト対応）
- [x] テキスト検索バー
- [x] 無限スクロール（IntersectionObserver、20件ずつ）

### デザイン
- [x] 0件時の Empty State（「まだ事業主が登録されていません」）
- [x] 検索結果0件時のUI（「該当する事業主が見つかりません」）
- [x] モバイル最適化（カード1列表示）
- [x] max-w-5xl で中央寄せ
