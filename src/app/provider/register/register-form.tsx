"use client";

import { useState } from "react";
import { registerProvider, checkSlugAvailability } from "@/lib/actions/provider";
import { useRouter } from "next/navigation";
import { useLiff } from "@/components/LiffProvider";

export function RegisterForm() {
  const { user } = useLiff();
  const router = useRouter();
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toLowerCase().trim();
    if (!value || value.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const available = await checkSlugAvailability(value);
    setSlugStatus(available ? "available" : "taken");
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    try {
      await registerProvider(formData);
      router.push("/provider/qrcode");
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="slug" className="mb-1 block text-sm font-medium">
          スラッグ（URL用ID）
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          pattern="^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$"
          placeholder="yamada-salon"
          onChange={handleSlugChange}
          className="w-full rounded-lg border px-3 py-2"
        />
        {slugStatus === "checking" && (
          <p className="mt-1 text-sm text-gray-500">確認中...</p>
        )}
        {slugStatus === "available" && (
          <p className="mt-1 text-sm text-green-600">利用可能です</p>
        )}
        {slugStatus === "taken" && (
          <p className="mt-1 text-sm text-red-600">既に使われています</p>
        )}
      </div>

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          屋号
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={user?.displayName || ""}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium">
          プロフィール文
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="icon" className="mb-1 block text-sm font-medium">
          アイコン画像
        </label>
        <input
          id="icon"
          name="icon"
          type="file"
          accept="image/*"
          className="w-full"
        />
      </div>

      <div>
        <label
          htmlFor="line_contact_url"
          className="mb-1 block text-sm font-medium"
        >
          個人LINE URL（必須）
        </label>
        <input
          id="line_contact_url"
          name="line_contact_url"
          type="url"
          required
          defaultValue={user ? `https://line.me/ti/p/~${user.lineUserId}` : ""}
          placeholder="https://line.me/ti/p/xxxxx"
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || slugStatus === "taken"}
        className="w-full rounded-lg bg-black py-3 font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "登録中..." : "登録する"}
      </button>
    </form>
  );
}
