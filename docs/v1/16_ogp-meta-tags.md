# 16. OGPメタタグ

## 概要
各ページをSNS/LINEでシェアした際に適切なプレビューカードが表示されるようにする。

## 対象ページと設定内容

| ページ | og:title | og:description | og:image |
|--------|----------|---------------|----------|
| `/about` | EdgeConnect - LINE予約管理 | 個人事業主のための予約受付・管理プラットフォーム | 汎用OGP画像（ロゴ+キャッチコピー） |
| `/p/[slug]` | {屋号} - EdgeConnect | {bio の先頭80文字} | 事業主のアイコン画像 or 汎用OGP画像 |
| `/p/[slug]/book/[serviceId]` | {メニュー名} - {屋号} | ¥{料金} / {所要時間}分 | 事業主のアイコン画像 |
| `/explore` | 事業主を探す - EdgeConnect | EdgeConnectで予約できる事業主の一覧 | 汎用OGP画像 |

## 技術仕様
- Next.js App Router の `generateMetadata` を使用
- 動的ページ (`/p/[slug]`) はDBからデータ取得してメタタグ生成
- `og:image` の汎用画像は `/public/og-default.png` (1200x630px)
- Twitter Card: `summary_large_image`
- LINE特有: `og:title` と `og:description` が表示される（画像はオプション）

## Todo

### 汎用OGP画像
- [ ] `/public/og-default.png` を作成（1200x630px、ロゴ+キャッチコピー）

### 静的ページのメタタグ
- [ ] `/about` に `generateMetadata` を追加
- [ ] `/explore` に `generateMetadata` を追加
- [ ] ルートレイアウト (`layout.tsx`) のデフォルトメタタグを設定

### 動的ページのメタタグ
- [ ] `/p/[slug]/page.tsx` に `generateMetadata` を追加（屋号・bio・アイコン画像）
- [ ] `/p/[slug]/book/[serviceId]/page.tsx` に `generateMetadata` を追加（メニュー名・料金）

### LINEシェア時のプレビュー確認
- [ ] LINE Developers の OGP デバッガーで各ページの表示確認
- [ ] `og:image` がない場合のフォールバック表示確認
