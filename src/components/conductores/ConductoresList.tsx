import React from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import { EyeIcon, PencilIcon, TrashBinIcon, GroupIcon } from "@/icons";
import { User } from "@/services/userService";
import AvatarText from "@/components/ui/avatar/AvatarText";

interface ConductoresListProps {
  conductores: User[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onView: (conductor: User) => void;
  onEdit: (conductor: User) => void;
  onDelete: (conductor: User) => void;
}

export default function ConductoresList({
  conductores,
  loading,
  currentPage,
  totalPages,
  perPage,
  onPageChange,
  onPerPageChange,
  onView,
  onEdit,
  onDelete,
}: ConductoresListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50/50 dark:bg-white/[0.02]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Conductor</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">DNI</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Contacto</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Sucursal Asignada</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              Array.from({ length: perPage }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-5 py-4"><div className="flex gap-3 items-center"><div className="h-10 w-10 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" /><div className="space-y-1"><div className="h-4 w-32 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /><div className="h-3 w-20 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></div></div></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-4 w-20 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-4 w-24 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-4 w-28 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-5 w-16 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="ml-auto h-8 w-48 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" /></TableCell>
                </TableRow>
              ))
            ) : conductores.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-20 text-center" colSpan={6}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                      <GroupIcon className="size-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No se encontraron conductores</p>
                      <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Ajusta los filtros de búsqueda o registra un nuevo conductor.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              conductores.map((conductor) => (
                <TableRow key={conductor.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarText name={conductor.fullName} />
                      <div>
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {conductor.fullName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {conductor.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {conductor.dni || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-600 text-theme-sm dark:text-gray-400">
                    {conductor.phoneNumber || "No registrado"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-600 text-theme-sm dark:text-gray-400">
                    {conductor.branchOfficeCity ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="size-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {conductor.branchOfficeCity}
                        {conductor.branchOfficeCode && ` (${conductor.branchOfficeCode})`}
                      </span>
                    ) : (
                      "Sin sucursal"
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge size="sm" color="success">
                      Activo
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(conductor)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="size-4 shrink-0" /> Ver
                      </button>
                      <button
                        onClick={() => onEdit(conductor)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                        title="Editar conductor"
                      >
                        <PencilIcon className="size-4 shrink-0" /> Editar
                      </button>
                      <button
                        onClick={() => onDelete(conductor)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-error-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
                        title="Eliminar conductor"
                      >
                        <TrashBinIcon className="size-4 shrink-0" /> Eliminar
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-gray-800 bg-gray-50/30 dark:bg-transparent">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          perPage={perPage}
          onPerPageChange={onPerPageChange}
          perPageOptions={[8, 16, 50, 100]}
        />
      </div>
    </div>
  );
}
