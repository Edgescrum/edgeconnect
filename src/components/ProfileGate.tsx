import { headers } from "next/headers";
import { resolveUser } from "@/lib/auth/session";
import { ProfilePromptModal } from "@/components/ProfilePromptModal";

/**
 * ログイン済みの customer で、プロフィール未完了の場合にモーダルを表示する。
 * Server Component として動作し、DB から直接 is_profile_completed を参照する。
 *
 * 対象外:
 * - 未ログインユーザー（公開ページは閲覧可能）
 * - provider ロール（事業主は別フローでプロフィール設定済み）
 * - LP（/）ページ
 */
export async function ProfileGate() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // LP（トップページ）ではモーダルを表示しない
  if (pathname === "/") return null;

  const user = await resolveUser();

  // 未ログイン or 事業主 or プロフィール完了済み → 何も表示しない
  if (!user) return null;
  if (user.role === "provider") return null;
  if (user.isProfileCompleted) return null;

  return <ProfilePromptModal />;
}
