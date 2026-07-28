"use client";

import React, { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js";
import "flatpickr/dist/flatpickr.css";
import { CalenderIcon, CloseLineIcon } from "@/icons";

export interface DateRange {
  // Formato `yyyy-MM-dd`, que es el que espera el backend en dateFrom/dateTo.
  from?: string;
  to?: string;
}

interface ShipmentDateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
  className?: string;
}

const toApiDate = (date: Date) => flatpickr.formatDate(date, "Y-m-d");

/**
 * Rango por defecto de los listados de envíos: la última semana, es decir
 * desde hace 7 días hasta hoy (ambos inclusive).
 */
export const lastWeekRange = (): DateRange => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return { from: toApiDate(from), to: toApiDate(to) };
};

export default function ShipmentDateRangeFilter({
  value,
  onChange,
  label = "Fecha de emisión",
  className = "",
}: ShipmentDateRangeFilterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<flatpickr.Instance | null>(null);
  // El callback se lee desde un ref para no recrear el calendario en cada
  // render del padre (flatpickr se destruiría y perdería el popup abierto).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!inputRef.current) return;

    const picker = flatpickr(inputRef.current, {
      mode: "range",
      locale: Spanish,
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d/m/Y",
      monthSelectorType: "static",
      onChange: (dates) => {
        // Con el rango completo ya se puede filtrar; con una sola fecha se
        // espera a que el usuario elija la segunda (o cierre el calendario).
        if (dates.length === 2) {
          onChangeRef.current({ from: toApiDate(dates[0]), to: toApiDate(dates[1]) });
        } else if (dates.length === 0) {
          onChangeRef.current({});
        }
      },
      onClose: (dates) => {
        // Cerrar con un solo día elegido significa "desde esa fecha, sin tope".
        if (dates.length === 1) {
          onChangeRef.current({ from: toApiDate(dates[0]) });
        }
      },
    });

    pickerRef.current = picker;
    return () => {
      picker.destroy();
      pickerRef.current = null;
    };
  }, []);

  // Refleja en el calendario los cambios que vengan de afuera (p. ej. "Limpiar
  // filtros"), sin re-disparar onChange.
  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;

    const selected = [value.from, value.to].filter(Boolean) as string[];
    const current = picker.selectedDates.map(toApiDate);
    const isSame =
      current.length === selected.length && current.every((d, i) => d === selected[i]);
    if (isSame) return;

    if (selected.length === 0) {
      picker.clear(false);
    } else {
      picker.setDate(selected, false);
    }
  }, [value.from, value.to]);

  const handleClear = () => {
    pickerRef.current?.clear(false);
    onChange({});
  };

  const hasValue = Boolean(value.from || value.to);

  return (
    <div className={className}>
      {label && (
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          placeholder="Todas las fechas"
          readOnly
          className="h-11 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-4 pr-16 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-gray-400 transition-colors hover:text-error-500"
              aria-label="Limpiar rango de fechas"
              title="Limpiar rango de fechas"
            >
              <CloseLineIcon className="size-4" />
            </button>
          )}
          <span className="pointer-events-none text-gray-500 dark:text-gray-400">
            <CalenderIcon className="size-5" />
          </span>
        </div>
      </div>
      {value.from && !value.to && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Desde el {value.from} en adelante. Elegí una segunda fecha para acotar el rango.
        </p>
      )}
    </div>
  );
}
