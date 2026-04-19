import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const response = NextResponse.json({ status: "ok" });
  response.cookies.delete("line_user_id");
  return response;
}
