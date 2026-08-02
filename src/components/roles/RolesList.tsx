import React from "react";
import { Role } from "@/services/roleService";
import { PencilIcon, TrashBinIcon } from "@/icons";

interface RolesListProps {
  roles: Role[];
  loading: boolean;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

export default function RolesList({
  roles,
  loading,
  onEdit,
  onDelete,
}: RolesListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]"
          >
            <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="mb-6 h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800/50" />
            <div className="mt-auto flex justify-end gap-2 border-t border-gray-50 pt-4 dark:border-gray-800/50">
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-800/30">
        <p className="text-gray-500 dark:text-gray-400">
          No se encontraron roles.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {roles.map((role) => (
        <div
          key={role.id}
          className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-theme-xs transition-all hover:-translate-y-1 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-brand-500/30"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h5 className="font-semibold text-gray-800 dark:text-white/90">
              {role.name}
            </h5>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
          <p className="mb-5 flex-1 text-sm text-gray-500 line-clamp-3 dark:text-gray-400">
            {role.description || "Sin descripción proporcionada."}
          </p>
          <div className="mt-auto flex items-center justify-end gap-2 border-t border-gray-50 pt-4 dark:border-gray-800/50">
            <button
              onClick={() => onEdit(role)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
              title="Editar Rol"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(role)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400"
              title="Eliminar Rol"
            >
              <TrashBinIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
