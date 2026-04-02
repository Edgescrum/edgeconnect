# 02. データベース設計・Supabaseセットアップ

## 概要
Supabase上にMVPに必要な全テーブルを作成し、RLSポリシーを設定する。

## データモデル

### users（ユーザー共通）
| カラム | 型 | 説明 |
|--------|---|------|
| id | bigint (PK, identity) | |
| line_user_id | text (unique) | LINE userId |
| display_name | text | |
| role | text | "provider" or "customer" |
| created_at | timestamptz | |

### providers（事業主プロフィール）
| カラム | 型 | 説明 |
|--------|---|------|
| id | bigint (PK, identity) | |
| user_id | bigint (FK → users) | |
| slug | text (unique) | URL用ユニーク識別子 |
| name | text | 屋号 |
| bio | text | プロフィール文 |
| icon_url | text | |
| line_contact_url | text (not null) | 個人LINEアカウントURL |
| is_active | boolean | 管理者による停止フラグ |
| calendar_token | text | iCal URL用トークン（アカウント作成時に自動生成） |
| calendar_last_synced_at | timestamptz | カレンダーアプリからの最終同期日時 |

### provider_settings（事業主設定）
| カラム | 型 | 説明 |
|--------|---|------|
| provider_id | bigint (PK, FK → providers) | |
| interval_before_min | int | 予約前バッファ（分） |
| interval_after_min | int | 予約後バッファ（分） |
| business_hours | jsonb | 曜日ごとの営業時間 |

### services（サービスメニュー）
| カラム | 型 | 説明 |
|--------|---|------|
| id | bigint (PK, identity) | |
| provider_id | bigint (FK → providers) | |
| name | text | |
| description | text | |
| duration_min | int | 所要時間（分） |
| price | int | 料金 |
| is_published | boolean | 公開/非公開 |
| cancel_deadline_hours | int | キャンセル期限（時間） |
| cancel_policy_note | text | キャンセルポリシー表示文 |

### bookings（予約）
| カラム | 型 | 説明 |
|--------|---|------|
| id | uuid (PK, default gen_random_uuid()) | お客さん向けカレンダー追加URLに使用（推測不可） |
| provider_id | bigint (FK → providers) | |
| service_id | bigint (FK → services) | |
| customer_user_id | bigint (FK → users) | |
| start_at | timestamptz | |
| end_at | timestamptz | |
| status | text | "confirmed" / "cancelled" |
| cancelled_by | text | "customer" / "provider" |
| created_at | timestamptz | |

### blocked_slots（手動ブロック）
| カラム | 型 | 説明 |
|--------|---|------|
| id | bigint (PK, identity) | |
| provider_id | bigint (FK → providers) | |
| start_at | timestamptz | |
| end_at | timestamptz | |
| reason | text | 任意メモ |

## Todo

### テーブル作成
- [x] `users` テーブル作成（SQLマイグレーション）
- [x] `providers` テーブル作成
- [x] `provider_settings` テーブル作成
- [x] `services` テーブル作成
- [x] `bookings` テーブル作成
- [x] `blocked_slots` テーブル作成

### RLSポリシー
- [x] 全テーブルで RLS を有効化
- [x] `users`: 自分のレコードのみ読み書き可能
- [x] `providers`: 誰でも読み取り可能（公開プロフィール）、本人のみ書き込み可能
- [x] `provider_settings`: 事業主本人のみ読み書き可能
- [x] `services`: 公開メニューは誰でも読み取り可能、事業主本人のみ書き込み可能
- [x] `bookings`: お客さんは自分の予約のみ、事業主は自分宛の予約のみ読み取り可能
- [x] `blocked_slots`: 事業主本人のみ読み書き可能

### インデックス
- [x] `bookings` に `(provider_id, start_at, status)` の複合インデックス追加（空き枠検索用）
- [x] `users` に `line_user_id` のユニークインデックス確認
- [x] `providers` に `slug` のユニークインデックス確認

### Database Functions（SECURITY DEFINER）
- [x] `upsert_user_from_line()` — ユーザー登録/更新
- [x] `register_provider()` — 事業主登録（providers + provider_settings を1トランザクション）
- [x] `create_booking()` — 予約作成（排他制御付き）
- [x] `cancel_booking()` — 予約キャンセル（期限チェック付き）
- [x] `get_available_slots()` — 空き枠取得（営業時間・予約・ブロック・インターバル考慮）
