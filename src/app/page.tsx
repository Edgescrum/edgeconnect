import { LandingPage } from "@/components/LandingPage";
import { FullScreenLoading } from "@/components/FullScreenLoading";
import { LiffGate } from "./liff-gate";
import { resolveUser } from "@/lib/auth/session";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  // LIFF ログイン処理中（code パラメータあり = LINE Login からの戻り）
  if (params.code || params.liffClientId) {
    return <FullScreenLoading />;
  }

  const user = await resolveUser();

  return (
    <LiffGate fallback={<FullScreenLoading />}>
      <LandingPage isLoggedIn={!!user} role={user?.role} />
    </LiffGate>
  );
}
