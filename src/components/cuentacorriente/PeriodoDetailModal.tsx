"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  billingService,
  BillingPeriodDetail,
  billingPeriodStatusLabel,
  billingPeriodStatusBadge,
  dueDateLabel,
  periodLabel,
  getBillingErrorMessage,
} from "@/services/billingService";
import { formatBs } from "@/services/logisticsEnums";
import { formatDate, formatDateTime } from "@/utils/datetime";

interface PeriodoDetailModalProps {
  periodId: string;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-right text-sm font-medium text-gray-800 dark:text-gray-200">
        {value}
      </span>
    </div>
  );
}

/**
 * Detalle de un período: qué envíos lo componen.
 *
 * Es solo lectura a propósito — no hay endpoint para agregar ni quitar una
 * línea, y no debe haberlo: las líneas entran solas al despachar un envío a
 * cuenta.
 */
export default function PeriodoDetailModal({ periodId, onClose }: PeriodoDetailModalProps) {
  const [period, setPeriod] = useState<BillingPeriodDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await billingService.getPeriodById(periodId);
        if (!cancelled) setPeriod(data);
      } catch (err) {
        if (!cancelled) {
          setError(getBillingErrorMessage(err, "No se pudo cargar el período."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [periodId]);

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="shrink-0 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold capitalize text-gray-800 dark:text-white/90">
          {period ? periodLabel(period.year, period.month) : "Período"}
        </h4>
        {period && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{period.supplierName}</span>
            <Badge size="sm" color={billingPeriodStatusBadge(period.status)}>
              {billingPeriodStatusLabel(period.status)}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && <p className="py-8 text-center text-sm text-gray-500">Cargando…</p>}
        {error && <p className="py-8 text-center text-sm text-error-500">{error}</p>}

        {period && (
          <div className="space-y-6">
            <section>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row
                  label="Total del período"
                  value={
                    <span className="text-base font-bold">{formatBs(period.totalAmount)}</span>
                  }
                />
                <Row label="Envíos" value={period.entryCount} />
                <Row
                  label="Cerrado"
                  value={period.closedAt ? formatDateTime(period.closedAt) : "Todavía abierto"}
                />
                <Row
                  label="Vencimiento"
                  value={
                    period.dueDate
                      ? `${formatDate(period.dueDate)} · ${dueDateLabel(period.daysUntilDue)}`
                      : "—"
                  }
                />
                <Row
                  label="Cobrado"
                  value={
                    period.settledAt
                      ? `${formatDateTime(period.settledAt)}${
                          period.settlementReference ? ` · ${period.settlementReference}` : ""
                        }`
                      : "—"
                  }
                />
              </div>
            </section>

            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                Envíos del período
              </h5>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-800/40">
                      <TableRow>
                        <TableCell isHeader className="px-4 py-2 text-start text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                          Guía
                        </TableCell>
                        <TableCell isHeader className="px-4 py-2 text-start text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                          Fecha
                        </TableCell>
                        <TableCell isHeader className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                          Importe
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {period.entries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                            Todavía no se fió ningún envío en este mes.
                          </TableCell>
                        </TableRow>
                      ) : (
                        period.entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="whitespace-nowrap px-4 py-2.5 align-middle">
                              <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {entry.shipmentCode}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-4 py-2.5 align-middle text-theme-sm text-gray-600 dark:text-gray-300">
                              {formatDate(entry.shipmentDate)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-4 py-2.5 text-right align-middle text-theme-sm tabular-nums text-gray-800 dark:text-gray-200">
                              {formatBs(entry.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      <div className="flex justify-end border-t border-gray-100 px-6 py-4 dark:border-gray-800">
        <Button size="sm" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
