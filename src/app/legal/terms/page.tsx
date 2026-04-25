import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約",
};

export default function TermsPage() {
  return (
    <article className="legal-document space-y-8 text-sm leading-relaxed text-foreground/90">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">利用規約</h1>
        <p className="mt-2 text-xs text-muted">最終更新日: 2026年4月24日</p>
      </div>

      <p>
        本利用規約（以下「本規約」）は、Edgescrum（以下「当社」）が提供するPeCo（以下「本サービス」）の利用条件を定めるものです。本サービスをご利用いただくすべてのユーザー（以下「ユーザー」）に適用されます。
      </p>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第1条（サービスの定義）</h2>
        <p>本サービスは、個人事業主（以下「事業主」）がLINE公式アカウントを起点に予約受付・スケジュール管理を行うためのプラットフォームです。予約者（以下「お客さん」）は、事業主が提供するサービスをLINE経由で予約できます。</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第2条（アカウント登録）</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>本サービスの利用にはLINEアカウントが必要です。</li>
          <li>ユーザーは正確な情報を登録し、常に最新の状態を維持する義務を負います。</li>
          <li>アカウントの管理責任はユーザーにあり、第三者への譲渡・貸与はできません。</li>
          <li>事業主として登録する場合、事業活動に必要な連絡先情報の登録が必須です。</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第3条（サービス料金・プラン）</h2>
        <p>事業主向けに以下のプランを提供します。</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-left font-medium">プラン</th>
                <th className="py-2 pr-4 text-left font-medium">月額料金</th>
                <th className="py-2 text-left font-medium">備考</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr><td className="py-2 pr-4">ベーシック</td><td className="py-2 pr-4">500円/月</td><td className="py-2">基本的な予約管理機能</td></tr>
              <tr><td className="py-2 pr-4">スタンダード</td><td className="py-2 pr-4">980円/月</td><td className="py-2">初月無料トライアル付き</td></tr>
              <tr><td className="py-2 pr-4">チーム</td><td className="py-2 pr-4">3,980円/月</td><td className="py-2">マルチスタッフ対応（近日公開）</td></tr>
            </tbody>
          </table>
        </div>
        <ol className="list-decimal space-y-1 pl-5">
          <li>料金の支払いはクレジットカード（Stripe経由）で行います。</li>
          <li>スタンダードプランの初回登録時は1ヶ月間の無料トライアルが適用され、トライアル期間終了後に自動的に課金が開始されます。</li>
          <li>料金は税込み表示です。</li>
          <li>当社は、事前に通知の上、料金を変更する場合があります。</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第4条（プラン変更・解約）</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>アップグレード（ベーシック → スタンダード）は即時反映されます。</li>
          <li>ダウングレード（スタンダード → ベーシック）は現在の請求期間の末日に反映されます。</li>
          <li>解約後も現在の請求期間末日まで有料プランの機能をご利用いただけます。</li>
          <li>解約はサービス内の管理画面からいつでも行えます。</li>
          <li>ダウングレード後3ヶ月間は有料プランのデータを保持します。3ヶ月を過ぎると自動的に削除されます。</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第5条（禁止事項）</h2>
        <p>ユーザーは以下の行為をしてはなりません。</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>法令または公序良俗に違反する行為</li>
          <li>犯罪行為に関連する行為</li>
          <li>当社または第三者の知的財産権を侵害する行為</li>
          <li>当社または第三者の名誉・信用を毀損する行為</li>
          <li>本サービスの運営を妨害する行為</li>
          <li>不正アクセスやそれを試みる行為</li>
          <li>他のユーザーの情報を不正に収集する行為</li>
          <li>他のユーザーになりすます行為</li>
          <li>虚偽の情報を登録する行為</li>
          <li>本サービスを営利目的で転売・再販する行為</li>
          <li>反社会的勢力に関連する行為</li>
          <li>その他、当社が不適切と判断する行為</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第6条（口コミ・レビュー）</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>お客さんがアンケート回答時に公開を許可した場合、回答内容が口コミとして公開されることがあります。</li>
          <li>以下に該当する口コミは、当社の判断で非表示にすることがあります。
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>誹謗中傷・差別的表現を含むもの</li>
              <li>個人情報を含むもの</li>
              <li>事実と異なる内容</li>
              <li>広告・スパムに該当するもの</li>
              <li>法令に違反するもの</li>
            </ul>
          </li>
          <li>事業主は、不適切な口コミについて当社に非表示を申請できます。</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第7条（サービスの変更・停止）</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>当社は、以下の場合にサービスの全部または一部を停止することがあります。
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>システムの保守・更新を行う場合</li>
              <li>天災・障害等によりサービス提供が困難な場合</li>
              <li>その他、当社が必要と判断した場合</li>
            </ul>
          </li>
          <li>サービスの停止によりユーザーに損害が生じた場合でも、当社は責任を負いません。</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第8条（退会）</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>お客さんが退会した場合、予約履歴は匿名化して保持します。</li>
          <li>事業主が退会した場合、未来の予約についてお客さんにキャンセル通知を送信し、30日後にデータを削除します。</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第9条（免責事項）</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>当社は、本サービスの内容・品質について、明示・黙示を問わず一切の保証をしません。</li>
          <li>事業主とお客さん間のトラブルについて、当社は一切の責任を負いません。</li>
          <li>事業主が提供するサービスの品質・安全性について、当社は保証しません。</li>
          <li>LINE APIの仕様変更・障害によるサービスへの影響について、当社は責任を負いません。</li>
          <li>Stripeの決済処理に起因する問題について、当社はStripeの規約に従い対応しますが、直接的な責任は負いません。</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第10条（規約の変更）</h2>
        <p>当社は、必要に応じて本規約を変更することがあります。変更後の規約は、本サービス上で通知した時点から効力を生じます。重要な変更がある場合は、LINEメッセージまたはサービス内通知にてお知らせします。</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第11条（準拠法・管轄裁判所）</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>本規約の解釈は日本法に準拠します。</li>
          <li>本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第12条（お問い合わせ）</h2>
        <div className="rounded-xl border border-border bg-card p-4 text-xs sm:text-sm">
          <p className="font-medium">Edgescrum</p>
          <p className="mt-1">メール: contact@edgescrum.com</p>
        </div>
      </section>

      <p className="text-xs text-muted">以上</p>
    </article>
  );
}
