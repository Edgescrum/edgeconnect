import { resolveUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await resolveUser();
  if (!user) redirect("/");

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-8">
          <Link href="/home" className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-base font-semibold">設定</h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:px-8">
        <SettingsForm
          defaultName={user.customerName || ""}
          defaultPhone={user.customerPhone || ""}
          defaultGender={user.gender || ""}
          defaultBirthDate={user.birthDate || ""}
        />
      </div>
    </main>
  );
}
