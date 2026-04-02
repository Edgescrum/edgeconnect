import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">事業主登録</h1>
      <RegisterForm />
    </main>
  );
}
