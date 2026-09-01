"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import {
  billingService,
  BillingPeriod,
  BillingPeriodStatus,
  billingPeriodStatusLabel,
  billingPeriodStatusBadge,
  canClosePeriod,
  canSettlePeriod,
  dueDateLabel,
  periodLabel,
  getBillingErrorMessage,
} from "@/services/billingService";
import { formatBs } from "@/services/logisticsEnums";
import { formatDate } from "@/utils/datetime";
import PeriodoDetailModal from "./PeriodoDetailModal";

const DEFAULT_PER_PAGE = 10;

interface CuentaCorrienteViewProps {
  /**
   * `empresa`: solo lectura, su propio estado de cuenta.
   * `cobranzas`: admin/superadmin, con cerrar el período y registrar el cobro.
   */
  perfil: "empresa" | "cobranzas";
}

const STATUS_TABS: { value: BillingPeriodStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "Open", label: "Abiertos" },
  { value: "Closed", label: "Por cobrar" },
  { value: "Overdue", label: "Vencidos" },
  { value: "Settled", label: "Cobrados" },
];

const headerClass =
  "px-5 py-3 text-start text-xs font-semibold uppercase text-gray-500 dark:text-gray-400";
const headerRightClass =
  "px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400";

/**
 * Cuenta corriente: los envíos que se fiaron, agrupados por mes.
 *
 * Las líneas entran solas al crear un envío con forma de pago "a cuenta" —nazca
 * de un recojo, de una orden o del mostrador—. No hay forma de agregar o quitar
 * una a mano, y no debe haberla.
 */
export default function CuentaCorrienteView({ perfil }: CuentaCorrienteViewProps) {
  const { showToast } = useToast();
  const { pending: acting, run: runAction } = useSubmitLock();
  const detailModal = useModal();

  const esCobranzas = perfil === "cobranzas";

  const [periods, setPeriods] = useState<BillingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<BillingPeriodStatus | "all">("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const res = await billingService.getPeriods(page, perPage, {
        ...(status !== "all" ? { status } : {}),
      });
      setPeriods(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Error fetching billing periods", err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, status]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const handleStatusChange = (value: string) => {
    setStatus(value as BillingPeriodStatus | "all");
    setPage(1);
  };

  const handleClose = (period: BillingPeriod) => {
    runAction(async () => {
      try {
        await billingService.closePeriod(period.id);
        showToast(
          "success",
          "Período cerrado",
          `${periodLabel(period.year, period.month)} quedó congelado en ${formatBs(period.totalAmount)}.`
        );
        fetchPeriods();
      } catch (err) {
        showToast(
          "error",
          "Error",
          getBillingErrorMessage(err, "No se pudo cerrar el período.")
        );
      }
    });
  };

  const handleSettle = (period: BillingPeriod) => {
    const reference = window.prompt(
      `Referencia del cobro de ${periodLabel(period.year, period.month)} (opcional):`
    );
    if (reference === null) return;

    runAction(async () => {
      try {
        await billingService.settlePeriod(period.id, {
          settlementReference: reference.trim() || null,
        });
        showToast("success", "Cobro registrado", `${formatBs(period.totalAmount)} cobrados.`);
        fetchPeriods();
      } catch (err) {
        showToast("error", "Error", getBillingErrorMessage(err, "No se pudo registrar el cobro."));
      }
    });
  };

  const openDetail = (id: string) => {
    setDetailId(id);
    detailModal.openModal();
  };

  const statusTabs: TabItem[] = STATUS_TABS.map((t) => ({ value: t.value, label: t.label }));
  const rowOffset = (page - 1) * perPage;
  const colSpan = esCobranzas ? 7 : 6;

  return (
    <div>
      <PageBreadcrumb pageTitle={esCobranzas ? "Cobranzas" : "Estado de Cuenta"} />
      <p className="-mt-3 mb-6 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
        {esCobranzas
          ? "Los períodos mensuales de las empresas que fían. Un período se cierra recién a partir del primer día del mes siguiente."
          : "Los envíos que se cargaron a tu cuenta corriente, agrupados por mes. Las líneas entran solas al despachar un envío a cuenta."}
      </p>

      <ComponentCard>
        <div className="mb-5">
          <Tabs items={statusTabs} value={status} onChange={handleStatusChange} />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                <TableRow>
                  <TableCell isHeader className={headerRightClass}>Nro</TableCell>
                  <TableCell isHeader className={headerClass}>Período</TableCell>
                  {esCobranzas && <TableCell isHeader className={headerClass}>Empresa</TableCell>}
                  <TableCell isHeader className={headerClass}>Estado</TableCell>
                  <TableCell isHeader className={headerClass}>Vencimiento</TableCell>
                  <TableCell isHeader className={headerRightClass}>Total</TableCell>
                  <TableCell isHeader className={headerRightClass}>{""}</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} className="px-5 py-10 text-center text-sm text-gray-500">
                      Cargando períodos…
                    </TableCell>
                  </TableRow>
                ) : periods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} className="px-5 py-10 text-center text-sm text-gray-500">
                      No hay períodos para mostrar.
                    </TableCell>
                  </TableRow>
                ) : (
                  periods.map((period, index) => {
                    const puedeCerrar = canClosePeriod(period);
                    // El mes todavía no terminó: el botón se muestra apagado con
                    // la explicación en vez de fallar al apretarlo.
                    const mesEnCurso = period.status === "Open" && !puedeCerrar;

                    return (
                      <TableRow key={period.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                        <TableCell className="w-14 whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm tabular-nums text-gray-400">
                          {rowOffset + index + 1}
                        </TableCell>

                        <TableCell className="whitespace-nowrap px-5 py-4 align-middle">
                          <button
                            type="button"
                            onClick={() => openDetail(period.id)}
                            className="font-medium capitalize text-gray-800 text-theme-sm hover:text-brand-500 dark:text-white/90"
                          >
                            {periodLabel(period.year, period.month)}
                          </button>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {period.entryCount} envío{period.entryCount === 1 ? "" : "s"}
                          </p>
                        </TableCell>

                        {esCobranzas && (
                          <TableCell className="px-5 py-4 align-middle text-theme-sm text-gray-700 dark:text-gray-300">
                            {period.supplierName}
                          </TableCell>
                        )}

                        <TableCell className="px-5 py-4 align-middle">
                          <div className="flex flex-col items-start gap-1">
                            <Badge size="sm" color={billingPeriodStatusBadge(period.status)}>
                              {billingPeriodStatusLabel(period.status)}
                            </Badge>
                            {period.settledAt && (
                              <span className="whitespace-nowrap text-xs text-gray-400">
                                Cobrado {formatDate(period.settledAt)}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="whitespace-nowrap px-5 py-4 align-middle">
                          {period.dueDate ? (
                            <>
                              <p className="text-theme-sm text-gray-700 dark:text-gray-300">
                                {formatDate(period.dueDate)}
                              </p>
                              <p
                                className={`mt-0.5 text-xs ${
                                  (period.daysUntilDue ?? 0) < 0
                                    ? "text-error-500"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {dueDateLabel(period.daysUntilDue)}
                              </p>
                            </>
                          ) : (
                            <span className="text-theme-sm text-gray-400">—</span>
                          )}
                        </TableCell>

                        <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm font-semibold tabular-nums text-gray-800 dark:text-gray-200">
                          {formatBs(period.totalAmount)}
                        </TableCell>

                        <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle">
                          {esCobranzas ? (
                            <div className="flex justify-end gap-1">
                              {period.status === "Open" && (
                                <button
                                  type="button"
                                  disabled={acting || !puedeCerrar}
                                  onClick={() => handleClose(period)}
                                  title={
                                    mesEnCurso
                                      ? "El mes todavía no terminó: se puede cerrar a partir del primer día del mes siguiente."
                                      : undefined
                                  }
                                  className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Cerrar
                                </button>
                              )}
                              {canSettlePeriod(period.status) && (
                                <button
                                  type="button"
                                  disabled={acting}
                                  onClick={() => handleSettle(period)}
                                  className="rounded-lg bg-success-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success-600 disabled:opacity-50"
                                >
                                  Registrar cobro
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openDetail(period.id)}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              Ver detalle
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-end">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              perPage={perPage}
              onPerPageChange={setPerPage}
            />
          </div>
        )}
      </ComponentCard>

      <Modal isOpen={detailModal.isOpen} onClose={detailModal.closeModal} className="m-4 max-w-[640px] z-50">
        {detailModal.isOpen && detailId && (
          <PeriodoDetailModal
            key={detailId}
            periodId={detailId}
            onClose={detailModal.closeModal}
          />
        )}
      </Modal>
    </div>
  );
}
