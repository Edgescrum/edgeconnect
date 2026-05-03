import { headers } from "next/headers";
import { LpDesignC } from "@/components/lp/LpDesignC";
import { resolveUser } from "@/lib/auth/session";
import { isMobileUserAgent } from "@/lib/device";

export const metadata = {
  title: "PeCo LP - Design C",
};

export default async function LpCPage() {
  const user = await resolveUser();
  const headersList = await headers();
  const isMobile = isMobileUserAgent(headersList.get("user-agent"));

  return <LpDesignC isLoggedIn={!!user} role={user?.role} isMobile={isMobile} />;
}
