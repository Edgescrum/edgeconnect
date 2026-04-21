# リファクタリングチケット

## Phase 1（完了）

- [x] icons.tsx: SVGアイコン11種を集約
- [x] Spinner.tsx: sm/md/lgサイズ対応
- [x] Alert.tsx: error/successタイプ対応
- [x] upload.ts: MAX_ICON_SIZE/ALLOWED_IMAGE_TYPES/validateImageFile()集約
- [x] redirect.ts: ALLOWED_REDIRECT_PREFIXESホワイトリスト集約
- [x] brand.ts: line色追加
- [x] 16ファイルのインラインSVG/スピナー/アラート/カラーを共通コンポーネントに置換
- [x] provider.tsのアップロードバリデーション2箇所を統合

---

## Phase 2（完了）

### RF-1: キャンセルボタン統合
- [x] `src/components/CancelBookingButton.tsx` 作成（customer/provider variant）
- [x] `src/app/bookings/[id]/page.tsx` を新コンポーネントに置換
- [x] `src/app/provider/bookings/[id]/page.tsx` を新コンポーネントに置換

### RF-2: Provider型定義の集約
- [x] `src/lib/types/provider.ts` 作成（ProviderBase/ProviderProfile）
- [x] `src/app/dashboard-client.tsx` のインライン型を共通型に置換
- [x] `src/app/provider/dashboard-content.tsx` のインライン型を共通型に置換

### RF-3: FormInput/FormLabelコンポーネント
- [x] `src/components/FormField.tsx` 作成（FormLabel/FormInput/FormTextarea）
- [x] settings-form, profile-edit-form, register-wizard, service-form, booking-flowに適用

### RF-4: 連絡方法トグルUI統合
- [x] `src/components/ContactMethodToggles.tsx` 作成
- [x] profile-edit-form, register-wizard（PC+モバイル）に適用

---

## Phase 3（完了）

### RF-5: Modalコンポーネント
- [x] `src/components/Modal.tsx` 作成（position="center"/"bottom"対応）
- [x] CancelBookingButton, LoginRequired, profile-edit-form, service-formに適用

### RF-6: 残りのSpinner/Alert/Icon置き換え
- [x] service-form — Spinner, Alert置換
- [x] booking-flow — Spinner, Alert置換
- [x] dashboard-client — GearIcon, SearchIcon, CalendarIcon, ChevronRightIcon置換
- [x] bookings/page — ChevronLeftIcon置換
- [x] explore-client — SearchIcon, ChevronRightIcon置換
- [x] booking-flow — ChevronLeftIcon, ChevronRightIcon置換
