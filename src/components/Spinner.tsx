export function Spinner({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClass = {
    sm: "h-4 w-4 border-2",
    md: "h-5 w-5 border-2",
    lg: "h-8 w-8 border-3",
  }[size];

  return (
    <span className={`inline-block animate-spin rounded-full border-accent border-t-transparent ${sizeClass} ${className}`} />
  );
}
