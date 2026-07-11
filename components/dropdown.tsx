"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  indent?: boolean;
}

interface DropdownProps {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  placeholder: string;
  /** Full width — fills its container (default: false = auto/min-w) */
  fullWidth?: boolean;
  /** Show a clear "×" button when a value is selected */
  clearable?: boolean;
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  fullWidth = false,
  clearable = true,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${fullWidth ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={[
          "inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm bg-white transition-colors",
          fullWidth ? "w-full" : "min-w-44",
          open
            ? "border-teal-700 ring-1 ring-teal-100"
            : "border-slate-200 hover:border-slate-300",
          value ? "text-slate-800" : "text-slate-400",
        ].join(" ")}
      >
        <span className="flex-1 text-left truncate">
          {selected ? selected.label : placeholder}
        </span>
        {clearable && value ? (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="text-slate-300 hover:text-slate-500 transition-colors"
          >
            <X size={13} />
          </span>
        ) : (
          <ChevronDown
            size={14}
            className={`text-slate-400 flex-shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0 min-w-full w-max max-w-72 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
              !value
                ? "text-teal-700 font-medium bg-teal-50"
                : "text-slate-400 hover:bg-slate-50"
            }`}
          >
            <span className="w-4 flex-shrink-0 flex items-center justify-center">
              {!value && <Check size={12} />}
            </span>
            {placeholder}
          </button>
          <div className="border-t border-slate-100 my-1" />
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                value === opt.value
                  ? "text-teal-700 font-medium bg-teal-50"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="w-4 flex-shrink-0 flex items-center justify-center">
                {value === opt.value && <Check size={12} />}
              </span>
              <span className={opt.indent ? "text-slate-500" : ""}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
