export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="h-8 w-72 animate-pulse rounded bg-foreground/10" />
      <div className="h-64 w-full animate-pulse rounded-lg bg-foreground/5" />
      <div className="h-96 w-full animate-pulse rounded-lg bg-foreground/5" />
    </main>
  );
}
