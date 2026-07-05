import { resolveTeam } from "@/lib/data/team-lookup";
import { getFlagIconCode } from "@/lib/data/flags";

interface TeamProps {
  teamId: number | null;
  eliminated?: boolean;
  size?: "sm" | "md";
}

export function Team({ teamId, eliminated = false, size = "md" }: TeamProps) {
  const { abbreviation, name, hexColour } = resolveTeam(teamId);
  const flagCode = teamId == null ? null : getFlagIconCode(name);
  const dotColour = eliminated || teamId == null ? null : hexColour;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${
        size === "sm" ? "text-xs" : "text-sm"
      }`}
      title={name}
    >
      <span
        className="inline-block rounded-sm"
        style={{
          width: size === "sm" ? 8 : 10,
          height: size === "sm" ? 8 : 10,
          backgroundColor: dotColour ?? "transparent",
          border: dotColour ? "none" : "1px dashed var(--foreground)",
        }}
      />
      <span className="font-medium tracking-wide">{abbreviation}</span>
      {flagCode && (
        <span
          aria-hidden="true"
          className={`fi fi-${flagCode} rounded-[2px]`}
          style={{ fontSize: size === "sm" ? 11 : 13 }}
        />
      )}
    </span>
  );
}
