"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import DatePicker from "@/components/form/date-picker";
import { CalenderIcon } from "@/icons";
import { calendarDateToApiDay, todayApiDay, todayAsCalendarDate } from "@/utils/datetime";

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

const getToday = () => todayApiDay();

const getStartOfWeek = () => {
  const d = todayAsCalendarDate();
  const day = d.getDay() || 7; // domingo (0) cuenta como 7: la semana arranca lunes
  d.setDate(d.getDate() - day + 1);
  return calendarDateToApiDay(d);
};

const getStartOfMonth = () => {
  const d = todayAsCalendarDate();
  d.setDate(1);
  return calendarDateToApiDay(d);
};

/** Rango de un solo día: hoy. */
export const todayRange = (): DateRange => {
  const today = getToday();
  return { from: today, to: today };
};

/**
 * @deprecated El nombre miente: devuelve hoy, no la última semana. Se conserva
 * porque varias pantallas lo usan como valor inicial y cambiarlo alteraría de
 * golpe lo que muestran al abrirlas. Para hoy usar `todayRange()`.
 */
export const lastWeekRange = (): DateRange => todayRange();

type RangeOption = "all" | "today" | "week" | "month" | "custom";

// Qué opción del select representa un rango dado. Sin esto, una pantalla que
// arranca con un rango por defecto muestra "Cualquier Fecha" mientras filtra por
// otra cosa: el control diría una cosa y la lista mostraría otra.
const optionForRange = (range: DateRange): RangeOption => {
  if (!range.from && !range.to) return "all";
  const today = getToday();
  if (range.from === today && range.to === today) return "today";
  if (range.from === getStartOfWeek() && range.to === today) return "week";
  if (range.from === getStartOfMonth() && range.to === today) return "month";
  return "custom";
};

export default function ShipmentDateRangeFilter({
  value,
  onChange,
  className = "",
}: ShipmentDateRangeFilterProps) {
  const [option, setOption] = useState<RangeOption>(() => optionForRange(value));

  // `useId` genera ids con dos puntos (`:r0:`) y flatpickr los usa como selector
  // CSS (`#id`), donde los dos puntos rompen. Se limpian.
  const baseId = useId().replace(/:/g, "");
  const fromId = `date-from-${baseId}`;
  const toId = `date-to-${baseId}`;

  // flatpickr se reinicializa cuando cambian las props de `DatePicker`, así que
  // el callback tiene que ser estable. El ref deja usar siempre el `onChange`
  // más reciente sin que la identidad de la función cambie entre renders.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as RangeOption;
    setOption(val);
    const today = getToday();

    if (val === "all") {
      onChangeRef.current({});
    } else if (val === "today") {
      onChangeRef.current({ from: today, to: today });
    } else if (val === "week") {
      onChangeRef.current({ from: getStartOfWeek(), to: today });
    } else if (val === "month") {
      onChangeRef.current({ from: getStartOfMonth(), to: today });
    }
    // "custom" no dispara nada: espera a que el usuario elija en el calendario.
  };

  // Dos campos sueltos en vez de un `mode="range"`: el rango de flatpickr
  // obliga a hacer dos clics en el mismo calendario sin nada que lo indique, y
  // no deja corregir solo una de las dos puntas. Con "Desde" y "Hasta" cada
  // fecha se elige y se cambia por separado.
  //
  // El rango se completa solo si falta la otra punta, así elegir una sola fecha
  // ya filtra ese día en vez de no hacer nada.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  });

  const handleFromChange = useCallback((dates: Date[]) => {
    const from = dates[0] ? calendarDateToApiDay(dates[0]) : undefined;
    onChangeRef.current({ from, to: valueRef.current.to ?? from });
  }, []);

  const handleToChange = useCallback((dates: Date[]) => {
    const to = dates[0] ? calendarDateToApiDay(dates[0]) : undefined;
    onChangeRef.current({ from: valueRef.current.from ?? to, to });
  }, []);

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
          <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-left-2">
            <div className="w-36">
              <DatePicker
                id={fromId}
                mode="single"
                defaultDate={value.from}
                onChange={handleFromChange}
                placeholder="Desde"
              />
            </div>
            <span className="shrink-0 text-sm text-gray-400">hasta</span>
            <div className="w-36">
              <DatePicker
                id={toId}
                mode="single"
                defaultDate={value.to}
                onChange={handleToChange}
                placeholder="Hasta"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
