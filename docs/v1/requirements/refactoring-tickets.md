# リファクタリングチケット

Phase 1（完了）で共通コンポーネントを作成済み。Phase 2/3はV2の新機能実装時に段階的に対応する。

---

## Phase 2（V2実装時に対応）

### RF-1: キャンセルボタン統合
**工数: 中 | タイミング: V2実装時**
- [ ] `src/app/bookings/[id]/cancel-button.tsx`と`src/app/provider/bookings/[id]/provider-cancel-button.tsx`を1コンポーネントに統合
- [ ] propsで`role`を受け取り、ボタンラベルや確認メッセージを切り替え
- [ ] 統合先: `src/components/CancelBookingButton.tsx`

### RF-2: Provider型定義の集約
**工数: 小 | タイミング: V2実装時**
- [ ] `src/lib/types/provider.ts`を新規作成
- [ ] `ProviderBase`（slug, name, icon_url）と`ProviderProfile`（full）の型を定義
- [ ] 以下のファイルからインライン型定義を削除して共通型を使用:
  - `src/app/provider/dashboard-content.tsx`
  - `src/app/dashboard-client.tsx`
  - `src/app/provider/profile/profile-edit-form.tsx`

### RF-3: FormInput/FormLabelコンポーネント
**工数: 中 | タイミング: V2実装時**
- [ ] `src/components/FormInput.tsx` — `className="w-full rounded-xl border border-border bg-card px-4 py-3"`を内包
- [ ] `src/components/FormLabel.tsx` — `className="mb-1.5 block text-sm font-medium"`を内包
- [ ] 25+箇所の入力パターンを段階的に置き換え
- [ ] 対象ファイル:
  - `src/app/provider/register/register-wizard.tsx`
  - `src/app/provider/profile/profile-edit-form.tsx`
  - `src/app/provider/services/service-form.tsx`
  - `src/app/provider/schedule/schedule-editor.tsx`
  - `src/app/settings/settings-form.tsx`
  - `src/app/p/[slug]/book/[serviceId]/booking-flow.tsx`

### RF-4: 連絡方法トグルUI統合
**工数: 大 | タイミング: V2実装時**
- [ ] `src/components/ContactMethodToggles.tsx`を新規作成
- [ ] LINE/メール/電話のトグルUIを1コンポーネントにまとめる
- [ ] 以下のファイルから重複UIを削除:
  - `src/app/provider/register/register-wizard.tsx`（PC版+モバイル版で2重）
  - `src/app/provider/profile/profile-edit-form.tsx`

---

## Phase 3（V2実装時に対応）

### RF-5: Modalコンポーネント
**工数: 中 | タイミング: V2実装時**
- [ ] `src/components/Modal.tsx`を新規作成
- [ ] `fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4`のオーバーレイを内包
- [ ] 背景クリックで閉じる、ESCで閉じる、アニメーション
- [ ] 以下のファイルで使用:
  - `src/app/bookings/[id]/cancel-button.tsx`
  - `src/app/provider/bookings/[id]/provider-cancel-button.tsx`
  - `src/app/provider/profile/profile-edit-form.tsx`
  - `src/components/LoginRequired.tsx`
  - `src/components/ImageCropper.tsx`

### RF-6: 残りのSpinner/Alert/Icon置き換え
**工数: 小 | タイミング: 各ファイル修正時に都度**
- [ ] `src/app/provider/services/service-form.tsx` — Spinner, Alert
- [ ] `src/app/provider/schedule/schedule-editor.tsx` — Spinner
- [ ] `src/app/p/[slug]/book/[serviceId]/booking-flow.tsx` — Spinner
- [ ] 各ファイルでインラインSVGをicons.tsxのコンポーネントに置き換え（修正時に都度）
