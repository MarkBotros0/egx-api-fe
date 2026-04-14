"use client";

const INDICES = ["EGX30", "EGX70", "EGX100", "NILEX", "All"];

interface IndexFilterProps {
  selected: string;
  onChange: (index: string) => void;
}

export default function IndexFilter({ selected, onChange }: IndexFilterProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
      {INDICES.map((idx) => (
        <button
          key={idx}
          onClick={() => onChange(idx)}
          className={`min-h-[36px] whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            selected === idx
              ? "bg-accent/20 text-accent"
              : "text-white/40 hover:bg-white/5 hover:text-white/60"
          }`}
        >
          {idx}
        </button>
      ))}
    </div>
  );
}
