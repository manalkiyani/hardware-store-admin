"use client";

import { useState, useRef } from "react";
import { X, Plus } from "lucide-react";
import clsx from "clsx";

interface ChipInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}

export default function ChipInput({ label, values, onChange }: ChipInputProps) {
  const [adding, setAdding] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startAdding() {
    setAdding(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitAdd() {
    const trimmed = inputVal.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInputVal("");
    setAdding(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitAdd();
    } else if (e.key === "Escape") {
      setInputVal("");
      setAdding(false);
    }
  }

  function removeValue(val: string) {
    onChange(values.filter((v) => v !== val));
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2 items-center">
        {values.map((val) => (
          <span
            key={val}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full"
          >
            {val}
            <button
              type="button"
              onClick={() => removeValue(val)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {adding ? (
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitAdd}
            placeholder="Type & press Enter"
            className={clsx(
              "px-3 py-1 text-sm border border-slate-300 rounded-full outline-none",
              "focus:border-slate-500 w-36"
            )}
          />
        ) : (
          <button
            type="button"
            onClick={startAdding}
            className={clsx(
              "inline-flex items-center gap-1 px-3 py-1 border border-dashed border-slate-300",
              "text-slate-500 text-sm rounded-full hover:border-slate-400 hover:text-slate-700 transition-colors"
            )}
          >
            <Plus size={12} />
            Add
          </button>
        )}
      </div>
    </div>
  );
}
