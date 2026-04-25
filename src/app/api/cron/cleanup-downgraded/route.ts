import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushFlexMessage } from "@/lib/line/messaging";
import { log, logError } from "@/lib/log";

/**
 * ST-8: ダウングレード後3ヶ月経過したスタンダード機能データを削除するcronジョブ
 *
 * 対象データ:
 * - 顧客メモ（Sprint 4で作成予定）
 * - 通知テンプレート（Sprint 3で作成予定）
 * - 分析設定（Sprint 4で作成予定）
 *
 * 実行タイミング: 毎日 03:00 UTC (12:00 JST)
 */
export async function GET(request: Request) {
  // Vercel Cronからの呼び出しを検証
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    // 3ヶ月前の日付を計算
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // ダウングレード後3ヶ月経過した事業主を取得
    const { data: providers, error } = await supabase
      .from("providers")
      .select("id, user_id, name, downgraded_at")
      .not("downgraded_at", "is", null)
      .lt("downgraded_at", threeMonthsAgo.toISOString())
      .eq("plan", "basic");

    if (error) {
      logError("cron/cleanup-downgraded", "Failed to fetch providers", error);
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    if (!providers || providers.length === 0) {
      log("cron/cleanup-downgraded", "No providers to clean up");
      return NextResponse.json({ cleaned: 0 });
    }

    let cleanedCount = 0;

    for (const provider of providers) {
      try {
        // TODO: Sprint 3-6 で作成されるテーブルのデータを削除
        // 以下のテーブルが作成されたら、ここに削除処理を追加する:
        //
        // - notification_templates (Sprint 3: 通知テンプレート)
        //   await supabase.from("notification_templates").delete().eq("provider_id", provider.id);
        //
        // - customer_notes (Sprint 4: 顧客メモ)
        //   await supabase.from("customer_notes").delete().eq("provider_id", provider.id);
        //
        // - analytics_settings (Sprint 4: 分析設定)
        //   await supabase.from("analytics_settings").delete().eq("provider_id", provider.id);

        // downgraded_at をクリア（削除完了フラグ）
        await supabase
          .from("providers")
          .update({ downgraded_at: null })
          .eq("id", provider.id);

        // 事業主にLINE通知
        const { data: user } = await supabase
          .from("users")
          .select("line_user_id")
          .eq("id", provider.user_id)
          .single();

        if (user?.line_user_id) {
          const appUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            "https://peco.edgescrum.com";
          await pushFlexMessage(
            user.line_user_id,
            "データ削除のお知らせ",
            {
              type: "bubble",
              body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                contents: [
                  {
                    type: "text",
                    text: "データ削除のお知らせ",
                    weight: "bold",
                    size: "lg",
                  },
                  {
                    type: "text",
                    text: "ダウングレードから3ヶ月が経過したため、スタンダードプラン専用データを削除しました。",
                    size: "sm",
                    wrap: true,
                    color: "#666666",
                  },
                  {
                    type: "text",
                    text: "再度スタンダードプランにアップグレードすることで、新しくデータを作成できます。",
                    size: "xs",
                    wrap: true,
                    color: "#999999",
                    margin: "md",
                  },
                ],
              },
              footer: {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                contents: [
                  {
                    type: "button",
                    action: {
                      type: "uri",
                      label: "プラン管理を開く",
                      uri: `${appUrl}/provider/billing`,
                    },
                    style: "primary",
                    color: "#6366F1",
                  },
                ],
              },
            }
          );
        }

        cleanedCount++;
        log("cron/cleanup-downgraded", "Cleaned provider data", {
          providerId: provider.id,
        });
      } catch (err) {
        logError(
          "cron/cleanup-downgraded",
          `Failed to clean provider ${provider.id}`,
          err
        );
      }
    }

    log("cron/cleanup-downgraded", "Cleanup completed", {
      total: providers.length,
      cleaned: cleanedCount,
    });

    return NextResponse.json({
      cleaned: cleanedCount,
      total: providers.length,
    });
  } catch (error) {
    logError("cron/cleanup-downgraded", "Cron job failed", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
