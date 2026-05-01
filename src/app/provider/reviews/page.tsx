import { resolveUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getProviderReviews } from "@/lib/actions/survey";
import { ReviewManagementClient } from "./review-management-client";

export default async function ProviderReviewsPage() {
  const user = await resolveUser();
  if (!user || user.role !== "provider") redirect("/");

  const reviews = await getProviderReviews();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">口コミ管理</h1>
        <p className="mt-1 text-sm text-muted">
          お客さまからの口コミを確認・管理できます。非表示にしてもCSATスコアには反映され続けます。
        </p>
      </div>
      <ReviewManagementClient reviews={reviews} />
    </div>
  );
}
