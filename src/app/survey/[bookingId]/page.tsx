import { resolveUser } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { getSurveyDetail } from "@/lib/actions/survey";
import { SurveyFormClient } from "./survey-form-client";
import Link from "next/link";

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const user = await resolveUser();
  if (!user) redirect("/");

  const { bookingId } = await params;
  const detail = await getSurveyDetail(bookingId);
  if (!detail) notFound();

  if (detail.isResponded) {
    return (
      <main className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
            <Link href="/surveys" className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            </Link>
            <h1 className="text-base font-semibold">アンケート</h1>
          </div>
        </header>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="mb-4 text-4xl">&#x2705;</div>
          <p className="text-lg font-semibold">回答済みです</p>
          <p className="mt-2 text-sm text-muted">このアンケートは既に回答済みです。</p>
          <Link href="/surveys" className="mt-6 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-white">
            アンケート一覧に戻る
          </Link>
        </div>
      </main>
    );
  }

  if (detail.isExpired) {
    return (
      <main className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
            <Link href="/surveys" className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            </Link>
            <h1 className="text-base font-semibold">アンケート</h1>
          </div>
        </header>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="mb-4 text-4xl">&#x23F0;</div>
          <p className="text-lg font-semibold">回答期限を過ぎました</p>
          <p className="mt-2 text-sm text-muted">このアンケートの回答期限は終了しました。</p>
          <Link href="/surveys" className="mt-6 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-white">
            アンケート一覧に戻る
          </Link>
        </div>
      </main>
    );
  }

  return <SurveyFormClient detail={detail} />;
}
