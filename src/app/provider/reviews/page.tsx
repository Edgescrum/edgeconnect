import { resolveUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getProviderReviews } from "@/lib/actions/survey";
import { ReviewManagementClient } from "./review-management-client";

export default async function ProviderReviewsPage() {
  const user = await resolveUser();
  if (!user || user.role !== "provider") redirect("/");

  const reviews = await getProviderReviews();

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-8">
      <div>
        <div className="hidden sm:block">
          <h1 className="text-xl font-bold">口コミ管理</h1>
          <p className="mt-1 text-sm text-muted">
            お客さまからの口コミを確認・管理できます
          </p>
        </div>
        <p className="text-sm text-muted sm:hidden">
          {reviews.length}件の口コミ
        </p>
        <ReviewManagementClient reviews={reviews} />
      </div>
    </main>
  );
}
