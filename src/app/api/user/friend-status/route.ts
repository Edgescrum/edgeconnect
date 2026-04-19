import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json({ isLineFriend: false }, { status: 401 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("is_line_friend")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    isLineFriend: data?.is_line_friend ?? false,
  });
}
