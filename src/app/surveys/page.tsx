import { resolveUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getSurveyPortalData } from "@/lib/actions/survey";
import { SurveyPortalClient } from "./survey-portal-client";
import { PublicFooter } from "@/components/PublicFooter";
import { ChevronLeftIcon } from "@/components/icons";
import Link from "next/link";

export default async function SurveysPage() {
  const user = await resolveUser();
  if (!user) redirect("/");

  const groups = await getSurveyPortalData();

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-8">
          <Link href="/home" className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg">
            <ChevronLeftIcon size={20} />
          </Link>
          <h1 className="text-base font-semibold">アンケート</h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:px-8 sm:py-6">
        <SurveyPortalClient groups={groups} />
      </div>

      <PublicFooter maxWidth="max-w-5xl" />
    </main>
  );
}
