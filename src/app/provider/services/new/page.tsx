import { resolveUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ServiceForm } from "../service-form";
import { createService } from "@/lib/actions/service";

export default async function NewServicePage() {
  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-lg sm:max-w-none">
        <div className="hidden sm:mb-6 sm:block">
          <h1 className="text-xl font-bold">メニューを追加</h1>
        </div>
        <div className="sm:max-w-2xl">
        <ServiceForm
          onSubmit={async (formData) => {
            "use server";
            await createService(formData);
          }}
          submitLabel="メニューを追加"
        />
        </div>
      </div>
    </main>
  );
}
