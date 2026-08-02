import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GridIcon, PencilIcon, TrashBinIcon } from "@/icons";
import { BranchOffice } from "@/services/branchOfficeService";
import { BOLIVIAN_DEPARTMENT_LABELS } from "@/services/supplierService";
import Badge from "@/components/ui/badge/Badge";

interface SucursalesListProps {
  branchOffices: BranchOffice[];
  loading: boolean;
  onEdit: (office: BranchOffice) => void;
  onDelete: (office: BranchOffice) => void;
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <TableRow>
      {[20, 32, 44, 24, 28].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div
            className={`h-4 w-${w} animate-pulse rounded-md bg-gray-100 dark:bg-gray-800`}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function SucursalesList({
  branchOffices,
  loading,
  onEdit,
  onDelete,
}: SucursalesListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="overflow-x-auto max-w-full">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Código
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Ubicación
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Dirección
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Teléfono
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Acciones
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : branchOffices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                      <GridIcon className="size-7 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      No hay sucursales registradas
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Intenta con otra búsqueda o crea la primera sucursal.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              branchOffices.map((office) => {
                const isCentral = office.bolivianDepartment === "LaPaz" || office.bolivianDepartment === "SantaCruz" || office.bolivianDepartment === "Cochabamba";
                
                return (
                <TableRow
                  key={office.id}
                  className="group hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <TableCell className="px-5 py-4">
                    <span className="inline-flex items-center rounded-md bg-brand-50 px-2.5 py-1 font-mono text-sm font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 shadow-theme-xs">
                      {office.code}
                    </span>
                  </TableCell>

                  <TableCell className="px-5 py-4">
                    <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                      {office.city}
                    </p>
                    <div className="mt-1">
                      <Badge size="sm" color={isCentral ? "info" : "light"}>
                        {BOLIVIAN_DEPARTMENT_LABELS[office.bolivianDepartment] ??
                          office.bolivianDepartment}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400 max-w-[200px] truncate">
                    {office.address || (
                      <span className="italic text-gray-300 dark:text-gray-600">
                        Sin dirección detallada
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                    {office.phone}
                  </TableCell>

                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        disabled
                        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50"
                        title="Próximamente"
                      >
                        <PencilIcon className="h-4 w-4 shrink-0" />
                      </button>
                      <button
                        disabled
                        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50"
                        title="Próximamente"
                      >
                        <TrashBinIcon className="h-4 w-4 shrink-0" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
