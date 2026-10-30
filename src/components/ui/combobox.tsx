"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  badge?: string | number;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
}

export function Combobox({
  options = [],
  value = "",
  onChange,
  placeholder = "Seleccionar opción...",
  searchPlaceholder = "Buscar...",
  emptyText = "No se encontraron resultados",
  disabled = false,
  className,
  allowClear = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [mounted, setMounted] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [coords, setCoords] = React.useState<{
    top: number;
    left: number;
    width: number;
    placeAbove: boolean;
    maxHeight: number;
  }>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
    maxHeight: 360,
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = React.useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Flip above if space below is limited (< 280px) and there's more space above
    const placeAbove = spaceBelow < 280 && spaceAbove > spaceBelow;
    const availableHeight = placeAbove ? spaceAbove - 20 : spaceBelow - 20;
    const dropdownMaxHeight = Math.max(220, Math.min(380, availableHeight));

    // Ensure left does not exceed viewport bounds
    const width = Math.max(rect.width, 280);
    let left = rect.left;
    if (left + width > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - width - 16);
    }
    if (left < 16) left = 16;

    setCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left,
      width,
      placeAbove,
      maxHeight: dropdownMaxHeight,
    });
  }, []);

  // Update position on scroll/resize and on open
  React.useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScroll = (e: Event) => {
        if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
          return;
        }
        updateCoords();
      };
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", updateCoords);
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", updateCoords);
      };
    }
  }, [isOpen, updateCoords]);

  // Close when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  React.useEffect(() => {
    if (isOpen) {
      setSearch("");
      const timer = setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const selectedOption = React.useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  );

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label?.toLowerCase().includes(q) ||
        opt.value?.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [options, search]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", isOpen ? "z-50" : "z-10", className)}
    >
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            updateCoords();
            setIsOpen((prev) => !prev);
          }
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-neutral-200/90 bg-white px-3.5 py-2 text-sm text-neutral-900 shadow-2xs transition-all cursor-pointer",
          "hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/10",
          disabled && "cursor-not-allowed opacity-50 bg-neutral-100",
          isOpen && "border-neutral-900 ring-2 ring-neutral-900/10"
        )}
      >
        <span className={cn("truncate font-medium text-left", !selectedOption && "text-neutral-400 font-normal")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {allowClear && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="rounded-full p-1 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-4 text-neutral-400 transition-transform duration-200",
              isOpen && "rotate-180 text-neutral-800"
            )}
          />
        </div>
      </button>

      {/* DROPDOWN MENU RENDERED IN PORTAL TO ESCAPE MODAL CLIPPING */}
      {isOpen && mounted && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[99999] rounded-2xl border border-neutral-200/90 bg-white p-2.5 shadow-2xl animate-in fade-in-0 zoom-in-95 flex flex-col"
          style={{
            top: coords.placeAbove ? undefined : `${coords.top}px`,
            bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : undefined,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxHeight: `${coords.maxHeight}px`,
          }}
        >
          {/* SEARCH INPUT */}
          <div className="relative mb-2 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setIsOpen(false);
                }
              }}
              className="w-full rounded-xl bg-neutral-50 border border-neutral-200/90 pl-8.5 pr-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
            />
          </div>

          {/* LONG OPTIONS LIST */}
          <div
            className="overflow-y-auto space-y-1 pr-1 flex-1"
            style={{ maxHeight: `${Math.max(160, coords.maxHeight - 65)}px` }}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400 font-medium">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-colors text-left cursor-pointer",
                      isSelected
                        ? "bg-neutral-900 text-white font-semibold shadow-xs"
                        : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="truncate leading-snug">{opt.label}</div>
                      {opt.description && (
                        <div
                          className={cn(
                            "text-[10px] truncate mt-0.5",
                            isSelected ? "text-white/70" : "text-neutral-400"
                          )}
                        >
                          {opt.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge != null && (
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-neutral-100 text-neutral-700 border border-neutral-200/60"
                          )}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="size-3.5 text-lime-400 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
