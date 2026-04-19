import { LandingPage } from "@/components/LandingPage";
import { FullScreenLoading } from "@/components/FullScreenLoading";
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

  return <LandingPage isLoggedIn={!!user} />;
}
