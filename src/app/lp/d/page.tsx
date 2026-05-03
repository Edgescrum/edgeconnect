import { headers } from "next/headers";
import { LpDesignD } from "@/components/lp/LpDesignD";
import { resolveUser } from "@/lib/auth/session";
import { isMobileUserAgent } from "@/lib/device";

export const metadata = {
  title: "PeCo LP - Design D",
};

export default async function LpDPage() {
  const user = await resolveUser();
  const headersList = await headers();
  const isMobile = isMobileUserAgent(headersList.get("user-agent"));

  return <LpDesignD isLoggedIn={!!user} role={user?.role} isMobile={isMobile} />;
}
