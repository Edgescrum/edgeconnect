import { headers } from "next/headers";
import { LpDesignB } from "@/components/lp/LpDesignB";
import { resolveUser } from "@/lib/auth/session";
import { isMobileUserAgent } from "@/lib/device";

export const metadata = {
  title: "PeCo LP - Design B",
};

export default async function LpBPage() {
  const user = await resolveUser();
  const headersList = await headers();
  const isMobile = isMobileUserAgent(headersList.get("user-agent"));

  return <LpDesignB isLoggedIn={!!user} role={user?.role} isMobile={isMobile} />;
}
