# EdgeConnect MVP要件定義書

> ver 1.1 | 作成日：2025年 | 運営会社：Edgescrum

---

## 1. サービス概要

### 1-1. サービス名
**EdgeConnect**（エッジコネクト）

### 1-2. 一言説明
個人事業主がLINE公式アカウントを起点に、予約受付・スケジュール管理を自動化できるフリーミアム型プラットフォーム。

### 1-3. 解決する課題
- 予約管理をLINE・電話・DMで手動対応しており、対応漏れ・二重予約が発生しやすい
- 新規アプリ登録・SEO対応などの導入コストが高く、個人事業主がITツールを導入しにくい
- サービス案内・プロフィールをWebサイトなしで顧客に伝える手段が少ない

### 1-4. ビジネスモデル
フリーミアム（基本予約管理は無料、追加機能は有料プラン）

| プラン | 料金 | 主な機能 |
|--------|------|----------|
| 無料プラン | ¥0 | 予約管理・サービスメニュー・プロフィール・インターバル設定・URL/QR発行 |
| 有料プラン（未確定） | 月額課金想定 | カレンダー同期・決済・リマインダーカスタマイズ・分析 等 |

---

## 2. ユーザー種別

| 種別 | 呼称 | 認証方法 | 説明 |
|------|------|----------|------|
| サービス提供者 | 事業主 | LINEログイン | サービスを提供する個人事業主。LINEログインでアプリに登録し、予約・スケジュールを管理する |
| 予約者 | お客さん | LINEログイン | サービスのLINE公式アカウントを友だち追加し、LINEから予約するエンドユーザー |

**対象業種：** 業界不問（美容師・コーチ・講師・整体師など）

---

## 3. システム概要

### 3-1. LINE構成（重要）

**プラットフォームが1つのLINE公式アカウントを保有・運営する。事業主ごとのLINE公式アカウントは作成しない。**

| コンポーネント | 役割 |
|---------------|------|
| LINE公式アカウント（1つ） | お客さんが友だち追加する窓口。全事業主共通 |
| LINE LIFF | LINEアプリ内に予約・管理WebUIを埋め込む。LINE IDで自動認証 |
| LINE Messaging API | 予約確認・リマインダー通知を事業主・お客さん双方にFlex Messageで送信 |
| LINEログイン | 事業主・お客さん両方の認証に使用 |

### 3-2. 事業主の識別方法

事業主ごとにユニークなスラッグを発行し、LIFFのURLパラメータで事業主を特定する。

```
https://liff.line.me/xxxx?provider=yamada-salon
```

このURLをQRコード化して事業主が顧客に共有することで、お客さんは該当事業主の予約ページに直接アクセスできる。

### 3-3. 通知設計

- 通知はすべて **LINE Flex Message** で送信（リッチなカードUI）
- メッセージ文頭に必ず事業主名を表示し、複数事業主の通知が混在しても識別できるようにする
- 通知種別ごとのボタン設計：

| 通知種別 | ボタン構成 |
|---------|-----------|
| 予約確定 | 「予約を確認する」＋「キャンセル」 |
| リマインダー（前日） | 「予約詳細を見る」＋「事業主に直接連絡する」 |
| キャンセル通知 | 「再予約する」＋「事業主に直接連絡する」 |

---

## 4. ユーザーフロー

### 4-1. お客さんの予約フロー

```
① サービスのLINE公式アカウントを友だち追加（初回のみ）
② 事業主から共有されたURL/QRコードからLIFFを開く
③ LINEログインで自動認証
④ 事業主のプロフィール・サービスメニューを確認
⑤ サービス選択 → 空き日時選択 → 予約確定
⑥ 予約確認通知をLINE Flex Messageで受信
⑦ 前日にリマインダー通知をLINE Flex Messageで受信
```

### 4-2. 事業主の登録フロー

```
① サービスのLIFFページにアクセス
② LINEログインで認証・アカウント作成
③ プロフィール入力（氏名・屋号・プロフィール文・アイコン）
④ 個人LINEアカウントのURL登録（お客さんとの連絡用・必須）
⑤ サービスメニュー登録（最初の1件）
⑥ 営業時間・インターバル設定
⑦ 自分専用URL/QRコードを取得 → お客さんに共有
```

---

## 5. 機能要件

### 5-1. 認証

- 事業主・お客さんともにLINEログインで認証
- LINEの `userId` を内部IDとして管理
- 事業主かお客さんかはロール（`role`）で区別
- 事業主はLINE個人アカウントの登録が必須（お客さんとの連絡用）
- スパム対策：LINEアカウント必須（電話番号認証済み）で代替。管理者による事業主アカウント停止機能を用意

### 5-2. 予約受付（優先度1）

**お客さん側**

| 機能 | 詳細 |
|------|------|
| 空き日時の閲覧 | 事業主の営業時間・既存予約・インターバルを考慮した空き枠を表示 |
| 予約作成 | サービス選択 → 日時選択 → 即時確定 |
| 予約確認通知 | 確定時にLINE Flex Messageで自動送信 |
| リマインダー通知 | 予約前日にLINE Flex Messageで自動送信 |
| 予約キャンセル | キャンセル期限内のみLIFFページからキャンセル可能 |
| 予約履歴の確認 | 自分の予約一覧を閲覧 |

**事業主側**

| 機能 | 詳細 |
|------|------|
| 予約一覧 | 日付・ステータス別に予約を確認 |
| 予約通知 | 新規予約・キャンセル発生時にLINE Flex Messageで通知 |
| 予約キャンセル | 事業主側はいつでも任意の予約をキャンセル可能（お客さんにFlex Message通知） |

**予約確定方式：** デフォルト即時確定（承認制はv2以降）

**重複予約防止：** 同一時間帯への同時予約を排他制御で防止

### 5-3. サービスメニュー管理（優先度2）

| 機能 | 詳細 |
|------|------|
| メニュー登録 | サービス名・説明・所要時間・料金を登録 |
| メニュー編集・削除 | 既存メニューの変更・削除 |
| 複数メニュー管理 | 複数サービスの並行管理 |
| 公開/非公開切替 | お客さんに表示するかどうかを制御 |
| キャンセル期限設定 | サービスメニューごとに設定（例：24 = 24時間前まで） |
| キャンセルポリシー文 | お客さんへの表示文を任意入力 |

### 5-4. 事業主プロフィール（優先度3）

| 機能 | 詳細 |
|------|------|
| 基本情報 | 氏名・屋号・プロフィール文・アイコン画像 |
| 経歴・専門分野 | テキストで自由入力 |
| 連絡先LINE URL | 個人LINEアカウントのURLを登録（必須） |
| ランディング表示 | LIFFページをホームページ的に表示。友だち追加前でもURLアクセスで閲覧可能 |
| 専用URL/QRコード | 事業主ごとのURLを自動発行・QRコード生成 |

### 5-5. スケジュール・空き時間管理（優先度4）

| 機能 | 詳細 |
|------|------|
| 営業時間設定 | 曜日ごとの営業時間を設定 |
| 定休日設定 | 定休曜日・特定日を予約不可に設定 |
| インターバル設定 | **事業主全体の共通設定**として、予約前後のバッファ時間（分）を設定 |
| 手動ブロック | 特定の日時を予約不可に設定 |

---

## 6. キャンセルポリシー

### ルール
- キャンセル期限は**サービスメニューごと**に設定可能（例：前日同時刻まで）
- 期限を過ぎた場合、お客さん側のキャンセルボタンはシステム上で非表示・無効化
- 期限後のキャンセル希望はお客さんと事業主の**LINE直接やりとり**に委ねる
- 事業主側はいつでも任意の予約をキャンセル可能

### お客さんとの直接連絡フロー（Option A）
通知メッセージに「事業主に直接連絡する」ボタンを設置し、タップすると事業主の個人LINEトークが開く。

---

## 7. 非機能要件

| 項目 | 方針 |
|------|------|
| 認証 | LINEログインのみ（メール/パスワード認証はMVP対象外） |
| マルチテナント | 1DB内で `provider_id` により完全分離 |
| 通知の分離 | LINE `userId` と事業主IDの組み合わせで通知先を制御。他事業主の通知は届かない |
| モバイル対応 | LIFF前提のためスマートフォン最適化必須 |
| 排他制御 | 同一時間帯への同時予約を防ぐトランザクション制御 |
| LINE API通数 | 月200通まで無料、超過¥0.24/通（ライトプラン）。50事業主×10件×3通=1,500通/月で約¥312/月 |

---

## 8. データモデル（概念）

```
users（ユーザー共通）
  └─ id
  └─ line_user_id
  └─ display_name
  └─ role            # "provider" or "customer"
  └─ created_at

providers（事業主プロフィール）
  └─ id
  └─ user_id
  └─ slug            # ユニーク識別子（URL用）
  └─ name            # 屋号
  └─ bio             # プロフィール文
  └─ icon_url
  └─ line_contact_url  # 個人LINEアカウントURL（必須）
  └─ is_active       # 管理者による停止フラグ

provider_settings（事業主設定）
  └─ provider_id
  └─ interval_before_min   # 予約前バッファ（分）
  └─ interval_after_min    # 予約後バッファ（分）
  └─ business_hours        # JSON: 曜日ごとの営業時間

services（サービスメニュー）
  └─ id
  └─ provider_id
  └─ name
  └─ description
  └─ duration_min
  └─ price
  └─ is_published
  └─ cancel_deadline_hours   # 例: 24 = 24時間前まで
  └─ cancel_policy_note      # キャンセルポリシー表示文（任意）

bookings（予約）
  └─ id
  └─ provider_id
  └─ service_id
  └─ customer_user_id
  └─ start_at
  └─ end_at
  └─ status          # "confirmed" / "cancelled"
  └─ cancelled_by    # "customer" / "provider"
  └─ created_at

blocked_slots（手動ブロック）
  └─ id
  └─ provider_id
  └─ start_at
  └─ end_at
  └─ reason          # 任意メモ
```

---

## 9. 画面一覧（LIFF）

### お客さん側
| 画面名 | 概要 |
|--------|------|
| 事業主プロフィールページ | 屋号・プロフィール・サービス一覧を表示。LINEログイン前でも閲覧可能 |
| サービス選択 | 公開中のメニュー一覧から選択 |
| 日時選択 | 空き枠カレンダーから日時を選択 |
| 予約確認 | 内容確認・確定ボタン |
| 予約完了 | 確定メッセージ表示 |
| 予約一覧 | 自分の予約履歴・今後の予約を確認 |
| 予約詳細 | 個別予約の詳細・キャンセルボタン（期限内のみ） |

### 事業主側（管理画面）
| 画面名 | 概要 |
|--------|------|
| ダッシュボード | 今日・今週の予約を一覧表示 |
| 予約管理 | 予約一覧・キャンセル操作 |
| サービスメニュー管理 | メニューの追加・編集・削除・公開切替 |
| プロフィール編集 | 屋号・プロフィール・アイコン・LINE URLの設定 |
| スケジュール設定 | 営業時間・定休日・インターバル・手動ブロック |
| URL/QRコード | 自分の予約ページURL確認・QRコードダウンロード |

---

## 10. MVPスコープ外（v2以降）

| 機能 | 分類 | 備考 |
|------|------|------|
| Googleカレンダー / TimeTree同期 | v2・有料プラン候補 | DBはサービスレベルで拡張可能に設計 |
| 決済機能 | v2・有料プラン | - |
| 公式マーク（詳細登録で付与） | v2 | - |
| LINE以外のWeb予約ページ | v2以降 | - |
| 予約承認制（事業主が手動承認） | v2 | デフォルト即時確定 |
| サービスごとの個別インターバル設定 | v2 | DBは拡張可能に設計しておく |
| リマインダーのカスタマイズ（時間・文面） | 有料プラン候補 | - |
| 分析・レポート | 有料プラン候補 | - |
| LIFF内チャット機能（事業主↔お客さん） | v2 | MVPはLINE直接誘導で代替 |

---

## 11. 運用コスト試算

**前提（MVPローンチ時）**
- 事業主数：50人
- 月間予約数：10件 / 事業主
- 通知数：3通 / 予約（予約確定・リマインダー・予約通知）

**試算結果**

| 項目 | 月額 |
|------|------|
| 月間総通知数 | 1,500通 |
| LINE API費用（超過分1,300通 × ¥0.24） | ¥312 |
| インフラ費用（サーバー・DB等） | ¥1,000 |
| 合計 | ¥1,312 |
| **事業主あたり** | **約¥26/月** |

→ 目標の¥500〜¥1,000/人を大幅に下回る。スケールしても構造的に1人あたりコストは低下する。

---

## 12. 技術スタック（確定）

| レイヤー | 技術 | 備考 |
|---------|------|------|
| フロントエンド | Next.js 14（App Router） | |
| バックエンド | Next.js API Routes | |
| DB / ユーザー管理 | Supabase（PostgreSQL） | Supabase Authは使わず独自usersテーブルで管理 |
| LINE連携 | LIFF SDK / Messaging API / LINEログイン | |
| ホスティング | Vercel | |
| 開発環境HTTPS | ngrok | LIFF動作確認用 |

### 命名規則・リソース名

| 用途 | 名前 |
|------|------|
| GitHubリポジトリ | `edgeconnect` |
| Supabaseプロジェクト | `edgeconnect` |
| LINE公式アカウント名 | EdgeConnect |
| ドメイン候補 | `edgeconnect.jp` / `edgeconnect.app` |

### 開発時のLIFF確認方法

```
UIの実装・確認     → localhost:3000（LIFFモックモード）で高速確認
LINE連携の確認     → ngrokでLINEアプリ実機テスト
本番前統合テスト   → Vercelプレビューで最終確認
```

### 環境変数一覧（`.env.local`）

```bash
# LIFF
NEXT_PUBLIC_LIFF_ID=

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # サーバー専用・ログインAPI routeでのみ使用
```

### 14-2. 事業主向けカレンダー連携
 
#### 概要
事業主が管理画面（プロフィール設定 > カレンダー連携タブ）で初回1回URLを登録するだけで、以降の予約がカレンダーに自動反映される。
 
#### 対応カレンダーアプリ
 
| アプリ | 方法 | 優先度 |
|--------|------|--------|
| Googleカレンダー | URLボタン1タップで登録 | MVP |
| Appleカレンダー（iPhone/Mac） | URLボタン1タップで登録 | MVP |
| TimeTree・Outlook・その他 | URLをコピーして手動登録 | MVP（URLコピーボタンで対応） |
 
#### iCal URLの仕様
 
```
webcal://edgeconnect.app/api/calendar/[slug]/[token].ics
```
 
- アカウント作成時に事業主ごとに1本発行・固定
- アクセスされるたびにSupabaseから最新の予約一覧を取得して.ics形式で返す
- カレンダーアプリ側が数時間〜1日おきに自動ポーリング → 新規予約が自動反映
 
#### 管理画面のUI構成（カレンダー連携タブ）
 
- **連携状況エリア**：連携済みアプリ名・最終同期日時・解除ボタンを表示
- **カレンダーを追加するエリア**：
  - 「Googleカレンダーに登録する」ボタン
  - 「Appleカレンダーに登録する（iPhone）」ボタン
  - 「URLをコピーする（その他のアプリ用）」ボタン
- 注意書き：「このURLはあなた専用です。他の人と共有しないでください」
 
#### APIルート
 
```
GET /api/calendar/[slug]/[token].ics
→ JWTでトークンを検証
→ Supabaseから provider_id に紐づく confirmed の予約一覧を取得
→ .ics形式（VCALENDAR）に変換して返す
```
 
#### 最終同期日時のログ
 
カレンダーアプリがURLにアクセスした日時をDBに記録し、管理画面に「最終同期：〇月〇日 〇〇:〇〇」として表示する。
 
---
 
### 14-3. お客さん向けカレンダー追加
 
#### 概要
Flex Messageに「カレンダーに追加」ボタンを設置し、タップするとその予約1件だけをカレンダーに追加できる。定期同期は行わない。
 
#### 対象Flex Message
 
| 通知種別 | ボタン表示 |
|---------|-----------|
| 予約確定通知 | 「Googleカレンダー」「Appleカレンダー」の2ボタンを常に表示 |
| リマインダー通知 | カレンダー未連携の場合のみ「カレンダーに追加する」を表示 |
 
#### ボタンのURL仕様
 
**Googleカレンダー**（サーバー不要・URLパラメータのみで完結）
 
```
https://calendar.google.com/calendar/r/eventedit
  ?text=[事業主名]（[メニュー名]）
  &dates=[開始日時]/[終了日時]
  &details=[料金・キャンセル期限]
  &location=[場所]
```
 
**Appleカレンダー**（1件分の.icsをAPIルートで返す）
 
```
GET /api/calendar/event/[booking_id].ics
→ booking_id（UUID）に紐づく予約1件を.ics形式で返す
→ JWTなし・booking_idのUUIDが推測困難なため安全
```
 
#### セキュリティ
 
- `booking_id` はSupabaseが自動生成するUUID（推測不可）
- URLが流出しても1件分の予約情報のみ参照可能
- Flex Message内に「あなた専用のURLです・他の人と共有しないでください」を表示
 
---
 
### 14-4. データモデルへの追加
 
```
providers（既存テーブルに追記）
  └─ calendar_token: string   # iCal URL用トークン（アカウント作成時に自動生成）
  └─ calendar_last_synced_at: timestamp  # 最終同期日時
```
 
---

## 13. 残課題・次のステップ

- [x] サービス名の決定（EdgeConnect）
- [x] 技術スタックの選定（Next.js + Supabase）
- [ ] 有料プランの機能範囲・価格帯の検討
- [ ] LINE Developersアカウント・LIFF・Messaging API・LINEログインの設定
- [ ] ワイヤーフレーム作成（LIFFページのUI設計）
- [ ] Flex MessageのJSONテンプレート設計（予約確定・リマインダー・キャンセル）
- [ ] プライバシーポリシー・利用規約の策定
- [ ] LINE Messaging APIの月間通数モニタリング設計

---

## 13. データ保持・退会ポリシー

| ケース | 方針 |
|--------|------|
| お客さんが退会 | 予約履歴は匿名化して保持（事業主の記録として必要） |
| 事業主が退会 | 未来の予約をキャンセル通知 → 30日後にデータ削除 |
| データ保持期間 | 予約完了後1年 |

---

## Next.js 開発ルール

このプロジェクトはNext.js 16（App Router）を使用している。バンドルされたドキュメント（`node_modules/next/dist/docs/`）を正とし、以下のルールを遵守すること。

### Server / Client コンポーネントの使い分け
- コンポーネントはデフォルトでServer Component。`'use client'`は状態管理・イベントハンドラ・ブラウザAPI・`useEffect`が必要な場合のみ付与する
- Server Componentでデータ取得・秘匿情報アクセスを行い、Client Componentにはprops経由でデータを渡す
- `'use client'`の境界はできるだけ末端（リーフ）に寄せ、Client Componentの範囲を最小化する

### データ取得
- Server Componentで直接`async/await`を使ってデータを取得する（Supabaseクエリ含む）
- `fetch`リクエストはデフォルトでキャッシュされない。キャッシュが必要な場合は`use cache`ディレクティブを使う
- Client Componentでのデータ取得が必要な場合はRoute Handler（`app/api/**/route.ts`）経由にする

### データ更新（Server Actions）
- データ変更は`'use server'`ディレクティブを付けたServer Actionsで実装する
- Server Actions内では必ず認証・認可チェックを行う（POSTリクエストで直接呼び出し可能なため）
- 更新後は`revalidatePath`または`revalidateTag`でキャッシュを無効化する

### ルーティングとファイル構成
- `src/app/`配下のファイルシステムベースルーティングを使用する
- ページは`page.tsx`、レイアウトは`layout.tsx`、APIは`route.ts`で定義
- 共有UIはレイアウトで実装し、ページ間でステートを保持する
- 動的ルートのparamsは`Promise`型（`params: Promise<{ id: string }>`）としてawaitする

### パスエイリアス
- インポートは`@/*`エイリアス（`./src/*`にマッピング）を使用する

### スタイリング
- Tailwind CSS v4を使用。`@import "tailwindcss"`構文と`@theme inline`でカスタムトークンを定義
- インラインのTailwindクラスを優先し、カスタムCSSは最小限に留める

### 画像・フォント
- 画像は`next/image`の`<Image>`コンポーネントを使用する（自動最適化）
- フォントは`next/font`を使用する（現在Geistフォントを`next/font/google`で読み込み済み）

### 環境変数
- クライアントに公開する値は`NEXT_PUBLIC_`プレフィックス付きにする
- サーバー専用の秘匿値（`LINE_CHANNEL_ACCESS_TOKEN`、`SUPABASE_SERVICE_ROLE_KEY`等）は`NEXT_PUBLIC_`を付けない

### Supabase クライアントの使い方
- Supabaseクライアントは`@/lib/supabase/server`（サーバー用）と`@/lib/supabase/client`（クライアント用）に分けて作成する
- **Server Component / Server Actions / Route Handler**では`await createClient()`（`@/lib/supabase/server`）を使う
- **Client Component**では`createClient()`（`@/lib/supabase/client`）を使う
- Server Componentでのデータ取得例:
  ```tsx
  import { createClient } from "@/lib/supabase/server";
  const supabase = await createClient();
  const { data } = await supabase.from("テーブル名").select();
  ```
- RLS（Row Level Security）を全テーブルで有効にし、適切なポリシーを設定すること
- 認証はCookieベースで管理する（Supabase Auth は使わず独自usersテーブルで管理）
- 環境変数: `NEXT_PUBLIC_SUPABASE_URL`（クライアント公開）、`NEXT_PUBLIC_SUPABASE_ANON_KEY`（クライアント公開）、`SUPABASE_SERVICE_ROLE_KEY`（サーバー専用・非公開）

### Supabase Auth サーバーサイド実装ルール

`@supabase/ssr`パッケージを使い、Cookie経由でセッションを管理する。

#### 依存パッケージ
```bash
npm install @supabase/supabase-js @supabase/ssr
```

#### クライアント生成ファイル構成

| ファイル | 用途 | 関数 |
|---------|------|------|
| `lib/supabase/client.ts` | ブラウザ / Client Component | `createBrowserClient()` （シングルトン） |
| `lib/supabase/server.ts` | Server Component / Server Actions / Route Handler | `await createClient()` （`createServerClient` + `cookies()`） |
| `lib/supabase/proxy.ts` | Middleware用セッション更新ロジック | `updateSession(request)` |

#### Middleware（proxy）の必須ルール
- Next.js Server Componentは直接Cookieを書き込めないため、**Middlewareでセッションをリフレッシュする仕組みが必須**
- Middlewareでは`createServerClient`の直後に`supabase.auth.getClaims()`を呼ぶ。**この間に他のコードを挟まないこと**（ランダムログアウトの原因になる）
- Middlewareから返すレスポンスは必ず`supabaseResponse`オブジェクトをそのまま返す。新しい`NextResponse.next()`を作る場合は`supabaseResponse.cookies.getAll()`を必ずコピーすること（ブラウザとサーバーのセッション不整合を防ぐ）
- Middleware matcher設定例:
  ```ts
  export const config = {
    matcher: [
      '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
  }
  ```

#### 認証チェックのルール
- サーバー側では必ず`supabase.auth.getClaims()`を使う（JWT署名を毎回検証する）
- **`supabase.auth.getSession()`はサーバー側で使わないこと** — JWTの再検証が保証されず、なりすまし可能
- 未認証ユーザーのアクセスはMiddlewareでログインページにリダイレクトする

#### クライアント生成の注意点
- サーバー側ではリクエストごとに新しいクライアントを生成する（グローバル変数に保持しない）
- ブラウザ側の`createBrowserClient`は内部でシングルトンパターンを使うため、複数回呼んでもOK

#### キャッシュとセッションの注意
- ISRやCDNを使う場合、セッションリフレッシュ時の`Set-Cookie`レスポンスがキャッシュされると**別ユーザーのセッションが漏洩する危険がある**。認証関連ページはキャッシュしないこと
