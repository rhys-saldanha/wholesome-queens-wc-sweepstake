import type { PrizeLabel } from "@/lib/types";

const STYLES: Record<PrizeLabel["kind"], string> = {
  champion: "bg-amber-400/20 text-amber-600 dark:text-amber-300 border-amber-400/40",
  runnerUp: "bg-slate-400/20 text-slate-600 dark:text-slate-300 border-slate-400/40",
  woodenSpoon: "bg-rose-400/20 text-rose-600 dark:text-rose-300 border-rose-400/40",
};

function label(prize: PrizeLabel): string {
  switch (prize.kind) {
    case "champion":
      return `🏆 Champion — £${prize.amount}`;
    case "runnerUp":
      return `🥈 Runner-up — £${prize.amount}`;
    case "woodenSpoon":
      return `🥄 Wooden spoon — £${prize.amount}${prize.shared ? " (split)" : ""}`;
  }
}

export function PrizeTag({ prize }: { prize: PrizeLabel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[prize.kind]}`}
    >
      {label(prize)}
    </span>
  );
}
