import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { ALL_COUNTRIES } from "@/lib/country-options";

interface CountryMultiSelectProps {
  selected: string[];
  onChange: (newSelected: string[]) => void;
  placeholder?: string;
  countries?: string[];
}

export function CountryMultiSelect({
  selected,
  onChange,
  placeholder = "Select countries…",
  countries,
}: CountryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sortedList = useMemo(() => {
    const base = countries ?? ALL_COUNTRIES;
    return [...base].sort((a, b) => a.localeCompare(b));
  }, [countries]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  const toggle = (value: string) => {
    if (value === "Open to all") {
      onChange(selected.includes("Open to all") ? [] : ["Open to all"]);
    } else {
      const without = selected.filter(v => v !== "Open to all");
      onChange(without.includes(value) ? without.filter(v => v !== value) : [...without, value]);
    }
  };

  const isOpenToAll = selected.includes("Open to all") || selected.length === 0;
  const realCountries = selected.filter(v => v !== "Open to all");

  const buttonLabel = () => {
    if (isOpenToAll) return <span className="text-muted-foreground text-sm">{selected.includes("Open to all") ? "Open to all" : placeholder}</span>;
    if (realCountries.length === 1) return <span className="text-sm font-medium">{realCountries[0]}</span>;
    const shown = realCountries.slice(0, 2).join(", ");
    const extra = realCountries.length - 2;
    return (
      <span className="text-sm font-medium">
        {shown}{extra > 0 ? ` +${extra} more` : ""}
      </span>
    );
  };

  const filtered = sortedList.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger row — split into two sibling buttons to avoid nesting */}
      <div className="w-full flex items-center rounded-xl bg-background border border-border focus-within:border-primary">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex-1 min-w-0 px-4 py-2.5 text-left flex items-center gap-2 focus:outline-none"
        >
          <span className="flex-1 min-w-0 truncate">{buttonLabel()}</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
        </button>
        {realCountries.length > 0 && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange([]); }}
            className="px-3 py-2.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
            aria-label="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type to filter countries…"
              className="w-full px-3 py-2 text-sm rounded-lg bg-secondary/30 border border-border focus:outline-none focus:border-primary"
            />
          </div>

          <ul className="max-h-56 overflow-y-auto">
            {/* Open to all — always at top, hidden when search is active */}
            {!search && (
              <li>
                <button
                  type="button"
                  onClick={() => toggle("Open to all")}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-secondary transition-colors border-b border-border/50 ${
                    selected.includes("Open to all") ? "font-semibold text-primary bg-primary/5" : "text-muted-foreground"
                  }`}
                >
                  Open to all
                  {selected.includes("Open to all") && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              </li>
            )}

            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">No countries found</li>
            ) : (
              filtered.map(c => {
                const isSelected = realCountries.includes(c);
                return (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-secondary transition-colors ${
                        isSelected ? "font-semibold text-primary bg-primary/5" : ""
                      }`}
                    >
                      {c}
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
