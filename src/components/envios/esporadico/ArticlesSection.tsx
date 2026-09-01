import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Input from "@/components/form/input/InputField";
import { TrashBinIcon, PlusIcon } from "@/icons";

// Sin `shippingCost`: el precio del envío ya no se carga por línea, sale de la
// tarifa vigente y el backend lo reparte según el peso.
export interface SporadicLineFormState {
  articleName: string;
  quantity: number;
}

interface ArticlesSectionProps {
  lines: SporadicLineFormState[];
  handleAddLine: () => void;
  handleRemoveLine: (index: number) => void;
  handleLineChange: (index: number, field: keyof SporadicLineFormState, value: string | number) => void;
}

export default function ArticlesSection({
  lines,
  handleAddLine,
  handleRemoveLine,
  handleLineChange,
}: ArticlesSectionProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-bold">
            4
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Artículos y Costos
          </h3>
        </div>
        <button
          type="button"
          onClick={handleAddLine}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-gray-100 hover:text-brand-700 dark:bg-gray-800/40 dark:text-brand-400 dark:hover:bg-gray-800 transition-colors"
        >
          <PlusIcon className="size-4" /> Agregar Artículo
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-800/40">
              <TableRow>
                <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Artículo
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Cant.
                </TableCell>
                <TableCell isHeader className="w-12 px-4 py-3">{null}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {lines.map((line, idx) => (
                <TableRow key={idx} className="hover:bg-gray-50/30 transition-colors dark:hover:bg-white/[0.01]">
                  <TableCell className="min-w-[180px] px-4 py-3">
                    <Input
                      value={line.articleName}
                      onChange={(e: any) => handleLineChange(idx, "articleName", e.target.value)}
                      placeholder="Ej. Caja de zapatos (opcional)"
                      className="!h-10"
                    />
                  </TableCell>
                  <TableCell className="w-24 px-4 py-3">
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e: any) => handleLineChange(idx, "quantity", parseInt(e.target.value) || 1)}
                      className="!h-10"
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 transition-colors dark:hover:bg-error-500/10 dark:hover:text-error-400"
                      >
                        <TrashBinIcon className="size-5" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
