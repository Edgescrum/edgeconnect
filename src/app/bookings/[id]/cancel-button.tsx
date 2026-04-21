"use client";

import { useState } from "react";
import { cancelBooking } from "@/lib/actions/booking";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";

export function CancelButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setError(null);
    setCancelling(true);
    try {
      await cancelBooking(bookingId);
      router.refresh();
      setShowConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "キャンセルに失敗しました");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full rounded-xl border border-red-200 py-3.5 text-sm font-medium text-red-500 active:scale-[0.98]"
      >
        予約をキャンセル
      </button>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} position="bottom">
        <h3 className="text-lg font-bold">予約をキャンセルしますか？</h3>
        <p className="mt-2 text-sm text-muted">
          この操作は元に戻せません。
        </p>
        {error && (
          <div className="mt-3">
            <Alert type="error">{error}</Alert>
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={cancelling}
            className="flex-1 rounded-xl border border-border py-3 font-semibold active:scale-[0.98]"
          >
            戻る
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-3 font-semibold text-white active:scale-[0.98]"
          >
            {cancelling && (
              <Spinner size="sm" className="border-white border-t-transparent" />
            )}
            {cancelling ? "処理中..." : "キャンセルする"}
          </button>
        </div>
      </Modal>
    </>
  );
}
