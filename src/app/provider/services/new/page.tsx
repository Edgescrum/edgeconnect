import { resolveUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ServiceForm } from "../service-form";
import { createService } from "@/lib/actions/service";

export default async function NewServicePage() {
  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        <ServiceForm
          onSubmit={async (formData) => {
            "use server";
            await createService(formData);
          }}
          submitLabel="メニューを追加"
        />
      </div>
    </main>
  );
}
