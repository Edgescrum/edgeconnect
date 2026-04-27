import { resolveUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getFavorites } from "@/lib/actions/favorite";
import { getCategories } from "@/lib/constants/categories";
import { FavoritesClient } from "./favorites-client";
import { PublicLayout } from "@/components/PublicLayout";

export default async function FavoritesPage() {
  const user = await resolveUser();
  if (!user) redirect("/");

  const [{ favorites }, categories] = await Promise.all([
    getFavorites(),
    getCategories(),
  ]);

  return (
    <PublicLayout backHref="/home" title="お気に入り">
      <FavoritesClient
        initialFavorites={favorites}
        categories={categories}
      />
    </PublicLayout>
  );
}
