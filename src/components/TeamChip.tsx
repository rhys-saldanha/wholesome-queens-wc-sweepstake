interface TeamChipProps {
  abbreviation: string;
  name: string;
  hexColour: string | null;
  size?: "sm" | "md";
}

export function TeamChip({ abbreviation, name, hexColour, size = "md" }: TeamChipProps) {
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
          backgroundColor: hexColour ?? "transparent",
          border: hexColour ? "none" : "1px dashed var(--foreground)",
        }}
      />
      <span className="font-medium tracking-wide">{abbreviation}</span>
    </span>
  );
}
