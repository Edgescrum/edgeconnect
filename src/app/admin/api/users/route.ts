import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// staging 環境のみ許可
function isAllowed() {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV;
  return env !== "production";
}

// GET: ユーザー一覧
export async function GET() {
  if (!isAllowed()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, line_user_id, display_name, role")
    .order("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}

// DELETE: ユーザー削除（id パラメータがあれば個別、なければ全件）
export async function DELETE(request: NextRequest) {
  if (!isAllowed()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const userId = request.nextUrl.searchParams.get("id");

  if (userId) {
    // 個別削除（依存テーブルから順に）
    const id = Number(userId);
    await supabase.from("favorites").delete().eq("user_id", id);
    await supabase.from("bookings").delete().eq("customer_user_id", id);

    // provider として登録している場合
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", id)
      .single();

    if (provider) {
      await supabase.from("favorites").delete().eq("provider_id", provider.id);
      await supabase.from("bookings").delete().eq("provider_id", provider.id);
      await supabase.from("blocked_slots").delete().eq("provider_id", provider.id);
      await supabase.from("services").delete().eq("provider_id", provider.id);
      await supabase.from("provider_settings").delete().eq("provider_id", provider.id);
      await supabase.from("providers").delete().eq("id", provider.id);
    }

    await supabase.from("users").delete().eq("id", id);

    return NextResponse.json({ message: `ユーザー ID:${id} と関連データを削除しました` });
  } else {
    // 全件削除
    await supabase.from("favorites").delete().neq("id", 0);
    await supabase.from("bookings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("blocked_slots").delete().neq("id", 0);
    await supabase.from("services").delete().neq("id", 0);
    await supabase.from("provider_settings").delete().neq("provider_id", 0);
    await supabase.from("providers").delete().neq("id", 0);
    await supabase.from("users").delete().neq("id", 0);

    return NextResponse.json({ message: "全ユーザーと関連データを削除しました" });
  }
}
