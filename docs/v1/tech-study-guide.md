# EdgeConnect 技術学習ガイド

このプロジェクトで使用した技術の中から、特に学びの多いポイントをまとめる。

---

## 1. Next.js App Router (v16)

### Server Component vs Client Component

```
Server Component (デフォルト)
├── async/await でデータ取得可能
├── DB・API キーに直接アクセス可能
├── クライアントにJSを送らない（軽量）
└── useState / useEffect 使用不可

Client Component ("use client" 宣言)
├── ブラウザで実行
├── useState / useEffect / イベントハンドラ使用可能
└── import したモジュールもすべてクライアントバンドルに含まれる
```

**本プロジェクトでの使い分け**:
- データ取得・認証チェック → Server Component (`provider/page.tsx`)
- フォーム・インタラクション → Client Component (`schedule-editor.tsx`)
- LINE アプリ判定 → Server Component で `headers()` から User-Agent を取得

### Server Actions ("use server")

従来の API Route を書かずに、フォーム送信やデータ変更を処理できる。

```typescript
// lib/actions/service.ts
"use server";

export async function createService(formData: FormData) {
  const provider = await getProviderId(); // 認証チェック
  const supabase = await createClient();  // RLS適用クライアント

  const name = formData.get("name") as string;
  // ... バリデーション

  await supabase.from("services").insert({ ... });
  revalidatePath("/provider/services"); // キャッシュ無効化
}
```

**学びポイント**:
- Server Action は POST リクエストとして直接呼び出し可能 → **必ず認証チェックを入れる**
- `revalidatePath` で関連ページのキャッシュを無効化する
- FormData をそのまま受け取れるので、フォームとの相性が良い

### Middleware (proxy.ts)

```typescript
// すべてのリクエストで実行される
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(URL, KEY, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        // request と response の両方に cookie をセット
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser(); // JWT リフレッシュ
  return supabaseResponse;
}
```

**学びポイント**:
- Server Component は cookie を直接書き込めない → Middleware でセッションリフレッシュが必須
- `supabaseResponse` を新しい `NextResponse.next()` で上書きする際、cookie を必ずコピーする
- `getUser()` の前に他の処理を挟まない（ランダムログアウトの原因）

### params の Promise 化 (Next.js 16)

```typescript
// Next.js 16 では params は Promise
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // await が必要
}
```

---

## 2. Supabase

### Row Level Security (RLS)

RLS はテーブルレベルのアクセス制御。SQL ポリシーで「誰が」「何を」できるかを定義する。

```sql
-- 自分の予約のみ読める
CREATE POLICY "bookings_select_customer" ON bookings
  FOR SELECT
  USING (
    customer_user_id IN (
      SELECT id FROM users WHERE auth_uid = auth.uid()
    )
  );

-- 公開サービスは誰でも読める
CREATE POLICY "services_select_published" ON services
  FOR SELECT
  USING (is_published = true);
```

**学びポイント**:
- `auth.uid()` は JWT から自動的に取得される Supabase Auth のユーザーID
- `USING` 句が WHERE 句として自動追加される
- SECURITY DEFINER 関数は RLS をバイパスする（内部的にはスーパーユーザーとして実行）
- anon key のクライアントは RLS を通る、service_role key は RLS をバイパスする

### SECURITY DEFINER 関数

RLS を有効にしつつ、複雑なビジネスロジックを安全に実行するパターン。

```sql
CREATE OR REPLACE FUNCTION create_booking(
  p_provider_id INT,
  p_service_id INT,
  p_customer_line_user_id TEXT,
  p_start_at TIMESTAMPTZ,
  p_customer_name TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- ← 関数オーナーの権限で実行 (RLSバイパス)
AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  -- 排他ロック: 同じ provider の同時予約を防ぐ
  PERFORM 1 FROM providers WHERE id = p_provider_id FOR UPDATE;

  -- 重複チェック、空き枠検証...

  INSERT INTO bookings (...) VALUES (...) RETURNING id INTO v_booking_id;
  RETURN json_build_object('id', v_booking_id);
END;
$$;
```

**学びポイント**:
- クライアントから RPC で呼ぶ: `supabase.rpc("create_booking", { ... })`
- 関数内ではすべてのテーブルにアクセス可能（RLS無視）
- `FOR UPDATE` でレコードロック → 同時予約防止
- 入力バリデーションは関数内で行う（クライアントを信頼しない）

### Supabase Auth とカスタムテーブルの橋渡し

```
Supabase Auth (auth.users)        カスタム (public.users)
┌──────────────────┐              ┌──────────────────┐
│ id (UUID)        │──────────────│ auth_uid (UUID)   │
│ email            │              │ line_user_id      │
│ encrypted_pass   │              │ display_name      │
└──────────────────┘              │ role              │
                                  └──────────────────┘
```

- Supabase Auth はセッション管理・JWT発行を担当
- ビジネスデータは `public.users` テーブルで管理
- `auth_uid` カラムで両者を紐づけ
- RLS ポリシーで `auth.uid() = auth_uid` を使って認可

---

## 3. LINE LIFF SDK

### 初期化パターン

```typescript
const liff = (await import("@line/liff")).default;
await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

if (liff.isLoggedIn()) {
  const accessToken = liff.getAccessToken();
  // サーバーに送信して認証
}
```

**学びポイント**:
- `import("@line/liff")` で動的インポート（SSR でエラーにならない）
- `liff.init()` は1回だけ呼ぶ（2回呼ぶと警告）
- accessToken は LINE サーバーに対するトークン → 自サーバーで LINE Profile API を呼んで検証

### LINE アプリ判定

```typescript
// Server Component で User-Agent から判定
const ua = headersList.get("user-agent") || "";
const isLineApp = /\bLine\b/i.test(ua) || /\bLIFF\b/i.test(ua);
```

**用途**: LINE アプリ内では `<a>` タグで直接遷移、ブラウザではモーダル表示など UI を分岐。

### Flex Message テンプレート

```typescript
// templates.ts - 宣言的なJSON構造
export function bookingConfirmedCustomer(params) {
  return {
    type: "bubble",
    header: {
      type: "box", layout: "vertical",
      backgroundColor: "#6366f1",
      contents: [{ type: "text", text: "予約が確定しました", color: "#ffffff" }]
    },
    body: {
      type: "box", layout: "vertical",
      contents: [
        detailRow("サービス", params.serviceName),
        detailRow("日時", params.dateStr),
        // ...
      ]
    },
    footer: {
      type: "box", layout: "vertical",
      contents: [
        { type: "button", action: { type: "uri", label: "予約を確認する", uri: params.detailUrl } }
      ]
    }
  };
}
```

**学びポイント**:
- Flex Message は JSON で UI を定義（JSX ではない）
- `type: "bubble"` が1つのカード、`type: "carousel"` で複数カード
- `action: { type: "uri" }` でタップ時のURLを指定
- [LINE Flex Message Simulator](https://developers.line.biz/flex-message-simulator/) でプレビュー可能

### Webhook 署名検証

```typescript
const signature = request.headers.get("x-line-signature");
const body = await request.text();
const hash = createHmac("sha256", LINE_CHANNEL_SECRET)
  .update(body)
  .digest("base64");

if (hash !== signature) {
  return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
}
```

**学びポイント**:
- LINE は Webhook リクエストに HMAC-SHA256 署名を付与する
- `x-line-signature` ヘッダーの値と、自前で計算したハッシュを比較
- 不一致なら偽装リクエスト → 403 で拒否

---

## 4. React パターン

### cache() によるリクエスト内重複排除

```typescript
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // ...
});
```

**学びポイント**:
- 同じリクエスト内で複数回呼ばれても、実際の実行は1回だけ
- Server Component のレンダリング中に有効
- `cache()` はリクエストをまたがない（各リクエストでリセット）

### IntersectionObserver による無限スクロール

```typescript
const sentinelRef = useRef<HTMLDivElement>(null);
const [visibleCount, setVisibleCount] = useState(20);

useEffect(() => {
  if (!sentinelRef.current || !hasMore) return;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) setVisibleCount((c) => c + 20);
    },
    { rootMargin: "200px" } // 200px手前で先読み
  );
  observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, [hasMore, visibleCount]);

// JSX
{visible.map((item) => <Card key={item.id} />)}
{hasMore && <div ref={sentinelRef}><Spinner /></div>}
```

**学びポイント**:
- `rootMargin: "200px"` でスクロール到達前に先読み → カクつき防止
- `visibleCount` の変化で effect が再実行 → 新しい sentinel を observe
- フィルター変更時に `setVisibleCount(20)` でリセット

### sticky の落とし穴

```css
/* sticky が効かないケース */
.parent {
  overflow: hidden; /* ← これがあると sticky は効かない */
}

/* body の flex も影響する場合がある */
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* ↑ 子要素のスクロールコンテナが body ではなくなる可能性 */
}
```

**本プロジェクトでの対処**:
- `body` から `flex flex-col` を削除
- sticky 要素の `top` 値をヘッダー高さに合わせる（`top-[49px]`）
- 親に `overflow: hidden/auto` がないことを確認

---

## 5. セキュリティ

### 修正した脆弱性

| 脆弱性 | 内容 | 対策 |
|--------|------|------|
| ユーザー偽装 | `/api/auth/me?lineUserId=xxx` で他人になりすまし | クエリパラメータを廃止、cookie のみで認証 |
| auth_uid 未設定 | upsert が fire-and-forget で auth_uid が null | `await` に変更、email 正規化 |
| RLS 未適用 | 全ページが adminClient (RLSバイパス) を使用 | 16ファイルを anon client に切り替え |

### httpOnly Cookie

```typescript
response.cookies.set("line_user_id", lineUserId, {
  httpOnly: true,    // JavaScript からアクセス不可
  secure: true,      // HTTPS のみ
  sameSite: "lax",   // CSRF 対策
  maxAge: 30 * 24 * 60 * 60, // 30日
  path: "/",
});
```

**学びポイント**:
- `httpOnly: true` → `document.cookie` で読めない → XSS で盗めない
- `secure: true` → HTTP では送信されない
- `sameSite: "lax"` → 外部サイトからの POST では送信されない (CSRF 対策)

---

## 6. iCal (カレンダー連携)

### iCal フォーマット (RFC 5545)

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EdgeConnect//Booking//JA
BEGIN:VEVENT
UID:booking-uuid@edgeconnect
DTSTART:20260404T100000+0900
DTEND:20260404T110000+0900
SUMMARY:事業主名（サービス名）
DESCRIPTION:料金: ¥5,000
END:VEVENT
END:VCALENDAR
```

**配信方式**:
- **事業主向け**: `webcal://` URLをカレンダーアプリに登録 → アプリが定期ポーリング
- **顧客向け**: Flex Message のボタンから Google Calendar URL or `.ics` ファイルに1件ずつ追加

### Google Calendar URL 生成

```typescript
export function generateGoogleCalendarUrl(title, startAt, endAt, details) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleDate(startAt)}/${formatGoogleDate(endAt)}`,
    details: details,
  });
  return `https://calendar.google.com/calendar/r/eventedit?${params}`;
}
```

---

## 7. Tailwind CSS v4

### カスタムテーマ設定

```css
/* globals.css */
@import "tailwindcss";

:root {
  --background: #f8fafc;
  --accent: #6366f1;
  --success: #06C755; /* LINE グリーン */
}

@theme inline {
  --color-background: var(--background);
  --color-accent: var(--accent);
  --color-success: var(--success);
}
```

**学びポイント**:
- Tailwind v4 では `@theme inline` でカスタムカラーを定義
- `tailwind.config.js` は不要（CSS ファイルで完結）
- クラス名で直接使用: `bg-accent`, `text-success`

### モバイル最適化テクニック

```css
/* iOS で input フォーカス時のズーム防止 */
input, textarea, select {
  font-size: 16px; /* 16px 以上でズームしない */
}

/* タッチフィードバック */
-webkit-tap-highlight-color: transparent;

/* safe-area (ノッチ対応) */
padding-bottom: env(safe-area-inset-bottom);
```

---

## 8. 開発環境

### Cloudflare Tunnel (cloudflared)

LIFF は HTTPS 必須のため、ローカル開発では Cloudflare Tunnel を使用。

```bash
cloudflared tunnel --url http://localhost:3000
```

- ngrok の代替（ngrok はインタースティシャルページが JS をブロックする）
- 発行された URL を LIFF の Endpoint URL に設定
- 無料で利用可能

### 環境変数の管理

```
.env.local          # ローカル開発用（git 管理外）
Vercel Settings      # 本番環境用
```

- `NEXT_PUBLIC_*` はクライアントに公開される → 秘密情報を入れない
- `SUPABASE_SERVICE_ROLE_KEY` はサーバー専用 → 絶対にクライアントに露出させない
