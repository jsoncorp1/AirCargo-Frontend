import React from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import { EyeIcon, PencilIcon, TrashBinIcon, GroupIcon } from "@/icons";
import { Supplier, BOLIVIAN_DEPARTMENT_LABELS } from "@/services/supplierService";

interface ProveedoresListProps {
  proveedores: Supplier[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onView: (proveedor: Supplier) => void;
  onEdit: (proveedor: Supplier) => void;
  onDelete: (proveedor: Supplier) => void;
}

export default function ProveedoresList({
  proveedores,
  loading,
  currentPage,
  totalPages,
  perPage,
  onPageChange,
  onPerPageChange,
  onView,
  onEdit,
  onDelete,
}: ProveedoresListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50/50 dark:bg-white/[0.02]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Proveedor</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Departamento</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Usuarios</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Artículos</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              Array.from({ length: perPage }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
                      <div className="space-y-2">
                        <div className="h-4 w-36 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                        <div className="h-3 w-24 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4"><div className="h-5 w-24 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-4 w-10 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-4 w-10 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="ml-auto h-8 w-48 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" /></TableCell>
                </TableRow>
              ))
            ) : proveedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-5 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                      <GroupIcon className="size-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No se encontraron proveedores</p>
                      <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Ajusta los filtros de búsqueda o registra una nueva empresa proveedora.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              proveedores.map((empresa) => (
                <TableRow key={empresa.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarText name={empresa.name} />
                      <div>
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{empresa.name}</p>
                        <p className="max-w-[200px] sm:max-w-xs truncate text-gray-500 text-theme-xs">{empresa.description || "Sin descripción"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    {empresa.department ? (
                      <Badge size="sm" color="light">{BOLIVIAN_DEPARTMENT_LABELS[empresa.department]}</Badge>
                    ) : (
                      <span className="text-gray-400 text-theme-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{empresa.userQuantity ?? 0}</span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{empresa.articleQuantity ?? 0}</span>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(empresa)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="size-4 shrink-0" /> Ver
                      </button>
                      <button
                        onClick={() => onEdit(empresa)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                        title="Editar proveedor"
                      >
                        <PencilIcon className="size-4 shrink-0" /> Editar
                      </button>
                      <button
                        onClick={() => onDelete(empresa)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-error-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
                        title="Eliminar proveedor"
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
          perPageOptions={[8, 20, 50, 100]}
        />
      </div>
    </div>
  );
}
