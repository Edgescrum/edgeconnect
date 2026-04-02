import { ProviderNav } from "./provider-nav";

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProviderNav />
      {children}
    </>
  );
}
