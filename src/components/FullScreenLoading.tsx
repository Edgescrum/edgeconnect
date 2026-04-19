export function FullScreenLoading({ message = "読み込み中..." }: { message?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white shadow-lg">
          E
        </div>
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted">{message}</p>
        </div>
      </div>
    </main>
  );
}
