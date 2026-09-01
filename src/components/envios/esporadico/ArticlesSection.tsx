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
  unitPrice: string;
  weight: string;
}

interface ArticlesSectionProps {
  lines: SporadicLineFormState[];
  handleAddLine: () => void;
  handleRemoveLine: (index: number) => void;
  handleLineChange: (index: number, field: keyof SporadicLineFormState, value: string | number) => void;
  handleDecimalChange: (index: number, field: "unitPrice" | "weight", raw: string) => void;
  lineTotal: (line: SporadicLineFormState) => number;
  totalWeight: number;
  totalPrice: number;
}

export default function ArticlesSection({
  lines,
  handleAddLine,
  handleRemoveLine,
  handleLineChange,
  handleDecimalChange,
  lineTotal,
  totalWeight,
  totalPrice,
}: ArticlesSectionProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-bold">
            3
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
                <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  P. Unit.
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Peso (kg)
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Total
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
                      required
                      placeholder="Ej. Caja de zapatos"
                      className="!h-10"
                    />
                  </TableCell>
                  <TableCell className="w-24 px-4 py-3">
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e: any) => handleLineChange(idx, "quantity", parseInt(e.target.value) || 1)}
                      required
                      className="!h-10"
                    />
                  </TableCell>
                  <TableCell className="w-32 px-4 py-3">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={line.unitPrice}
                      onChange={(e: any) => handleDecimalChange(idx, "unitPrice", e.target.value)}
                      required
                      className="!h-10"
                    />
                  </TableCell>
                  <TableCell className="w-28 px-4 py-3">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={line.weight}
                      onChange={(e: any) => handleDecimalChange(idx, "weight", e.target.value)}
                      required
                      className="!h-10"
                    />
                  </TableCell>
                  <TableCell className="w-32 px-4 py-3 text-right font-semibold text-gray-800 dark:text-white/90">
                    Bs {lineTotal(line).toFixed(2)}
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

      {/* Totales. El precio del envío ya no vive acá: sale de la tarifa y se
          muestra en el bloque de precio, con su desglose. */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/20">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Peso Total</p>
          <p className="text-2xl font-black text-gray-700 dark:text-gray-300">{totalWeight.toFixed(2)} kg</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/20">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Valor Declarado
          </p>
          <p className="text-2xl font-black text-gray-700 dark:text-gray-300">
            Bs {totalPrice.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
