import { useState, useRef, useEffect, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "@/lib/api-url";

export interface ChipGroup {
  group: string;
  options: string[];
}

interface AutocompleteSuggestion {
  display_value: string;
  normalized_value: string;
}

interface CustomChipSelectProps {
  selected: string[];
  onChange: (values: string[]) => void;
  presets?: string[];
  groups?: ChipGroup[];
  fieldType: "heritage" | "faith" | string;
  multiSelect?: boolean;
  allowCustom?: boolean;
  customPlaceholder?: string;
}

export function CustomChipSelect({
  selected,
  onChange,
  presets,
  groups,
  fieldType,
  multiSelect = true,
  allowCustom = true,
  customPlaceholder = "Type to search or create...",
}: CustomChipSelectProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allPresetValues = [
    ...(presets ?? []),
    ...(groups?.flatMap(g => g.options) ?? []),
  ];

  const toggle = (value: string) => {
    if (multiSelect) {
      onChange(selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value]);
    } else {
      onChange(selected.includes(value) ? [] : [value]);
    }
  };

  const remove = (value: string) => {
    onChange(selected.filter(v => v !== value));
  };

  const fetchSuggestions = useCallback(async (prefix: string) => {
    if (!prefix.trim()) { setSuggestions([]); setShowDropdown(false); return; }
    try {
      const token = localStorage.getItem("da_token");
      const res = await fetch(
        `${API_BASE}/api/custom-values?field_type=${fieldType}&prefix=${encodeURIComponent(prefix)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.values ?? []);
        setShowDropdown(true);
      }
    } catch {
      setSuggestions([]);
    }
  }, [fieldType]);

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(inputVal), 200);
    return () => clearTimeout(timer);
  }, [inputVal, fetchSuggestions]);

  const saveCustomValue = async (displayValue: string, normalizedValue?: string) => {
    try {
      const token = localStorage.getItem("da_token");
      await fetch(`${API_BASE}/api/custom-values`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ field_type: fieldType, display_value: displayValue, normalized_value: normalizedValue }),
      });
    } catch {}
  };

  const addCustom = async (displayValue: string, normalizedValue?: string) => {
    const val = displayValue.trim();
    if (!val) return;
    const titleCased = val.replace(/\b\w/g, c => c.toUpperCase());
    if (!selected.includes(titleCased)) {
      onChange([...selected, titleCased]);
      await saveCustomValue(titleCased, normalizedValue);
    }
    setInputVal("");
    setSuggestions([]);
    setShowDropdown(false);
    setShowInput(false);
  };

  // Close on outside click
  useEffect(() => {
    if (!showInput) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowInput(false);
        setInputVal("");
        setSuggestions([]);
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showInput]);

  const customSelected = selected.filter(v => !allPresetValues.includes(v));

  const renderChip = (value: string, isSelected: boolean, onClick: () => void, removable = false) => (
    <button
      key={value}
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
        isSelected
          ? "bg-primary text-white border-primary"
          : "bg-white border-border hover:border-primary/40 text-foreground"
      }`}
    >
      {value}
      {removable && isSelected && (
        <span
          role="button"
          onClick={e => { e.stopPropagation(); remove(value); }}
          className="leading-none opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </span>
      )}
    </button>
  );

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Grouped presets */}
      {groups?.map(group => (
        <div key={group.group}>
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">{group.group}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.options.map(option =>
              renderChip(option, selected.includes(option), () => toggle(option))
            )}
          </div>
        </div>
      ))}

      {/* Flat presets */}
      {presets && !groups && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map(option =>
            renderChip(option, selected.includes(option), () => toggle(option))
          )}
        </div>
      )}

      {/* Custom selected chips (not in presets) */}
      {customSelected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customSelected.map(val => (
            <span
              key={val}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-full text-sm font-medium border border-primary"
            >
              {val}
              <button
                type="button"
                onClick={() => remove(val)}
                className="opacity-70 hover:opacity-100 transition-opacity leading-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add custom entry */}
      {allowCustom && (
        <div className="relative">
          <AnimatePresence initial={false}>
            {!showInput ? (
              <motion.button
                key="add-btn"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowInput(true);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5 mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add custom</span>
              </motion.button>
            ) : (
              <motion.div
                key="input-area"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="mt-1"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputVal}
                      onChange={e => setInputVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") { e.preventDefault(); if (inputVal.trim()) addCustom(inputVal); }
                        if (e.key === "Escape") { setShowInput(false); setInputVal(""); setSuggestions([]); setShowDropdown(false); }
                      }}
                      placeholder={customPlaceholder}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/30 border border-border text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                    {/* Autocomplete dropdown */}
                    {showDropdown && (suggestions.length > 0 || inputVal.trim()) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-30 overflow-hidden">
                        {suggestions.slice(0, 5).map(sug => (
                          <button
                            key={sug.display_value}
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => addCustom(sug.display_value, sug.normalized_value)}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors flex items-center justify-between"
                          >
                            <span>{sug.display_value}</span>
                            {sug.normalized_value !== sug.display_value && (
                              <span className="text-xs text-muted-foreground ml-2 shrink-0">→ {sug.normalized_value}</span>
                            )}
                          </button>
                        ))}
                        {inputVal.trim() && !suggestions.some(s => s.display_value.toLowerCase() === inputVal.toLowerCase()) && (
                          <button
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => addCustom(inputVal)}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors text-primary font-medium border-t border-border/50"
                          >
                            Create &ldquo;{inputVal.trim()}&rdquo;
                          </button>
                        )}
                      </div>
                    )}
                    {inputVal.trim() && !showDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-30">
                        <button
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => addCustom(inputVal)}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors text-primary font-medium"
                        >
                          Create &ldquo;{inputVal.trim()}&rdquo;
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => inputVal.trim() && addCustom(inputVal)}
                    className="px-3 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowInput(false); setInputVal(""); setSuggestions([]); setShowDropdown(false); }}
                    className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
