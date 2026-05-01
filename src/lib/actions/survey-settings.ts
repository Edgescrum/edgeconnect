"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProviderId } from "@/lib/auth/provider-session";
import { revalidatePath } from "next/cache";

export interface TemplateQuestion {
  id: number;
  category: string;
  questionText: string;
  sortOrder: number;
}

export interface ProviderSurveySetting {
  id: number;
  templateQuestionId: number;
  customText: string | null;
  sortOrder: number;
  originalText: string;
}

/** プランチェック: standard 以上が必要 */
async function requireStandard() {
  const supabase = await createClient();
  const provider = await getProviderId();
  const { data } = await supabase
    .from("providers")
    .select("plan, category")
    .eq("id", provider.id)
    .single();

  if (!data || data.plan === "basic") {
    throw new Error("この機能はスタンダードプラン以上でご利用いただけます");
  }
  return { ...provider, plan: data.plan, category: data.category };
}

/** 業界別テンプレート設問を取得 */
export async function getTemplateQuestions(category: string): Promise<TemplateQuestion[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("survey_template_questions")
    .select("id, category, question_text, sort_order")
    .eq("category", category)
    .eq("is_active", true)
    .order("sort_order");

  return (data || []).map((q) => ({
    id: q.id as number,
    category: q.category as string,
    questionText: q.question_text as string,
    sortOrder: q.sort_order as number,
  }));
}

/** 事業主が選択中のテンプレート設問を取得 */
export async function getProviderSurveySettings(): Promise<ProviderSurveySetting[]> {
  const provider = await requireStandard();
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("provider_survey_settings")
    .select(`
      id, template_question_id, custom_text, sort_order,
      survey_template_questions:template_question_id ( question_text )
    `)
    .eq("provider_id", provider.id)
    .order("sort_order");

  return (data || []).map((s) => {
    const templateQ = Array.isArray(s.survey_template_questions)
      ? s.survey_template_questions[0]
      : s.survey_template_questions;
    return {
      id: s.id as number,
      templateQuestionId: s.template_question_id as number,
      customText: s.custom_text as string | null,
      sortOrder: s.sort_order as number,
      originalText: (templateQ as Record<string, unknown>)?.question_text as string || "",
    };
  });
}

/** テンプレート設問を選択（最大3つまで） */
export async function saveProviderSurveySettings(
  selections: { templateQuestionId: number; customText: string | null; sortOrder: number }[]
): Promise<{ success: boolean; error?: string }> {
  const provider = await requireStandard();

  if (selections.length > 3) {
    return { success: false, error: "追加設問は最大3つまでです" };
  }

  const supabase = createAdminClient();

  // 既存の設定を削除
  await supabase
    .from("provider_survey_settings")
    .delete()
    .eq("provider_id", provider.id);

  // 新規追加
  if (selections.length > 0) {
    const inserts = selections.map((s) => ({
      provider_id: provider.id,
      template_question_id: s.templateQuestionId,
      custom_text: s.customText?.trim() || null,
      sort_order: s.sortOrder,
    }));

    const { error } = await supabase
      .from("provider_survey_settings")
      .insert(inserts);

    if (error) {
      console.error("[survey-settings] save error:", error);
      return { success: false, error: "保存に失敗しました" };
    }
  }

  revalidatePath("/provider/survey-settings");
  return { success: true };
}
