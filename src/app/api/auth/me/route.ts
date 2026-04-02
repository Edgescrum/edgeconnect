import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  let provider = null;
  if (user.role === "provider") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("providers")
      .select("slug, name, icon_url")
      .eq("user_id", user.id)
      .single();
    provider = data;
  }

  return NextResponse.json({
    user: {
      id: user.id,
      displayName: user.displayName,
      role: user.role,
    },
    provider,
  });
}
