// Server Component（JSに依存しない純粋な<a>タグ）
// LINEアプリ判定はサーバーサイドで行い、propsとして渡される
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

  // LINEアプリ内: 直接予約ページへ
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

  // 外部ブラウザ: line://スキームでLINEアプリを起動
  return (
    <a
      href={lineAppUrl}
      className="mt-3 flex w-full items-center justify-center rounded-xl bg-accent-bg py-2.5 text-sm font-semibold text-accent active:scale-[0.98]"
    >
      予約する
    </a>
  );
}
