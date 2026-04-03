import { BookingWithModal } from "./line-modal";

// Server Component（JSに依存しない）
export function BookingButton({
  slug,
  serviceId,
  isLineApp,
}: {
  slug: string;
  serviceId: number;
  isLineApp: boolean;
}) {
  const returnUrl = `/p/${slug}/book/${serviceId}`;
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const lineAppUrl = `line://app/${liffId}?path=${encodeURIComponent(returnUrl)}`;

  // LINEアプリ内: 直接予約ページへ（<a>タグ、JS不要）
  if (isLineApp) {
    return (
      <a
        href={returnUrl}
        className="mt-3 flex w-full items-center justify-center rounded-xl bg-accent-bg py-2.5 text-sm font-semibold text-accent active:scale-[0.98]"
      >
        予約する
      </a>
    );
  }

  // 外部ブラウザ: ボタンタップ → モーダル → LINEアプリで開く
  return <BookingWithModal lineAppUrl={lineAppUrl} />;
}
