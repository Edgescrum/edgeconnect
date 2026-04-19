# 20. LINE友だち追加フロー改善

## 概要
LINE友だち追加をスキップした場合のリカバリ動線。通知が届かないことを明示しつつ、強制しない設計。

## 判定方法

### DB変更
- `users` テーブルに `is_line_friend` (boolean, default false) を追加

### Webhook連携
- `follow` イベント受信時: 該当ユーザーの `is_line_friend` を `true` に更新
- `unfollow` イベント受信時: 該当ユーザーの `is_line_friend` を `false` に更新

## 表示箇所と内容

| 箇所 | 表示条件 | 内容 |
|------|---------|------|
| 予約完了画面 | 友だち未追加 | 警告バナー + 友だち追加ボタン |
| 予約一覧 `/bookings` | 友だち未追加 | ヘッダーバナー + 友だち追加ボタン |
| 予約詳細 `/bookings/[id]` | 友だち未追加 | 「リマインダーを受け取る」ボタン |

## バナーUI

```
┌─ ⚠ ───────────────────────────┐
│ LINE通知が届きません            │
│ 友だち追加すると予約確認・       │
│ リマインダーが届きます           │
│ [友だち追加する]  [閉じる]       │
└────────────────────────────────┘
```

- 「閉じる」でセッション内は非表示（sessionStorage）
- 次回アクセス時に再表示

## 友だち追加ボタンの遷移先

```
https://line.me/R/ti/p/{LINE公式アカウントのベーシックID}
```

- 環境変数 `NEXT_PUBLIC_LINE_BOT_BASIC_ID` で管理

## Todo

### DB
- [ ] `users` テーブルに `is_line_friend` (boolean, default false) を追加

### Webhook
- [ ] `follow` イベントハンドラで `is_line_friend = true` に更新
- [ ] `unfollow` イベントハンドラで `is_line_friend = false` に更新

### 友だち追加バナーコンポーネント
- [ ] `src/components/LineFriendBanner.tsx` を作成
- [ ] 警告アイコン + メッセージ + 友だち追加ボタン + 閉じるボタン
- [ ] sessionStorage で「閉じる」状態を管理

### 各ページへの組み込み
- [ ] 予約完了画面 (`booking-flow.tsx` の done ステップ) にバナー追加
- [ ] 予約一覧 (`/bookings/page.tsx`) にヘッダーバナー追加
- [ ] 予約詳細 (`/bookings/[id]/page.tsx`) にボタン追加

### 環境変数
- [ ] `NEXT_PUBLIC_LINE_BOT_BASIC_ID` を `.env.local` と `.env.example` に追加
