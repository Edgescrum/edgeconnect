import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="legal-document space-y-8 text-sm leading-relaxed text-foreground/90">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">プライバシーポリシー</h1>
        <p className="mt-2 text-xs text-muted">最終更新日: 2026年4月24日</p>
      </div>

      <p>
        Edgescrum（以下「当社」）は、PeCo（以下「本サービス」）における個人情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
      </p>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第1条（収集する個人情報の種類）</h2>
        <p>当社は、本サービスの提供にあたり、以下の個人情報を収集します。</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-left font-medium">情報</th>
                <th className="py-2 pr-4 text-left font-medium">取得元</th>
                <th className="py-2 text-left font-medium">利用目的</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr><td className="py-2 pr-4">LINE ID</td><td className="py-2 pr-4">LINEログイン</td><td className="py-2">ユーザー認証・アカウント識別</td></tr>
              <tr><td className="py-2 pr-4">LINE表示名</td><td className="py-2 pr-4">LINEプロフィール</td><td className="py-2">サービス内での表示</td></tr>
              <tr><td className="py-2 pr-4">氏名</td><td className="py-2 pr-4">ユーザー入力</td><td className="py-2">予約管理・本人確認</td></tr>
              <tr><td className="py-2 pr-4">電話番号</td><td className="py-2 pr-4">ユーザー入力</td><td className="py-2">事業主との連絡</td></tr>
              <tr><td className="py-2 pr-4">性別</td><td className="py-2 pr-4">ユーザー入力（任意）</td><td className="py-2">分析・サービス改善</td></tr>
              <tr><td className="py-2 pr-4">生年月日</td><td className="py-2 pr-4">ユーザー入力（任意）</td><td className="py-2">分析・サービス改善</td></tr>
              <tr><td className="py-2 pr-4">予約履歴</td><td className="py-2 pr-4">システム自動記録</td><td className="py-2">サービス提供・分析</td></tr>
              <tr><td className="py-2 pr-4">アンケート回答</td><td className="py-2 pr-4">ユーザー回答</td><td className="py-2">サービス改善・口コミ公開</td></tr>
              <tr><td className="py-2 pr-4">決済情報</td><td className="py-2 pr-4">Stripe</td><td className="py-2">月額課金（当社では保持しません）</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第2条（利用目的）</h2>
        <p>当社は、収集した個人情報を以下の目的で利用します。</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>本サービスの提供・運営・改善</li>
          <li>ユーザー認証およびアカウント管理</li>
          <li>予約の受付・管理・通知の送信</li>
          <li>月額課金の処理（Stripe経由）</li>
          <li>サービスに関するお知らせ・通知の送信</li>
          <li>利用状況の分析・サービス改善</li>
          <li>お問い合わせへの対応</li>
          <li>利用規約違反への対応</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第3条（第三者提供）</h2>
        <p>当社は、以下の場合を除き、ユーザーの同意なく個人情報を第三者に提供しません。</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>法令に基づく場合</li>
          <li>人の生命・身体・財産の保護に必要な場合</li>
          <li>公衆衛生・児童の健全育成に必要な場合</li>
          <li>国の機関等への協力が必要な場合</li>
        </ol>
        <p className="mt-3">なお、本サービスの提供にあたり、以下の外部サービスと情報を連携しています。</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-left font-medium">サービス</th>
                <th className="py-2 pr-4 text-left font-medium">提供元</th>
                <th className="py-2 text-left font-medium">共有する情報</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr><td className="py-2 pr-4">LINE</td><td className="py-2 pr-4">LINEヤフー株式会社</td><td className="py-2">LINE ID・通知送信</td></tr>
              <tr><td className="py-2 pr-4">Stripe</td><td className="py-2 pr-4">Stripe, Inc.</td><td className="py-2">決済処理に必要な情報</td></tr>
              <tr><td className="py-2 pr-4">Supabase</td><td className="py-2 pr-4">Supabase, Inc.</td><td className="py-2">データベース保管</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第4条（個人情報の管理）</h2>
        <p>当社は、個人情報の漏洩・滅失・毀損を防止するため、以下の安全管理措置を講じます。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>SSL/TLSによる通信の暗号化</li>
          <li>データベースへのアクセス制御（RLS）</li>
          <li>決済情報はStripeが管理し、当社サーバーでは保持しません</li>
          <li>定期的なセキュリティ監査の実施</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第5条（データの保持期間）</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>予約データ: 予約完了後1年間保持</li>
          <li>お客さんが退会した場合: 予約履歴は匿名化して保持</li>
          <li>事業主が退会した場合: 未来の予約をキャンセル通知後、30日後にデータ削除</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第6条（開示・訂正・削除の請求）</h2>
        <p>ユーザーは、当社に対して自己の個人情報の開示・訂正・削除を請求できます。請求は下記お問い合わせ窓口までご連絡ください。本人確認の上、合理的な期間内に対応いたします。</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第7条（Cookie・アクセスログ）</h2>
        <p>本サービスでは、ユーザー認証およびセッション管理のためにCookieを使用します。また、サービス改善のためにアクセスログ（IPアドレス・ブラウザ情報・アクセス日時等）を記録する場合があります。</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第8条（本ポリシーの変更）</h2>
        <p>当社は、必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、本サービス上での通知またはLINEメッセージにてお知らせします。</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">第9条（お問い合わせ窓口）</h2>
        <div className="rounded-xl border border-border bg-card p-4 text-xs sm:text-sm">
          <p className="font-medium">Edgescrum</p>
          <p className="mt-1">メール: contact@edgescrum.com</p>
        </div>
      </section>

      <p className="text-xs text-muted">以上</p>
    </article>
  );
}
