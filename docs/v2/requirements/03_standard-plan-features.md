# スタンダードプラン機能

## 概要
スタンダードプラン（¥980/月）で追加される機能。ベーシック（¥500/月）の全機能に加えて、通知カスタマイズ・予約分析・顧客管理を提供。

---

## 1. 通知カスタマイズ

### リマインダー時間変更
- 最大2回まで送信可能
- 時間は固定選択肢: 1時間前 / 3時間前 / 前日 / 2日前
- 設定場所: `/provider/settings` または既存のスケジュール設定ページ

### 通知テンプレート
- 通知種別ごとに選択: 予約確定 / リマインダー / キャンセル
- 初期は2種類（フォーマル / カジュアル）、後から追加可能な設計
- テンプレート選択後、さらにカスタマイズ可能:

| カスタマイズ項目 | 内容 |
|----------------|------|
| ヘッダー画像 | 事業主がアップロード（サロン写真・ロゴ等） |
| 追加メッセージ | テンプレートに付加するテキスト |
| ボタンカラー | ブランドカラーで自動（実装済み） |

### データモデル

```sql
-- リマインダー設定
ALTER TABLE provider_settings ADD COLUMN reminder_times jsonb DEFAULT '["1d"]';
-- 例: ["1d", "3h"] = 前日と3時間前の2回

-- 通知テンプレート設定
CREATE TABLE notification_templates (
  id serial PRIMARY KEY,
  provider_id int NOT NULL REFERENCES providers(id),
  notification_type text NOT NULL CHECK (notification_type IN ('confirmed', 'reminder', 'cancelled')),
  template_style text NOT NULL DEFAULT 'formal' CHECK (template_style IN ('formal', 'casual')),
  header_image_url text,
  additional_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, notification_type)
);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
```

### 実装チケット

#### NT-1: リマインダー時間設定
- [ ] `provider_settings` に `reminder_times` カラム追加（マイグレーション）
- [ ] スケジュール設定ページにリマインダー時間選択UI追加
- [ ] cronジョブを複数時間対応に修正
- [ ] スタンダード以上のプランチェック

#### NT-2: 通知テンプレートDB・Server Action
- [ ] `notification_templates` テーブル作成
- [ ] RLSポリシー設定
- [ ] `getNotificationTemplates(providerId)` 取得
- [ ] `updateNotificationTemplate(type, style, headerImage, message)` 更新

#### NT-3: テンプレート設定UI
- [ ] `/provider/notifications/page.tsx` 新規作成
- [ ] 通知種別タブ（予約確定 / リマインダー / キャンセル）
- [ ] テンプレート選択（フォーマル / カジュアル）のプレビュー
- [ ] ヘッダー画像アップロード
- [ ] 追加メッセージ入力
- [ ] ProviderNavにメニュー追加

#### NT-4: テンプレート適用
- [ ] Flex Messageテンプレート生成ロジック修正
- [ ] テンプレートスタイル別のメッセージ文面定義
- [ ] ヘッダー画像・追加メッセージの挿入対応

---

## 2. 予約分析

### ダッシュボードサマリー（`/provider`）
- 今月の予約数（前月比 ↑↓）
- 今月の売上見込み（予約数 × メニュー料金、前月比 ↑↓）

### 分析専用ページ（`/provider/analytics`）

| # | 項目 | 表示形式 |
|---|------|---------|
| 1 | 月間予約数推移 | 棒グラフ（過去6ヶ月） |
| 2 | 月間売上推移 | 折れ線グラフ（過去6ヶ月） |
| 3 | キャンセル率推移 | 折れ線グラフ（過去6ヶ月） |
| 4 | 人気メニューランキング | 横棒グラフ（予約数順） |
| 5 | 曜日・時間帯別予約傾向 | ヒートマップ風 |
| 6 | リピート率 | 数値表示（2回以上来店の顧客割合） |
| 7 | 平均LTV | 数値（全顧客の平均累計売上） |
| 8 | 顧客セグメント | LTV×来店頻度で分類（優良/通常/休眠/離脱リスク） |
| 9 | 業界ベンチマーク比較 | 同カテゴリ事業主との比較（CSAT・リピート率・LTV等） |

### 実装チケット

#### AN-1: 分析データ集計RPC
- [ ] `get_monthly_stats(provider_id, months)` — 月間予約数・売上・キャンセル率
- [ ] `get_popular_menus(provider_id)` — メニュー別予約数ランキング
- [ ] `get_booking_heatmap(provider_id)` — 曜日×時間帯の予約数
- [ ] `get_repeat_rate(provider_id)` — リピート率算出
- [ ] `get_ltv_stats(provider_id)` — 平均LTV・顧客セグメント分布
- [ ] `get_category_benchmark(category)` — 同カテゴリ平均（CSAT・リピート率・LTV等、最低5事業主で有効）

#### AN-2: ダッシュボードサマリー
- [ ] `/provider/dashboard-content.tsx` にサマリーカード追加
- [ ] 今月の予約数（前月比表示）
- [ ] 今月の売上見込み（前月比表示）
- [ ] スタンダード以上のプランチェック（ベーシックは非表示 or ぼかし）

#### AN-3: 分析専用ページ
- [ ] `/provider/analytics/page.tsx` 新規作成
- [ ] グラフライブラリ選定・導入（recharts推奨）
- [ ] 月間予約数棒グラフ
- [ ] 月間売上折れ線グラフ
- [ ] キャンセル率折れ線グラフ
- [ ] 人気メニュー横棒グラフ
- [ ] 曜日×時間帯ヒートマップ
- [ ] リピート率表示
- [ ] LTV分析（平均LTV・顧客セグメント分布）
- [ ] 業界ベンチマーク比較（自分 vs 同カテゴリ平均、最低5事業主で表示）
- [ ] ProviderNavにメニュー追加

---

## 3. 顧客管理

### 顧客一覧ページ（`/provider/customers`）

| 項目 | 表示 |
|------|------|
| 顧客名 | 予約時に入力した名前 |
| 予約回数 | 累計 |
| 最終来店日 | 日付 |
| 最終メニュー | メニュー名 |

- 名前検索あり
- 来店頻度フィルタあり（例：1ヶ月以上来ていない顧客）

### 顧客詳細ページ（`/provider/customers/[id]`）

#### プロファイル情報
| 項目 | ソース | 内容 |
|------|--------|------|
| 顧客名 | 予約時入力 | — |
| 電話番号 | 予約時入力 | — |
| 性別 | `/settings`登録 | 男性/女性/その他/回答しない/未登録 |
| 年齢 | `/settings`の生年月日から自動算出 | 利用日時点の年齢 |

#### KPI指標
| 項目 | 算出方法 |
|------|---------|
| 累計予約数 | bookingsのcount |
| 累計売上（LTV） | bookingsの合計金額 |
| 平均単価 | LTV ÷ 予約数 |
| 初回来店日 | 最初の予約日 |
| 最終来店日 | 最後の予約日 |
| 利用期間 | 初回〜最終来店日 |
| 平均来店間隔 | 利用期間 ÷ 予約数 |
| 離脱リスク | 最終来店からの経過日数 ÷ 平均来店間隔（1.5以上で警告） |

#### アンケート指標
| 項目 | 内容 |
|------|------|
| CSAT平均 | この顧客の総合満足度平均 |
| 直近のCSAT推移 | 上昇/下降トレンド |
| 直近のコメント | 最新の自由記述 |

#### その他
| 項目 | 内容 |
|------|------|
| 月別来店頻度グラフ | 棒グラフ（過去6ヶ月） |
| 予約履歴一覧 | 日時・メニュー・金額・ステータス |
| メモ | 自由入力テキストエリア |
| カスタム項目 | 最大3つ、事業主が設定画面で項目名を事前定義（全顧客共通） |

### カスタム項目の仕様
- 事業主が設定画面で項目名（ラベル）を最大3つ定義
  - 例：「アレルギー」「好みのスタイル」「備考」
- 全顧客の詳細ページにその3項目が表示される
- 各顧客ごとに値を入力・保存

### データモデル

```sql
-- 顧客メモ
CREATE TABLE customer_notes (
  id serial PRIMARY KEY,
  provider_id int NOT NULL REFERENCES providers(id),
  customer_user_id int NOT NULL REFERENCES users(id),
  memo text,
  custom_fields jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, customer_user_id)
);

-- カスタム項目定義（事業主ごと）
ALTER TABLE provider_settings ADD COLUMN customer_custom_labels jsonb DEFAULT '[]';
-- 例: ["アレルギー", "好みのスタイル", "備考"]

ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
```

### 実装チケット

#### CU-1: DBテーブル・カラム作成
- [ ] `customer_notes` テーブル作成
- [ ] `provider_settings` に `customer_custom_labels` カラム追加
- [ ] RLSポリシー設定

#### CU-2: 顧客データ集計RPC
- [ ] `get_customers(provider_id, query, filter)` — 顧客一覧（検索・フィルタ対応）
- [ ] `get_customer_detail(provider_id, customer_user_id)` — 顧客詳細（予約履歴・集計）
- [ ] `get_customer_monthly_visits(provider_id, customer_user_id)` — 月別来店数

#### CU-3: カスタム項目設定UI
- [ ] `/provider/settings` またはスケジュール設定にカスタム項目ラベル設定UI
- [ ] 最大3つのラベル入力・保存

#### CU-4: 顧客一覧ページ
- [ ] `/provider/customers/page.tsx` 新規作成
- [ ] 顧客カード（名前・予約回数・最終来店日・最終メニュー）
- [ ] 名前検索
- [ ] 来店頻度フィルタ（全員 / 1ヶ月以上未来店 / 3ヶ月以上未来店）
- [ ] ProviderNavにメニュー追加

#### CU-5: 顧客詳細ページ
- [ ] `/provider/customers/[id]/page.tsx` 新規作成
- [ ] プロファイル情報（名前・電話番号・性別・年齢）
- [ ] KPI指標（LTV・累計予約数・平均単価・来店間隔・離脱リスク）
- [ ] アンケート指標（CSAT平均・トレンド・直近コメント）
- [ ] 月別来店頻度棒グラフ（過去6ヶ月）
- [ ] 予約履歴一覧
- [ ] メモテキストエリア（自動保存 or 保存ボタン）
- [ ] カスタム項目入力欄（設定したラベルに対応）

---

## プラン制御の実装

### PL-1: プラン判定の仕組み
- [ ] `providers` テーブルに `plan` カラム追加（'basic' / 'standard' / 'pro'）
- [ ] `checkPlan(userId, requiredPlan)` ヘルパー関数
- [ ] プラン不足時のUI（ぼかし表示 + アップグレード誘導）

### PL-2: プラン別機能ゲート
- [ ] 各スタンダード機能のページ/APIにプランチェック追加
- [ ] ベーシックユーザーがアクセスした場合のアップグレード画面
