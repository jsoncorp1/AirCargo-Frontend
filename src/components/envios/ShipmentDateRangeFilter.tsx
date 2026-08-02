"use client";

import React, { useState, useEffect } from "react";
import { CalenderIcon } from "@/icons";

export interface DateRange {
  from?: string;
  to?: string;
}

interface ShipmentDateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
  className?: string;
}

export const lastWeekRange = (): DateRange => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return { from: to.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
};

const getToday = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

const getStartOfWeek = () => {
  const d = new Date();
  const day = d.getDay() || 7; 
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().split("T")[0];
};

const getStartOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
};

type RangeOption = "all" | "today" | "week" | "month" | "custom";

export default function ShipmentDateRangeFilter({
  value,
  onChange,
  className = "",
}: ShipmentDateRangeFilterProps) {
  const [option, setOption] = useState<RangeOption>("all");
  const [customFrom, setCustomFrom] = useState(value.from || "");
  const [customTo, setCustomTo] = useState(value.to || "");

  useEffect(() => {
    // Sincronizar option si los valores cambian desde afuera
    if (!value.from && !value.to) {
      setOption("all");
    }
  }, [value]);

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as RangeOption;
    setOption(val);
    const today = getToday();

    if (val === "all") {
      onChange({});
    } else if (val === "today") {
      onChange({ from: today, to: today });
    } else if (val === "week") {
      onChange({ from: getStartOfWeek(), to: today });
    } else if (val === "month") {
      onChange({ from: getStartOfMonth(), to: today });
    } else if (val === "custom") {
      onChange({ from: customFrom, to: customTo });
    }
  };

  const handleCustomChange = (type: "from" | "to", dateVal: string) => {
    if (type === "from") setCustomFrom(dateVal);
    if (type === "to") setCustomTo(dateVal);
    
    onChange({
      from: type === "from" ? dateVal : customFrom,
      to: type === "to" ? dateVal : customTo,
    });
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-40 shrink-0">
          <select
            value={option}
            onChange={handleOptionChange}
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 pl-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 transition-all"
          >
            <option value="all">Cualquier Fecha</option>
            <option value="today">Solo Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="custom">Personalizado...</option>
          </select>
          <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-brand-500 pointer-events-none">
            <CalenderIcon className="size-4" />
          </div>
        </div>

        {option === "custom" && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => handleCustomChange("from", e.target.value)}
              className="h-11 w-36 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              title="Fecha Inicio"
            />
            <span className="text-gray-400 text-sm">hasta</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => handleCustomChange("to", e.target.value)}
              className="h-11 w-36 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              title="Fecha Fin"
            />
          </div>
        )}
      </div>
    </div>
  );
}
