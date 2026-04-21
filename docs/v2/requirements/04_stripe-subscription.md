# Stripe サブスクリプション導入

## 概要
事業主向けの月額課金をStripeで実装。ベーシック（¥500/月）とスタンダード（¥980/月・初回1ヶ月無料トライアル）の2プランを提供。プロ（¥1,980/月）は近日公開。

---

## 決済フロー

### 方式
- Stripe Checkout（リダイレクト方式）
- Stripeのホスト画面で決済 → 完了後にPeCoに戻る

### 事業主登録フロー
```
① プラン選択（ベーシック¥500 / スタンダード¥980）
② お店の名前・カテゴリ
③ 予約ページURL
④ 連絡先・プロフィール
⑤ Stripe Checkout（決済）
⑥ 完了
```

- ①で料金を明示し、⑤で決済
- スタンダードのトライアル時は⑤でカード登録のみ（初月¥0）
- ②〜④の入力で「自分のお店のページが出来上がる」体験を先に提供し、決済の離脱率を下げる

---

## トライアル

| 項目 | 内容 |
|------|------|
| 対象 | スタンダードプランのみ |
| 期間 | 初回1ヶ月無料 |
| 終了後 | 自動課金（Stripe trial_period_days使用） |
| 通知 | トライアル終了前にLINE/メールで通知 |

---

## プラン変更

| 操作 | 適用タイミング |
|------|-------------|
| アップグレード（ベーシック→スタンダード） | 即時反映 |
| ダウングレード（スタンダード→ベーシック） | 現在の請求期間末で反映 |

---

## 解約

| 項目 | 内容 |
|------|------|
| 解約後の利用 | 現在の請求期間末までスタンダード機能が使える |
| データ保持 | スタンダード機能で作ったデータは3ヶ月保持、その後削除 |
| 再アップグレード | 3ヶ月以内なら再アップグレードでデータ復活 |

---

## サブスク管理ページ

### 場所
`/provider/billing` 新設

### 自前で実装
- 現在のプラン表示
- プラン変更ボタン（アップグレード / ダウングレード）
- 次回請求日・金額
- 解約ボタン

### Stripeカスタマーポータルへリンク
- 支払い履歴
- カード情報変更

---

## データモデル

```sql
-- providersテーブルにプラン情報追加
ALTER TABLE providers ADD COLUMN plan text NOT NULL DEFAULT 'basic'
  CHECK (plan IN ('basic', 'standard', 'pro'));
ALTER TABLE providers ADD COLUMN stripe_customer_id text;
ALTER TABLE providers ADD COLUMN stripe_subscription_id text;
ALTER TABLE providers ADD COLUMN plan_period_end timestamptz;
ALTER TABLE providers ADD COLUMN trial_ends_at timestamptz;
```

## 環境変数

```bash
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_STANDARD_PRICE_ID=price_...
```

---

## 実装チケット

### ST-1: Stripe セットアップ
- [ ] Stripeアカウント作成・APIキー取得
- [ ] 商品・価格の作成（ベーシック¥500/月、スタンダード¥980/月）
- [ ] スタンダードにトライアル期間（30日）設定
- [ ] 環境変数設定（.env.local, Vercel）
- [ ] `stripe` パッケージインストール

### ST-2: DBカラム追加
- [ ] `providers` テーブルに `plan`, `stripe_customer_id`, `stripe_subscription_id`, `plan_period_end`, `trial_ends_at` カラム追加（マイグレーション）

### ST-3: 登録フロー改修
- [ ] 登録ウィザードの最初にプラン選択ステップ追加
- [ ] PC版の登録フォームにもプラン選択追加
- [ ] 選択プランをステート管理
- [ ] 登録情報入力完了後、Stripe Checkout Sessionを作成するAPI
- [ ] `/api/stripe/checkout/route.ts` 新規作成
- [ ] Checkout完了後のリダイレクト処理

### ST-4: Stripe Webhook
- [ ] `/api/stripe/webhook/route.ts` 新規作成
- [ ] `checkout.session.completed` — 初回決済完了、プラン反映
- [ ] `invoice.paid` — 月次決済成功
- [ ] `invoice.payment_failed` — 決済失敗
- [ ] `customer.subscription.updated` — プラン変更
- [ ] `customer.subscription.deleted` — 解約
- [ ] `customer.subscription.trial_will_end` — トライアル終了3日前通知

### ST-5: サブスク管理ページ
- [ ] `/provider/billing/page.tsx` 新規作成
- [ ] 現在のプラン表示（プラン名・次回請求日・金額）
- [ ] トライアル中の場合は残り日数表示
- [ ] アップグレードボタン → Stripe Checkout
- [ ] ダウングレードボタン → 確認モーダル → API呼び出し
- [ ] 解約ボタン → 確認モーダル → API呼び出し（期間末まで利用可能の説明）
- [ ] Stripeカスタマーポータルへのリンク（支払い履歴・カード変更）
- [ ] ProviderNavにメニュー追加

### ST-6: プラン変更API
- [ ] `/api/stripe/change-plan/route.ts` 新規作成
- [ ] アップグレード: Stripe Subscription のprice変更（即時）
- [ ] ダウングレード: Stripe Subscription のprice変更（期間末）
- [ ] `/api/stripe/cancel/route.ts` — 解約（期間末）

### ST-7: トライアル終了通知
- [ ] トライアル終了3日前にLINE通知送信
- [ ] Webhook `customer.subscription.trial_will_end` で発火
- [ ] 通知内容: 「トライアル期間が○日後に終了します。自動的に¥980/月の課金が開始されます」

### ST-8: データ保持・削除ジョブ
- [ ] ダウングレード後3ヶ月経過したスタンダード機能データを削除するcronジョブ
- [ ] 対象: 顧客メモ、通知テンプレート、分析設定
- [ ] 削除前にLINE通知で警告
