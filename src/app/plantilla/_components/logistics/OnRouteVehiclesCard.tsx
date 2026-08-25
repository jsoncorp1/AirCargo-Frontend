import React from "react";

type VehicleState = {
  label: string;
  count: number;
  barClass: string;
};

const states: VehicleState[] = [
  { label: "On route", count: 18, barClass: "bg-brand-500" },
  { label: "En depósito", count: 8, barClass: "bg-blue-light-500" },
  { label: "En mantenimiento", count: 3, barClass: "bg-warning-500" },
];

const total = states.reduce((acc, state) => acc + state.count, 0);

export default function OnRouteVehiclesCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Delivery Vehicles
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Flota disponible hoy
          </p>
        </div>
        <span className="text-title-sm font-bold text-gray-800 dark:text-white/90">
          {total}
        </span>
      </div>

      {/* Barra apilada */}
      <div className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        {states.map((state) => (
          <div
            key={state.label}
            className={state.barClass}
            style={{ width: `${(state.count / total) * 100}%` }}
          />
        ))}
      </div>

      <ul className="mt-5 space-y-3">
        {states.map((state) => (
          <li key={state.label} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className={`h-2.5 w-2.5 rounded-full ${state.barClass}`} />
              {state.label}
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {state.count}
              <span className="ml-1 text-xs font-normal text-gray-400">
                ({Math.round((state.count / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
