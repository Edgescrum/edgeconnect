export function FullScreenLoading({ message = "読み込み中..." }: { message?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <img src="/logo.svg" alt="PeCo" className="mx-auto h-10" />
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted">{message}</p>
        </div>
      </div>
    </main>
  );
}
