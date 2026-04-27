"use client";

import { Toggle } from "@/components/Toggle";
import { LineIcon, EmailIcon, PhoneIcon } from "@/components/icons";
import { formatPhoneAsYouType } from "@/lib/phone";
import { isValidEmail } from "@/lib/validation/email";

export interface ContactMethodState {
  lineEnabled: boolean;
  lineId: string;
  emailEnabled: boolean;
  contactEmail: string;
  phoneEnabled: boolean;
  contactPhone: string;
}

interface ContactMethodTogglesProps {
  state: ContactMethodState;
  onChange: (state: ContactMethodState) => void;
  showValidationError?: boolean;
}

export function ContactMethodToggles({
  state,
  onChange,
  showValidationError,
}: ContactMethodTogglesProps) {
  function update(partial: Partial<ContactMethodState>) {
    onChange({ ...state, ...partial });
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium">お客さまからの連絡方法</p>
      <p className="mb-3 text-xs text-muted">
        お客さまの予約詳細画面に連絡ボタンが表示されます
      </p>

      {showValidationError && (
        <p className="mb-3 text-sm text-red-600">連絡方法を1つ以上設定してください</p>
      )}

      <div className="space-y-3">
        {/* LINE */}
        <div
          className={`rounded-2xl p-4 ring-1 transition-colors ${
            state.lineEnabled
              ? "bg-green-50/50 ring-success/30"
              : "bg-card ring-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
                <LineIcon size={18} />
              </div>
              <p className="text-sm font-semibold">LINEで連絡</p>
            </div>
            <Toggle
              checked={state.lineEnabled}
              onChange={(checked) => update({ lineEnabled: checked })}
              ariaLabel="LINEで連絡を有効にする"
            />
          </div>
          {state.lineEnabled && (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-muted">@</span>
                <input
                  name="line_id"
                  type="text"
                  value={state.lineId}
                  onChange={(e) =>
                    update({ lineId: e.target.value.replace(/^@/, "") })
                  }
                  placeholder="your-line-id"
                  required
                  className="w-full rounded-xl border border-border bg-white px-4 py-3"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                LINEアプリの設定 &gt; プロフィール &gt; LINE IDで確認できます
              </p>
            </div>
          )}
          <input
            type="hidden"
            name="line_enabled"
            value={state.lineEnabled ? "1" : "0"}
          />
        </div>

        {/* メール */}
        <div
          className={`rounded-2xl p-4 ring-1 transition-colors ${
            state.emailEnabled
              ? "bg-blue-50/50 ring-blue-300/30"
              : "bg-card ring-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <EmailIcon size={18} className="text-blue-500" />
              </div>
              <p className="text-sm font-semibold">メールで連絡</p>
            </div>
            <Toggle
              checked={state.emailEnabled}
              onChange={(checked) => update({ emailEnabled: checked })}
              activeColor="bg-success"
              ariaLabel="メールで連絡を有効にする"
            />
          </div>
          {state.emailEnabled && (
            <div className="mt-3">
              <input
                name="contact_email"
                type="email"
                value={state.contactEmail}
                onChange={(e) => update({ contactEmail: e.target.value })}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-border bg-white px-4 py-3"
              />
              {state.contactEmail && !isValidEmail(state.contactEmail) && (
                <p className="mt-1.5 text-xs text-red-500">
                  正しいメールアドレスの形式で入力してください
                </p>
              )}
            </div>
          )}
          <input
            type="hidden"
            name="email_enabled"
            value={state.emailEnabled ? "1" : "0"}
          />
        </div>

        {/* 電話 */}
        <div
          className={`rounded-2xl p-4 ring-1 transition-colors ${
            state.phoneEnabled
              ? "bg-orange-50/50 ring-orange-300/30"
              : "bg-card ring-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                <PhoneIcon size={18} className="text-orange-500" />
              </div>
              <p className="text-sm font-semibold">電話で連絡</p>
            </div>
            <Toggle
              checked={state.phoneEnabled}
              onChange={(checked) => update({ phoneEnabled: checked })}
              activeColor="bg-success"
              ariaLabel="電話で連絡を有効にする"
            />
          </div>
          {state.phoneEnabled && (
            <div className="mt-3">
              <input
                name="contact_phone"
                type="tel"
                value={state.contactPhone}
                onChange={(e) =>
                  update({ contactPhone: formatPhoneAsYouType(e.target.value) })
                }
                placeholder="090-1234-5678"
                inputMode="tel"
                required
                className="w-full rounded-xl border border-border bg-white px-4 py-3"
              />
            </div>
          )}
          <input
            type="hidden"
            name="phone_enabled"
            value={state.phoneEnabled ? "1" : "0"}
          />
        </div>
      </div>
    </div>
  );
}
