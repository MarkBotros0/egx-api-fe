"use client";

const SECTORS = [
  "All Sectors",
  "Banking",
  "Real Estate",
  "Financial Services",
  "Industrials",
  "Consumer Goods",
  "Basic Materials",
  "Healthcare",
  "Technology",
  "Energy",
  "Telecommunications",
];

interface SectorFilterProps {
  selected: string;
  onChange: (sector: string) => void;
}

export default function SectorFilter({ selected, onChange }: SectorFilterProps) {
  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-accent/50"
    >
      {SECTORS.map((s) => (
        <option key={s} value={s} className="bg-charcoal">
          {s}
        </option>
      ))}
    </select>
  );
}
