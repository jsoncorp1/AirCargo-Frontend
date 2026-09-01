"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useAuth } from "@/context/AuthContext";
import {
  driverSettlementService,
  DriverSettlement,
  DriverSettlementStatus,
  driverSettlementStatusLabel,
  driverSettlementStatusBadge,
  canCloseSettlement,
  canPaySettlement,
  getSettlementErrorMessage,
} from "@/services/driverSettlementService";
import { periodLabel } from "@/services/billingService";
import { formatBs } from "@/services/logisticsEnums";
import { formatDate } from "@/utils/datetime";

const DEFAULT_PER_PAGE = 10;

interface LiquidacionesViewProps {
  /**
   * `conductor`: su propio recibo del mes, solo lectura.
   * `admin`: las de su alcance, con cerrar y pagar.
   */
  perfil: "conductor" | "admin";
}

const STATUS_TABS: { value: DriverSettlementStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "Open", label: "Abiertas" },
  { value: "Closed", label: "Por pagar" },
  { value: "Paid", label: "Pagadas" },
];

const headerClass =
  "px-5 py-3 text-start text-xs font-semibold uppercase text-gray-500 dark:text-gray-400";
const headerRightClass =
  "px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400";

/**
 * Liquidaciones al conductor: el espejo de la cuenta corriente, del otro lado
 * del mostrador.
 *
 * El total lo arma el backend sumando la comisión de cada tarea cerrada. Para
 * ver qué tareas lo componen hay que mirar el listado de tareas del conductor
 * filtrado por fecha — no existe un detalle por liquidación.
 */
export default function LiquidacionesView({ perfil }: LiquidacionesViewProps) {
  const { showToast } = useToast();
  const { pending: acting, run: runAction } = useSubmitLock();
  const { isSuperAdminUser } = useAuth();

  const esAdmin = perfil === "admin";

  const [settlements, setSettlements] = useState<DriverSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<DriverSettlementStatus | "all">("all");

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await driverSettlementService.getSettlements(page, perPage, {
        ...(status !== "all" ? { status } : {}),
      });
      setSettlements(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Error fetching driver settlements", err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, status]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleStatusChange = (value: string) => {
    setStatus(value as DriverSettlementStatus | "all");
    setPage(1);
  };

  const handleClose = (settlement: DriverSettlement) => {
    runAction(async () => {
      try {
        await driverSettlementService.closeSettlement(settlement.id);
        showToast(
          "success",
          "Liquidación cerrada",
          `${settlement.driverFullName} · ${formatBs(settlement.totalAmount)}.`
        );
        fetchSettlements();
      } catch (err) {
        showToast(
          "error",
          "Error",
          getSettlementErrorMessage(err, "No se pudo cerrar la liquidación.")
        );
      }
    });
  };

  const handlePay = (settlement: DriverSettlement) => {
    const reference = window.prompt(
      `Referencia del pago a ${settlement.driverFullName} (opcional):`
    );
    if (reference === null) return;

    runAction(async () => {
      try {
        await driverSettlementService.paySettlement(settlement.id, {
          paymentReference: reference.trim() || null,
        });
        showToast("success", "Pago registrado", `${formatBs(settlement.totalAmount)} pagados.`);
        fetchSettlements();
      } catch (err) {
        showToast(
          "error",
          "Error",
          getSettlementErrorMessage(err, "No se pudo registrar el pago.")
        );
      }
    });
  };

  const statusTabs: TabItem[] = STATUS_TABS.map((t) => ({ value: t.value, label: t.label }));
  const rowOffset = (page - 1) * perPage;
  const colSpan = esAdmin ? 7 : 5;

  return (
    <div>
      <PageBreadcrumb pageTitle={esAdmin ? "Liquidaciones de Conductores" : "Mis Liquidaciones"} />
      <p className="-mt-3 mb-6 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
        {esAdmin
          ? "Lo que la empresa le debe a cada conductor por sus tareas cerradas, mes a mes."
          : "Tu recibo del mes: la suma de las comisiones de las tareas que cerraste."}
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
                  {esAdmin && <TableCell isHeader className={headerClass}>Conductor</TableCell>}
                  {esAdmin && isSuperAdminUser && (
                    <TableCell isHeader className={headerClass}>Sucursal</TableCell>
                  )}
                  <TableCell isHeader className={headerClass}>Estado</TableCell>
                  <TableCell isHeader className={headerRightClass}>Total</TableCell>
                  {esAdmin && <TableCell isHeader className={headerRightClass}>{""}</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} className="px-5 py-10 text-center text-sm text-gray-500">
                      Cargando liquidaciones…
                    </TableCell>
                  </TableRow>
                ) : settlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} className="px-5 py-10 text-center text-sm text-gray-500">
                      No hay liquidaciones para mostrar.
                    </TableCell>
                  </TableRow>
                ) : (
                  settlements.map((settlement, index) => (
                    <TableRow key={settlement.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                      <TableCell className="w-14 whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm tabular-nums text-gray-400">
                        {rowOffset + index + 1}
                      </TableCell>

                      <TableCell className="whitespace-nowrap px-5 py-4 align-middle">
                        <p className="font-medium capitalize text-gray-800 text-theme-sm dark:text-white/90">
                          {periodLabel(settlement.year, settlement.month)}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {settlement.taskCount} tarea{settlement.taskCount === 1 ? "" : "s"}
                        </p>
                      </TableCell>

                      {esAdmin && (
                        <TableCell className="px-5 py-4 align-middle text-theme-sm text-gray-700 dark:text-gray-300">
                          {settlement.driverFullName}
                        </TableCell>
                      )}

                      {esAdmin && isSuperAdminUser && (
                        <TableCell className="px-5 py-4 align-middle text-theme-sm text-gray-600 dark:text-gray-300">
                          {settlement.branchOfficeCode ?? "—"}
                        </TableCell>
                      )}

                      <TableCell className="px-5 py-4 align-middle">
                        <div className="flex flex-col items-start gap-1">
                          <Badge size="sm" color={driverSettlementStatusBadge(settlement.status)}>
                            {driverSettlementStatusLabel(settlement.status)}
                          </Badge>
                          {settlement.paidAt && (
                            <span className="whitespace-nowrap text-xs text-gray-400">
                              Pagada {formatDate(settlement.paidAt)}
                              {settlement.paymentReference
                                ? ` · ${settlement.paymentReference}`
                                : ""}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm font-semibold tabular-nums text-gray-800 dark:text-gray-200">
                        {formatBs(settlement.totalAmount)}
                      </TableCell>

                      {esAdmin && (
                        <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle">
                          <div className="flex justify-end gap-1">
                            {canCloseSettlement(settlement.status) && (
                              <button
                                type="button"
                                disabled={acting}
                                onClick={() => handleClose(settlement)}
                                className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
                              >
                                Cerrar
                              </button>
                            )}
                            {canPaySettlement(settlement.status) && (
                              <button
                                type="button"
                                disabled={acting}
                                onClick={() => handlePay(settlement)}
                                className="rounded-lg bg-success-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success-600 disabled:opacity-50"
                              >
                                Registrar pago
                              </button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
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

        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          {esAdmin
            ? "Para ver qué tareas componen un total, filtrá las tareas del conductor por ese mes."
            : "La comisión de cada tarea la ves en su detalle, dentro de Mis Tareas."}
        </p>
      </ComponentCard>
    </div>
  );
}
