import React from "react";
import Button from "@/components/ui/button/Button";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import { PlusIcon } from "@/icons";

interface UsuariosToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  roleTabs: TabItem[];
  selectedRoleFilter: string;
  onRoleFilterChange: (roleId: string) => void;
  onNewUser: () => void;
}

export default function UsuariosToolbar({
  searchTerm,
  onSearchChange,
  roleTabs,
  selectedRoleFilter,
  onRoleFilterChange,
  onNewUser,
}: UsuariosToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-5">
      {/* Pestañas de Roles (Tabs) y Botón Nuevo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex-1 overflow-x-auto">
          <Tabs
            items={roleTabs}
            value={selectedRoleFilter}
            onChange={onRoleFilterChange}
          />
        </div>

        <div className="flex shrink-0 sm:ml-4">
          <Button
            startIcon={<PlusIcon />}
            onClick={onNewUser}
            className="w-full sm:w-auto px-6 rounded-full shadow-sm hover:shadow-md"
          >
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Buscador Textual Local */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm dark:bg-white/[0.02] dark:border-gray-800">
        <div className="flex items-center gap-2 text-gray-400 pl-2">
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="text-sm font-semibold uppercase tracking-wider">
            Filtros:
          </span>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar por nombre, email, DNI..."
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
    </div>
  );
}
