import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ServiceForm } from "../../service-form";
import { updateService } from "@/lib/actions/service";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  const { id } = await params;
  const serviceId = parseInt(id, 10);

  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .eq("provider_id", provider.id)
    .single();

  if (!service) notFound();

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-lg sm:max-w-none">
        <div className="hidden sm:mb-6 sm:block">
          <h1 className="text-xl font-bold">メニューを編集</h1>
        </div>
        <div className="sm:max-w-2xl">
        <ServiceForm
          serviceId={serviceId}
          defaultValues={{
            name: service.name,
            caption: service.caption,
            description: service.description,
            duration_min: service.duration_min,
            price: service.price,
            cancel_deadline_hours: service.cancel_deadline_hours,
            cancel_policy_note: service.cancel_policy_note,
            custom_fields: service.custom_fields,
          }}
          onSubmit={async (formData) => {
            "use server";
            await updateService(serviceId, formData);
          }}
          submitLabel="保存する"
        />
        </div>
      </div>
    </main>
  );
}
