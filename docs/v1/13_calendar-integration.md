# 13. カレンダー連携

## 概要
事業主向けにiCal URLによるカレンダー自動同期、お客さん向けにFlex Messageからの1件カレンダー追加を提供する。

---

## 13-A. 事業主向けカレンダー連携（iCal URL）

### 仕様
管理画面（プロフィール設定 > カレンダー連携タブ）でURLを1回登録するだけで、以降の予約がカレンダーに自動反映される。

| アプリ | 方法 | 優先度 |
|--------|------|--------|
| Googleカレンダー | URLボタン1タップで登録 | MVP |
| Appleカレンダー（iPhone/Mac） | URLボタン1タップで登録 | MVP |
| TimeTree・Outlook・その他 | URLをコピーして手動登録 | MVP（URLコピーボタンで対応） |

### iCal URLの仕様
```
webcal://edgeconnect.app/api/calendar/[slug]/[token].ics
```
- アカウント作成時に事業主ごとに1本発行・固定
- アクセスされるたびにSupabaseから最新の予約一覧を取得して.ics形式で返す
- カレンダーアプリ側が数時間〜1日おきに自動ポーリング → 新規予約が自動反映

### Todo

#### APIルート
- [x] `GET /api/calendar/[slug]/[token].ics` Route Handler作成
- [x] トークンを検証
- [x] `provider_id` に紐づく `status = "confirmed"` の予約一覧をSupabaseから取得
- [x] .ics形式（VCALENDAR）に変換して返す
- [x] レスポンスヘッダー設定（`Content-Type: text/calendar`）
- [x] アクセス日時を `providers.calendar_last_synced_at` に記録

#### トークン管理
- [x] `providers.calendar_token` をアカウント作成時に自動生成（DB Function `register_provider`内）
- [ ] トークン再発行機能

#### 管理画面UI → `/provider/calendar`
- [x] カレンダー連携画面を事業主管理画面に追加
- [x] 連携状況エリア（最終同期日時表示）
- [x] 「Googleカレンダーに登録する」ボタン
- [x] 「Appleカレンダーに登録する（iPhone）」ボタン（`webcal://`スキーム）
- [x] 「URLをコピーする（その他のアプリ用）」ボタン
- [x] 注意書き表示

---

## 13-B. お客さん向けカレンダー追加（1件ずつ）

### 仕様
Flex Messageに「カレンダーに追加」ボタンを設置し、タップするとその予約1件だけをカレンダーに追加できる。定期同期は行わない。

### 対象Flex Message

| 通知種別 | ボタン表示 |
|---------|-----------|
| 予約確定通知 | 「Googleカレンダー」「Appleカレンダー」の2ボタンを常に表示 |
| リマインダー通知 | カレンダー未連携の場合のみ「カレンダーに追加する」を表示 |

### ボタンURL仕様

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

### セキュリティ
- `booking_id` はSupabaseが自動生成するUUID（推測不可）
- URLが流出しても1件分の予約情報のみ参照可能
- Flex Message内に「あなた専用のURLです・他の人と共有しないでください」を表示

### Todo

#### Googleカレンダー用URL生成
- [x] 予約情報からGoogleカレンダーURLを生成するヘルパー関数 → `generateGoogleCalendarUrl()`
- [x] 日時フォーマット変換

#### Apple カレンダー用APIルート
- [x] `GET /api/calendar/event/[booking_id].ics` Route Handler作成
- [x] `booking_id`（UUID）で予約1件を取得
- [x] .ics形式に変換して返す

#### .ics生成共通 → `src/lib/calendar/ics.ts`
- [x] VCALENDAR / VEVENT生成ユーティリティ
- [x] VEVENTに含める情報: サービス名・事業主名・開始/終了日時・料金

#### Flex Messageへのボタン追加
- [x] 予約確定通知テンプレートに「Googleカレンダー」「Appleカレンダー」ボタン追加
- [ ] リマインダー通知テンプレートにカレンダーボタン追加

#### 予約詳細ページ
- [x] お客さま予約詳細にGoogle/Appleカレンダー追加ボタン
