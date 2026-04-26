import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminClient } from "./admin-client";

export const metadata: Metadata = {
  title: "Admin - Dev Tools",
  robots: "noindex, nofollow",
};

export default function AdminPage() {
  // staging 環境のみ表示（VERCEL_ENV が preview または development の場合）
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV;
  if (env === "production") {
    redirect("/");
  }

  return <AdminClient />;
}
