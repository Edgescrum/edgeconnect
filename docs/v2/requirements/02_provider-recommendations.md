# おすすめ他事業者（事業者間コミュニティー）

## 概要
事業主が他の事業主を「おすすめ」として紹介する機能。信頼の連鎖で新規顧客を獲得するための仕組み。

### コンセプト
- SEOに頼らない集客チャネル
- 金銭的インセンティブではなく「口コミ・信頼」ベース
- 「この人が信頼しているならここにいきたい」とユーザーに思わせる

## 要件

### 基本仕様
| 項目 | 内容 |
|------|------|
| 仕組み | 事業主が手動で他事業主を選択 |
| 方向性 | 一方向（AがBをおすすめ → AのページにBが表示） |
| おすすめ理由 | 任意テキスト・50文字（例：「ネイルならこの方。繊細なデザインが得意です」） |
| 選択方法 | 事業主名/スラッグで検索 |
| 閲覧 | 全ユーザー（未ログイン含む） |

### プラン別上限
| プラン | おすすめ登録 | おすすめされる |
|--------|:-----------:|:------------:|
| ベーシック（¥500） | × | ○ |
| スタンダード（¥980） | 最大5件 | ○ |
| プロ（¥1,980） | 無制限 | ○ |

### 表示場所
1. **事業主プロフィールページ**（`/p/[slug]`）— メニュー一覧の下に「おすすめの事業主を見る →」リンク
2. **おすすめ専用ページ**（`/p/[slug]/recommended`）— アイコン・名前・カテゴリ・bio・おすすめ理由
3. **予約完了画面** — 「この事業主がおすすめする他のサービス」セクション

### おすすめランキング
- `/explore` でおすすめ数が多い事業主を上位表示
- 検索結果のソートに「おすすめ数」を加味

### コミュニティバッジ
事業主名の横に表示。事業主プロフィールページと`/explore`一覧カードの両方に表示。

| バッジ | 条件 | アイコン |
|--------|------|---------|
| 銅冠 | 3人以上からおすすめ | 🥉 |
| 銀冠 | 5人以上からおすすめ | 🥈 |
| 金冠 | 10人以上からおすすめ | 🥇 |

### 効果の可視化
- 管理画面で「おすすめ経由の予約数」を表示

## データモデル

```sql
CREATE TABLE provider_recommendations (
  id serial PRIMARY KEY,
  provider_id int NOT NULL REFERENCES providers(id),
  recommended_provider_id int NOT NULL REFERENCES providers(id),
  reason text CHECK (char_length(reason) <= 50),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, recommended_provider_id),
  CHECK (provider_id != recommended_provider_id)
);

ALTER TABLE provider_recommendations ENABLE ROW LEVEL SECURITY;
```

### バッジ用ビュー（参考）
```sql
CREATE VIEW provider_recommendation_counts AS
SELECT
  recommended_provider_id AS provider_id,
  COUNT(*) AS recommendation_count,
  CASE
    WHEN COUNT(*) >= 10 THEN 'gold'
    WHEN COUNT(*) >= 5 THEN 'silver'
    WHEN COUNT(*) >= 3 THEN 'bronze'
    ELSE NULL
  END AS badge
FROM provider_recommendations
GROUP BY recommended_provider_id;
```

## 実装チケット

### RC-1: DBテーブル・ビュー作成
- [ ] `provider_recommendations` テーブル作成
- [ ] `provider_recommendation_counts` ビュー作成
- [ ] RLSポリシー設定（自分のおすすめのみ書き込み可能、全員閲覧可能）

### RC-2: おすすめ管理 Server Action
- [ ] `addRecommendation(providerId, reason?)` — おすすめ追加
- [ ] `removeRecommendation(recommendedProviderId)` — おすすめ解除
- [ ] `getMyRecommendations()` — 自分のおすすめ一覧取得
- [ ] `searchProvidersForRecommendation(query)` — おすすめ候補検索
- [ ] プラン別上限チェック（スタンダード: 5件、プロ: 無制限）

### RC-3: 管理画面 — おすすめ事業主管理ページ
- [ ] `/provider/recommendations/page.tsx` 新規作成
- [ ] おすすめ済み一覧（理由表示・編集・削除・並び替え）
- [ ] 追加モーダル（事業主検索 + 理由入力）
- [ ] プラン別上限表示（「あと○件追加可能」）
- [ ] ProviderNavにメニュー追加

### RC-4: 事業主プロフィールページにリンク追加
- [ ] `/p/[slug]/page.tsx` メニュー一覧の下に「おすすめの事業主を見る →」リンク
- [ ] おすすめが0件の場合はリンク非表示

### RC-5: おすすめ専用ページ
- [ ] `/p/[slug]/recommended/page.tsx` 新規作成
- [ ] おすすめ事業主カード（アイコン・名前・カテゴリ・bio・おすすめ理由）
- [ ] タップで各事業主ページへ遷移

### RC-6: 予約完了画面におすすめ表示
- [ ] `booking-flow.tsx` 完了ステップにおすすめ事業主セクション追加
- [ ] おすすめが0件の場合は非表示

### RC-7: コミュニティバッジ
- [ ] バッジコンポーネント作成（銅🥉/銀🥈/金🥇）
- [ ] `/p/[slug]/page.tsx` 事業主名の横にバッジ表示
- [ ] `/explore` 一覧カードにバッジ表示
- [ ] `get_provider_profile` RPCにおすすめ数を含める

### RC-8: おすすめランキング（Explore連携）
- [ ] `search_providers` RPCにおすすめ数によるソートを追加
- [ ] `/explore` のデフォルトソートにおすすめ数を加味

### RC-9: 効果の可視化
- [ ] 管理画面ダッシュボードに「おすすめ経由の予約数」表示
- [ ] おすすめリンクにトラッキングパラメータ付与（`?ref=recommend`）
- [ ] 予約時にリファラを記録
