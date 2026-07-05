"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start gap-4 px-4 py-10 sm:px-6">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-foreground/60">
        The page hit an unexpected error rendering the sweepstake. This isn&apos;t the usual
        &quot;live scores unavailable&quot; case — that&apos;s handled inline on the page itself.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm font-medium hover:bg-foreground/5"
      >
        Try again
      </button>
    </main>
  );
}
