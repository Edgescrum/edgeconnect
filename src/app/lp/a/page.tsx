import { headers } from "next/headers";
import { LpDesignA } from "@/components/lp/LpDesignA";
import { resolveUser } from "@/lib/auth/session";
import { isMobileUserAgent } from "@/lib/device";

export const metadata = {
  title: "PeCo LP - Design A",
};

export default async function LpAPage() {
  const user = await resolveUser();
  const headersList = await headers();
  const isMobile = isMobileUserAgent(headersList.get("user-agent"));

  return <LpDesignA isLoggedIn={!!user} role={user?.role} isMobile={isMobile} />;
}
