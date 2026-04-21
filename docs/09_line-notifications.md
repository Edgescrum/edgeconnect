# 09. LINE通知（Flex Message）

## 概要
予約確定・リマインダー・キャンセルの通知をLINE Flex Messageで事業主・お客さんに送信する。

## 通知設計
- 通知はすべて **LINE Flex Message** で送信（リッチなカードUI）
- メッセージ文頭に必ず事業主名を表示（複数事業主の通知が混在しても識別可能に）
- 通知先は LINE `userId` と事業主IDの組み合わせで制御（他事業主の通知は届かない）
- ブランドカラー（`brand.primary` = #f08c79）をヘッダーに使用

## 通知種別とボタン構成

| 通知種別 | 送信先 | ボタン構成 |
|---------|--------|-----------|
| 予約確定 | お客さん + 事業主 | 「予約を確認する」+「キャンセル」+「Googleカレンダー」+「Appleカレンダー」 |
| リマインダー（前日） | お客さん | 「予約詳細を見る」+「事業主に直接連絡する」+「カレンダーに追加する」（未連携時のみ） |
| キャンセル通知 | お客さん or 事業主 | 「再予約する」+「事業主に直接連絡する」 |
| 新規予約通知 | 事業主 | 「予約を確認する」 |

## LIFF URL形式（Flex Message内のリンク）

Flex Message 内のアクションURLは**パス形式**を使用する:

```
https://liff.line.me/{liffId}/bookings/{bookingId}
https://liff.line.me/{liffId}/p/{slug}
```

**レガシー形式** (`?path=` パラメータ) は Middleware (proxy.ts) が引き続きリダイレクト処理するが、新規テンプレートではパス形式を使う。

## 通知の実行タイミング（重要）

通知送信は必ず **`await`** で待つ。fire-and-forget にしてはいけない。

```typescript
// 正しい
await notifyBookingConfirmed(bookingId);

// 間違い（Vercel Serverless では送信完了前にプロセスが終了する）
notifyBookingConfirmed(bookingId); // void
```

**理由**: Vercel Serverless Functions はレスポンス返却後にプロセスを即座に終了する。`await` しないと通知が送信されない可能性がある。

## 「事業主に直接連絡する」ボタン
- タップすると事業主の個人LINEトーク（`line_contact_url`）が開く

## LINE API通数の考慮
- 月200通まで無料（ライトプラン超過: ¥0.24/通）
- 想定: 50事業主 x 10件/月 x 3通/予約 = 1,500通/月

---

## 実装状況

### Messaging API基盤
- [x] LINE Messaging APIクライアント初期化 → `src/lib/line/messaging.ts`
- [x] Flex Messageの送信ヘルパー関数（`pushFlexMessage`）
- [x] 通知送信ハンドラ → `src/lib/line/notify.ts`

### Flex Messageテンプレート → `src/lib/line/templates.ts`
- [x] 予約確定テンプレート（お客さん向け）
- [x] 新規予約テンプレート（事業主向け）
- [x] リマインダーテンプレート（前日通知）
- [x] キャンセル通知テンプレート（お客さん向け）
- [x] キャンセル通知テンプレート（事業主向け）
- [ ] 「Googleカレンダー」「Appleカレンダー」ボタン追加（13で実装予定）

### 送信トリガー
- [x] 予約作成時: お客さん + 事業主へ予約確定通知（await）
- [x] お客さんキャンセル時: 事業主へキャンセル通知（await）
- [x] 事業主キャンセル時: お客さんへキャンセル通知（await）

### リマインダー
- [x] 前日リマインダーのCRON処理 → `/api/cron/reminder` + `vercel.json`
- [x] 対象予約の抽出（翌日の `status = "confirmed"` な予約）
- [x] リマインダーFlex Message送信

### Webhookエンドポイント
- [x] LINE Messaging API Webhookの受信Route Handler → `app/api/webhook/route.ts`
- [x] 署名検証 (HMAC-SHA256)
- [x] follow イベントでユーザー自動作成
