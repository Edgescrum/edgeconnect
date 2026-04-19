# 18. 共通footer・事業主登録導線

## 概要
全公開ページに共通footerを設置し、EdgeConnectの各ページへの導線と事業主登録への誘導を提供する。

## 共通footerの構成

```
──────────────────────────
EdgeConnect

EdgeConnectとは → /about
事業主を探す → /explore
利用規約 → /terms（将来）
プライバシーポリシー → /privacy（将来）

© Edgescrum
──────────────────────────
```

## 事業主登録導線

`/p/[slug]` の footer 上部に、事業主登録を促すバナーを追加:

```
┌──────────────────────────────┐
│ あなたもEdgeConnectで          │
│ 予約管理をはじめませんか？      │
│          [詳しく見る → /about] │
└──────────────────────────────┘
```

## 対象ページ
- `/p/[slug]`（事業主公開ページ）
- `/explore`（ディレクトリ）
- `/about`（LP）
- `/bookings/*`（お客さん予約ページ）

## 非表示ページ
- `/provider/*`（事業主管理画面）— 既存のナビゲーションがあるため不要
- 予約フロー `/p/[slug]/book/*` — フロー中断を避けるため非表示

## Todo

### 共通footerコンポーネント
- [ ] `src/components/PublicFooter.tsx` を作成
- [ ] サイト内リンク（EdgeConnectとは・事業主を探す）
- [ ] 利用規約・プライバシーポリシーリンク（将来用にプレースホルダー）
- [ ] コピーライト表示

### 事業主登録バナー
- [ ] `/p/[slug]` footer 上部に事業主登録バナーを追加

### 各ページへの組み込み
- [ ] `/p/[slug]/page.tsx` に共通footer追加
- [ ] `/explore/page.tsx` に共通footer追加
- [ ] `/about/page.tsx` に共通footer追加
- [ ] `/bookings/` 配下に共通footer追加
