import { headers } from "next/headers";
import { LpDesignE } from "@/components/lp/LpDesignE";
import { resolveUser } from "@/lib/auth/session";
import { isMobileUserAgent } from "@/lib/device";

export const metadata = {
  title: "PeCo LP - Design E",
};

export default async function LpEPage() {
  const user = await resolveUser();
  const headersList = await headers();
  const isMobile = isMobileUserAgent(headersList.get("user-agent"));

  return <LpDesignE isLoggedIn={!!user} role={user?.role} isMobile={isMobile} />;
}
