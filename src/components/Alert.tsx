export function Alert({ type, children }: { type: "error" | "success"; children: React.ReactNode }) {
  const styles = {
    error: "bg-red-50 text-red-600",
    success: "bg-green-50 text-green-600",
  }[type];

  return (
    <div className={`rounded-xl px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
