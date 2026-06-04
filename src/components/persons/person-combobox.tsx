"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";

export interface PersonOption {
  id: string;
  fullName: string;
  familyName?: string;
}

interface Props {
  options: PersonOption[];
  linkedOptions?: PersonOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function PersonCombobox({
  options,
  linkedOptions = [],
  value,
  onChange,
  placeholder = "— اختر شخصاً —",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find selected person name
  const allOptions = [...options, ...linkedOptions];
  const selectedPerson = allOptions.find((p) => p.id === value);

  // Filter
  const q = query.trim().toLowerCase();
  const filteredOwn = options.filter((p) =>
    p.fullName.toLowerCase().includes(q)
  );

  // Group linked options by familyName
  const linkedGroups: Record<string, PersonOption[]> = {};
  for (const p of linkedOptions) {
    if (!p.fullName.toLowerCase().includes(q)) continue;
    const key = p.familyName ?? "عائلة مرتبطة";
    (linkedGroups[key] ??= []).push(p);
  }
  const hasResults =
    filteredOwn.length > 0 || Object.keys(linkedGroups).length > 0;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setOpen(false);
  }

  function handleOpenToggle() {
    if (disabled) return;
    if (!open) {
      setOpen(true);
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpenToggle}
        disabled={disabled}
        className="h-8 w-full flex items-center gap-1.5 rounded-md border border-input bg-card/60 px-2 text-xs text-start focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selectedPerson ? (
          <>
            <span className="flex-1 truncate">{selectedPerson.fullName}</span>
            {selectedPerson.familyName && (
              <span className="text-muted-foreground text-[10px] shrink-0">
                ({selectedPerson.familyName})
              </span>
            )}
            <X
              className="h-3 w-3 text-muted-foreground hover:text-foreground shrink-0"
              onClick={handleClear}
            />
          </>
        ) : (
          <>
            <span className="flex-1 text-muted-foreground">{placeholder}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
          {/* Search input */}
          <div className="flex items-center gap-1.5 border-b border-border px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم…"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              autoComplete="off"
            />
            {query && (
              <button type="button" title="مسح البحث" onClick={() => setQuery("")}>
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-52 overflow-y-auto py-1">
            {!hasResults ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">لا توجد نتائج</p>
            ) : (
              <>
                {/* Same family */}
                {filteredOwn.length > 0 && (
                  <div>
                    {linkedOptions.length > 0 && (
                      <p className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        نفس العائلة
                      </p>
                    )}
                    {filteredOwn.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelect(p.id)}
                        className={`w-full text-start px-3 py-1.5 text-xs hover:bg-muted/60 transition-colors ${
                          value === p.id ? "bg-muted/80 font-medium" : ""
                        }`}
                      >
                        {p.fullName}
                      </button>
                    ))}
                  </div>
                )}

                {/* Linked families */}
                {Object.entries(linkedGroups).map(([famName, persons]) => (
                  <div key={famName}>
                    <p className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      عائلة {famName}
                    </p>
                    {persons.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelect(p.id)}
                        className={`w-full text-start px-3 py-1.5 text-xs hover:bg-muted/60 transition-colors flex items-center justify-between gap-2 ${
                          value === p.id ? "bg-muted/80 font-medium" : ""
                        }`}
                      >
                        <span>{p.fullName}</span>
                        <span className="text-muted-foreground text-[10px] shrink-0">
                          {famName}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
