import { PublicLayout } from "@/components/PublicLayout";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicLayout width="narrow" backHref="/">
      {children}
    </PublicLayout>
  );
}
