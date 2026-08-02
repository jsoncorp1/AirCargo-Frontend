import React from "react";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";

interface SucursalesToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onNew: () => void;
}

export default function SucursalesToolbar({
  searchTerm,
  onSearchChange,
  onNew,
}: SucursalesToolbarProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
      {/* Buscador Local */}
      <div className="flex-1 w-full sm:max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar sucursal por código, ciudad, departamento..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 pl-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 transition-all placeholder:text-gray-400"
          />
          <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-gray-400 pointer-events-none">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex shrink-0">
        <Button
          startIcon={<PlusIcon />}
          onClick={onNew}
          className="w-full sm:w-auto px-6 rounded-full shadow-sm hover:shadow-md"
        >
          Nueva Sucursal
        </Button>
      </div>
    </div>
  );
}
