import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { RegisterWizard } from "./register-wizard";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return <RegisterWizard />;
}
