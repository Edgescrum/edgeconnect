import { ProviderNav } from "./provider-nav";
import { ProviderSidebar } from "./provider-sidebar";

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background sm:flex">
      {/* PC: サイドバー */}
      <ProviderSidebar />
      {/* モバイル: ヘッダーナビ */}
      <ProviderNav />
      <div className="mx-auto max-w-5xl flex-1 sm:min-w-0">
        {children}
      </div>
    </div>
  );
}
