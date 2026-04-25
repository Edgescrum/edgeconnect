import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
};

export default function CommercialTransactionPage() {
  return (
    <article className="legal-document space-y-8 text-sm leading-relaxed text-foreground/90">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">
          特定商取引法に基づく表記
        </h1>
        <p className="mt-2 text-xs text-muted">最終更新日: 2026年4月24日</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <tbody className="divide-y divide-border">
            <tr>
              <th className="w-1/3 py-3 pr-4 text-left align-top font-medium">
                販売業者
              </th>
              <td className="py-3">Edgescrum</td>
            </tr>
            <tr>
              <th className="py-3 pr-4 text-left align-top font-medium">
                代表者
              </th>
              <td className="py-3">
                請求があった場合に遅滞なく開示いたします
              </td>
            </tr>
            <tr>
              <th className="py-3 pr-4 text-left align-top font-medium">
                所在地
              </th>
              <td className="py-3">
                請求があった場合に遅滞なく開示いたします
              </td>
            </tr>
            <tr>
              <th className="py-3 pr-4 text-left align-top font-medium">
                連絡先
              </th>
              <td className="py-3">
                メール: contact@edgescrum.com
                <br />
                <span className="text-xs text-muted">
                  ※お問い合わせはメールにてお願いいたします
                </span>
              </td>
            </tr>
            <tr>
              <th className="py-3 pr-4 text-left align-top font-medium">
                販売価格
              </th>
              <td className="py-3">
                <ul className="space-y-1">
                  <li>ベーシックプラン: 500円/月（税込）</li>
                  <li>スタンダードプラン: 980円/月（税込）</li>
                  <li>チームプラン: 3,980円/月（税込）（近日公開）</li>
                </ul>
              </td>
            </tr>
            <tr>
              <th className="py-3 pr-4 text-left align-top font-medium">
                販売価格以外の必要料金
              </th>
              <td className="py-3">
                インターネット接続料金、通信料金等はお客様のご負担となります。
              </td>
            </tr>
            <tr>
              <th className="py-3 pr-4 text-left align-top font-medium">
                支払方法
              </th>
              <td className="py-3">
                クレジットカード（Stripe経由）
              </td>
            </tr>
            <tr>
              <th className="py-3 pr-4 text-left align-top font-medium">
                支払時期
              </th>
              <td className="py-3">
                登録時に初回決済が行われ、以降毎月自動更新されます。スタンダードプランは初回1ヶ月間の無料トライアル後に課金が開始されます。
              </td>
            </tr>
            <tr>
              <th className="py-3 pr-4 text-left align-top font-medium">
                サービス提供時期
              </th>
              <td className="py-3">
                決済完了後、直ちにサービスをご利用いただけます。
              </td>
            </tr>
            <tr>
              <th className="py-3 pr-4 text-left align-top font-medium">
                返品・キャンセル
              </th>
              <td className="py-3">
                デジタルサービスの性質上、購入後の返金はお受けしておりません。ただし、サービスに重大な不具合がある場合は個別に対応いたします。
              </td>
            </tr>
            <tr>
              <th className="py-3 pr-4 text-left align-top font-medium">
                解約方法
              </th>
              <td className="py-3">
                サービス内の管理画面（プラン管理ページ）からいつでも解約できます。解約後も現在の請求期間末日まで有料プランの機能をご利用いただけます。
              </td>
            </tr>
            <tr>
              <th className="py-3 pr-4 text-left align-top font-medium">
                動作環境
              </th>
              <td className="py-3">
                LINEアプリ（iOS/Android）の最新版、および主要なWebブラウザ（Chrome、Safari等）
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">以上</p>
    </article>
  );
}
