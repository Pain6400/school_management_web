"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
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
  placeholder = "Seleccionar opcion...",
  searchPlaceholder = "Buscar...",
  emptyText = "No se encontraron resultados",
  disabled = false,
  className,
  allowClear = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropH = 320;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const openAbove = spaceBelow < dropH && rect.top > dropH;
    setDropdownStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    function handleDown(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setIsOpen(false);
    }
    function handleScroll() { updatePosition(); }
    document.addEventListener("mousedown", handleDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  React.useEffect(() => {
    if (isOpen) {
      setSearch("");
      updatePosition();
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen, updatePosition]);

  const selectedOption = React.useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  );

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
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

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) updatePosition();
    setIsOpen((prev) => !prev);
  };

  const dropdown = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-2xl"
    >
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200/80 pl-8 pr-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all"
        />
      </div>
      <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
        {filteredOptions.length === 0 ? (
          <div className="py-6 text-center text-sm text-neutral-400 font-medium">
            {emptyText}
          </div>
        ) : (
          filteredOptions.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt.value);
                }}
                className={
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left " +
                  (isSelected
                    ? "bg-neutral-900 text-white font-semibold"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950")
                }
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="truncate">{opt.label}</div>
                  {opt.description && (
                    <div className={"text-xs truncate mt-0.5 " + (isSelected ? "text-white/70" : "text-neutral-400")}>
                      {opt.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {opt.badge != null && (
                    <span className={"text-[10px] font-bold px-1.5 py-0.5 rounded-full " + (isSelected ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-700")}>
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
    </div>
  );

  return (
    <div className={"relative w-full " + (className || "")}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={
          "flex h-11 w-full items-center justify-between rounded-xl border border-neutral-200/90 bg-white px-4 py-2 text-sm text-neutral-900 shadow-xs transition-all hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 " +
          (disabled ? "cursor-not-allowed opacity-50 bg-neutral-100 " : "") +
          (isOpen ? "border-neutral-400 ring-2 ring-neutral-900/10" : "")
        }
      >
        <span className={"truncate font-medium text-left " + (!selectedOption ? "text-neutral-400 font-normal" : "")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {allowClear && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="rounded-full p-0.5 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown className={"size-4 text-neutral-400 transition-transform duration-200 " + (isOpen ? "rotate-180" : "")} />
        </div>
      </button>
      {isOpen && typeof document !== "undefined"
        ? ReactDOM.createPortal(dropdown, document.body)
        : null}
    </div>
  );
}
