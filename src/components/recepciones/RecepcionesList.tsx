import React from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import { EyeIcon, PencilIcon, TrashBinIcon } from "@/icons";
import { ArticleReceipt } from "@/services/articleReceiptService";

interface RecepcionesListProps {
  receipts: ArticleReceipt[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onView: (receipt: ArticleReceipt) => void;
  onEdit: (receipt: ArticleReceipt) => void;
  onDelete: (receipt: ArticleReceipt) => void;
}

export default function RecepcionesList({
  receipts,
  loading,
  currentPage,
  totalPages,
  perPage,
  onPageChange,
  onPerPageChange,
  onView,
  onEdit,
  onDelete,
}: RecepcionesListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50/50 dark:bg-white/[0.02]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Artículo</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">SKU</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Cantidad</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha de Recepción</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              Array.from({ length: perPage }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-5 py-4"><div className="h-4 w-36 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-4 w-20 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-5 w-16 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-4 w-32 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="ml-auto h-8 w-48 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" /></TableCell>
                </TableRow>
              ))
            ) : receipts.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-20 text-center" colSpan={5}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                      <svg className="size-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No se encontraron recepciones</p>
                      <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Ajusta los filtros de búsqueda o registra una nueva recepción de inventario.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              receipts.map((receipt) => (
                <TableRow key={receipt.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-5 py-4">
                    <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {receipt.articleName}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {receipt.articleSku}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge size="sm" color="success">
                      +{receipt.count} uds.
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400 font-medium">
                    {new Date(receipt.createdAt).toLocaleString("es-BO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(receipt)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="size-4 shrink-0" /> Ver
                      </button>
                      <button
                        onClick={() => onEdit(receipt)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                        title="Editar recepción"
                      >
                        <PencilIcon className="size-4 shrink-0" /> Editar
                      </button>
                      <button
                        onClick={() => onDelete(receipt)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-error-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
                        title="Eliminar recepción"
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
          perPageOptions={[10, 20, 50, 100]}
        />
      </div>
    </div>
  );
}
