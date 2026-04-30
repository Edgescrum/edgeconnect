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

---

## 解約後アクセス制御ポリシー

### 無料プランの不在

事業者には無料プランが存在しない。サブスクリプション未登録または解約済みの場合は `inactive` として扱い、管理画面の大部分をブロックする。

### subscription_status カラム

providers テーブルに `subscription_status` カラムを追加し、事業主のサブスクリプション状態を DB レベルで管理する。

| ステータス | 意味 | 遷移元イベント |
|-----------|------|-------------|
| `active` | 有効なサブスクリプション | `checkout.session.completed`, `customer.subscription.updated` (status=active) |
| `trialing` | トライアル中 | `checkout.session.completed` (trial), `customer.subscription.updated` (status=trialing) |
| `past_due` | 支払い失敗（Stripe がリトライ中） | `customer.subscription.updated` (status=past_due) |
| `inactive` | 解約済み / サブスク未登録 | `customer.subscription.deleted`, デフォルト値 |

- カラム定義: `text NOT NULL DEFAULT 'inactive'`
- CHECK 制約: `subscription_status IN ('active', 'trialing', 'past_due', 'inactive')`
- Stripe Webhook で同期: `customer.subscription.updated` / `deleted` / `checkout.session.completed`
- `link-subscription` API でも同期

### 管理画面のアクセス制御

| subscription_status | `/provider/billing` | `/provider/*`（その他） |
|---|---|---|
| `active` | アクセス可 | アクセス可 |
| `trialing` | アクセス可 | アクセス可 |
| `past_due` | アクセス可 | アクセス可 |
| `inactive` | アクセス可 | `/provider/billing` にリダイレクト |

- 各 `/provider/*` の page.tsx で `requireActiveSubscription()` を呼び出してチェック
- `/provider/billing` と `/provider/register` はチェックをスキップ
- `past_due` はリトライ期間中のためフルアクセスを許可

### Server Actions のアクセス制御

| subscription_status | Server Actions 実行 |
|---|---|
| `active` | 許可 |
| `trialing` | 許可 |
| `past_due` | 許可 |
| `inactive` | エラー（`subscription_inactive`） |

- `getProviderId()` 内で `subscription_status` をチェック
- billing 関連の Server Actions（Checkout セッション作成等）はチェックをスキップ（`skipSubscriptionCheck: true`）
- API Route 経由の直接呼び出しでもガードされる

### 公開ページの受付停止表示

`subscription_status` が `inactive` の場合の公開ページ（`/p/[slug]`）の表示:

- プロフィール情報: 表示する（屋号、プロフィール文、アイコン画像）
- サービスメニュー一覧: 非表示
- 予約ボタン: 非表示
- 受付停止メッセージ: 「現在予約の受付を停止しています」を表示
- 事業主の連絡先: 表示する（LINE 連絡先リンク）
- 404 にしない理由: 既存顧客が困惑するため。連絡先を残すことで配慮する

予約フローページ（`/p/[slug]/book/*`）:
- 予約不可ページを表示（「現在予約の受付を停止しています」メッセージ + プロフィールへの戻りリンク）

`active` / `trialing` / `past_due` 時は既存の表示のまま。`past_due` でも予約は可能。

### cancel_at 以降の予約

`cancel_at`（解約予約日）が設定されていても、その日以降の予約はブロックしない。解約予約中は `subscription_status` が `active` または `trialing` のまま維持され、`customer.subscription.deleted` が発火して初めて `inactive` になるため。

### billing ページの状態別表示

| subscription_status | 表示内容 |
|---|---|
| `inactive` | 再登録促進 UI（データ保持の案内 + 予約ページ非公開の案内 + Stripe Checkout ボタン） |
| `past_due` | 警告バナー「お支払いに問題があります」 + Customer Portal へのリンク（カード情報更新） |
| `active` / `trialing` | 既存の billing ページ（プラン情報、支払い履歴等） |
