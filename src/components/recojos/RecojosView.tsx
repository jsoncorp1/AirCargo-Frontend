"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import ShipmentDateRangeFilter, {
  DateRange,
  todayRange,
} from "@/components/envios/ShipmentDateRangeFilter";
import {
  pickupOrderService,
  PickupOrderListItem,
  PickupOrder,
  PickupOrderStatus,
  PickupOrderListFilters,
  pickupOrderStatusLabel,
  pickupOrderStatusBadge,
  canConfirmPickupOrder,
  canAssignPickupOrder,
  canReceivePickupOrder,
  canCancelPickupOrder,
  canEditPickupOrder,
  getPickupOrderErrorMessage,
} from "@/services/pickupOrderService";
import {
  formatBs,
  paymentTypeLabel,
  paymentTypeBadge,
  servicePointTypeLabel,
  vehicleTypeLabel,
} from "@/services/logisticsEnums";
import { formatDate } from "@/utils/datetime";
import RecojoForm from "./RecojoForm";
import RecojoDetailModal from "./RecojoDetailModal";
import AsignarConductorModal from "./AsignarConductorModal";
import RecibirRecojoModal from "./RecibirRecojoModal";

const DEFAULT_PER_PAGE = 10;

interface RecojosViewProps {
  /**
   * `empresa`: la vista del `usuarioempresa` — pide recojos y sigue los suyos.
   * `mostrador`: la del admin/superadmin — confirma, asigna y recibe.
   */
  perfil: "empresa" | "mostrador";
}

// Las pestañas siguen el flujo de trabajo del mostrador: primero lo que hay que
// aprobar, después lo que hay que salir a buscar, después lo que ya está acá.
const STATUS_TABS: { value: PickupOrderStatus | "all"; label: string }[] = [
  { value: "Requested", label: "Por confirmar" },
  { value: "Confirmed", label: "Por asignar" },
  { value: "Collected", label: "Por recibir" },
  { value: "all", label: "Todas" },
];

const headerClass =
  "px-5 py-3 text-start text-xs font-semibold uppercase text-gray-500 dark:text-gray-400";
const headerRightClass =
  "px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400";

export default function RecojosView({ perfil }: RecojosViewProps) {
  const { showToast } = useToast();
  const { isSuperAdminUser } = useAuth();
  const formModal = useModal();
  const detailModal = useModal();
  const assignModal = useModal();
  const receiveModal = useModal();
  const { pending: acting, run: runAction } = useSubmitLock();

  const esMostrador = perfil === "mostrador";

  const [orders, setOrders] = useState<PickupOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const [status, setStatus] = useState<PickupOrderStatus | "all">(
    esMostrador ? "Requested" : "all"
  );
  // La AGENDA: por fecha de recojo, no por fecha de creación. Es la pregunta que
  // se hace el mostrador — "¿qué hay que salir a buscar?".
  const [agenda, setAgenda] = useState<DateRange>(() => todayRange());
  const [porAgenda, setPorAgenda] = useState(esMostrador);

  const [selected, setSelected] = useState<PickupOrderListItem | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PickupOrder | null>(null);
  const [receiving, setReceiving] = useState<PickupOrder | null>(null);

  const baseFilters: PickupOrderListFilters = useMemo(
    () => ({
      ...(status !== "all" ? { status } : {}),
      ...(porAgenda && agenda.from ? { pickupDateFrom: agenda.from } : {}),
      ...(porAgenda && agenda.to ? { pickupDateTo: agenda.to } : {}),
    }),
    [status, porAgenda, agenda.from, agenda.to]
  );

  // Los contadores comparten los filtros de la agenda, para que las pestañas y
  // la lista hablen siempre del mismo conjunto.
  const countFilters: PickupOrderListFilters = useMemo(
    () => ({
      ...(porAgenda && agenda.from ? { pickupDateFrom: agenda.from } : {}),
      ...(porAgenda && agenda.to ? { pickupDateTo: agenda.to } : {}),
    }),
    [porAgenda, agenda.from, agenda.to]
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pickupOrderService.getPickupOrders(page, perPage, baseFilters);
      setOrders(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Error fetching pickup orders", err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, baseFilters]);

  const fetchCounts = useCallback(async () => {
    try {
      // Desde el `count` del servidor, no contando filas: el backend recorta
      // `perPage` y contar en memoria da de menos sin avisar.
      const res = await pickupOrderService.getCounts(countFilters);
      setCounts(res);
    } catch (err) {
      console.error("Error fetching pickup order counts", err);
    }
  }, [countFilters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Cualquier cambio de filtro vuelve a la página 1: filtrar estando en la 4
  // muestra una tabla vacía.
  const handleStatusChange = (value: string) => {
    setStatus(value as PickupOrderStatus | "all");
    setPage(1);
  };

  const handleAgendaChange = (range: DateRange) => {
    setAgenda(range);
    setPage(1);
  };

  const refresh = () => {
    fetchOrders();
    fetchCounts();
  };

  // ─── Acciones ─────────────────────────────────────────────────────────────

  const handleConfirm = (order: PickupOrderListItem) => {
    runAction(async () => {
      try {
        await pickupOrderService.changeStatus(order.id, { status: "Confirmed" });
        showToast(
          "success",
          "Solicitud confirmada",
          `${order.code} ya se le puede asignar a un conductor.`
        );
        refresh();
      } catch (err) {
        showToast(
          "error",
          "Error",
          getPickupOrderErrorMessage(err, "No se pudo confirmar la solicitud.")
        );
      }
    });
  };

  const handleCancel = (order: PickupOrderListItem) => {
    // El motivo es obligatorio (`pickuporder.cancellationreason.required`), así
    // que se pide antes de llamar en vez de rebotar después.
    const reason = window.prompt(`¿Por qué se anula ${order.code}?`);
    if (reason === null) return;
    if (!reason.trim()) {
      showToast("error", "Falta el motivo", "Para anular hay que indicar por qué.");
      return;
    }

    runAction(async () => {
      try {
        await pickupOrderService.changeStatus(order.id, {
          status: "Cancelled",
          cancellationReason: reason.trim(),
        });
        showToast("success", "Solicitud anulada", `${order.code} quedó anulada.`);
        refresh();
      } catch (err) {
        showToast(
          "error",
          "Error",
          getPickupOrderErrorMessage(err, "No se pudo anular la solicitud.")
        );
      }
    });
  };

  const openAssign = (order: PickupOrderListItem) => {
    setSelected(order);
    assignModal.openModal();
  };

  const openDetail = (id: string) => {
    setDetailId(id);
    detailModal.openModal();
  };

  /** Editar y recibir necesitan la solicitud COMPLETA, que el listado no trae. */
  const openWithFullOrder = async (
    id: string,
    onLoaded: (order: PickupOrder) => void
  ) => {
    try {
      const full = await pickupOrderService.getPickupOrderById(id);
      onLoaded(full);
    } catch (err) {
      showToast(
        "error",
        "Error",
        getPickupOrderErrorMessage(err, "No se pudo cargar la solicitud.")
      );
    }
  };

  const openEdit = (order: PickupOrderListItem) =>
    openWithFullOrder(order.id, (full) => {
      setEditing(full);
      formModal.openModal();
    });

  const openReceive = (order: PickupOrderListItem) =>
    openWithFullOrder(order.id, (full) => {
      setReceiving(full);
      receiveModal.openModal();
    });

  const openNew = () => {
    setEditing(null);
    formModal.openModal();
  };

  const statusTabs: TabItem[] = STATUS_TABS.map((tab) => ({
    value: tab.value,
    label: tab.label,
    count: tab.value === "all" ? undefined : counts[tab.value],
  }));

  const rowOffset = (page - 1) * perPage;
  const colSpan = esMostrador ? 8 : 7;

  return (
    <div>
      <PageBreadcrumb pageTitle="Solicitudes de Recojo" />
      <p className="-mt-3 mb-6 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
        {esMostrador
          ? "Lo que hay que salir a buscar. Una solicitud se confirma, se le asigna un conductor y se cierra cuando el paquete llega al mostrador y se lo pesa."
          : "Pedí que un conductor pase a buscar un paquete por tu domicilio. La sucursal confirma la solicitud antes de salir."}
      </p>

      <ComponentCard>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs items={statusTabs} value={status} onChange={handleStatusChange} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={porAgenda}
                onChange={(e) => {
                  setPorAgenda(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
              />
              Filtrar por fecha de recojo
            </label>
            {porAgenda && (
              <ShipmentDateRangeFilter
                className="sm:w-64"
                value={agenda}
                onChange={handleAgendaChange}
              />
            )}
            <Button size="sm" onClick={openNew} className="shrink-0">
              Solicitar recojo
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                <TableRow>
                  <TableCell isHeader className={headerRightClass}>Nro</TableCell>
                  <TableCell isHeader className={headerClass}>Recojo</TableCell>
                  <TableCell isHeader className={headerClass}>Código</TableCell>
                  <TableCell isHeader className={headerClass}>Dónde buscarlo</TableCell>
                  <TableCell isHeader className={headerClass}>Destino</TableCell>
                  <TableCell isHeader className={headerClass}>Conductor</TableCell>
                  <TableCell isHeader className={headerRightClass}>Estimado</TableCell>
                  {esMostrador && <TableCell isHeader className={headerClass}>{""}</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} className="px-5 py-10 text-center text-sm text-gray-500">
                      Cargando solicitudes…
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} className="px-5 py-10 text-center text-sm text-gray-500">
                      {porAgenda
                        ? "No hay recojos agendados para esas fechas."
                        : "No hay solicitudes para mostrar."}
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order, index) => (
                    <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                      <TableCell className="w-14 whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm tabular-nums text-gray-400">
                        {rowOffset + index + 1}
                      </TableCell>

                      <TableCell className="whitespace-nowrap px-5 py-4 align-middle">
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {formatDate(order.pickupDate)}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {order.pickupWindowStart.slice(0, 5)} –{" "}
                          {order.pickupWindowEnd.slice(0, 5)}
                        </p>
                      </TableCell>

                      <TableCell className="whitespace-nowrap px-5 py-4 align-middle">
                        <button
                          type="button"
                          onClick={() => openDetail(order.id)}
                          className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {order.code}
                        </button>
                        <div className="mt-1 flex flex-col items-start gap-1">
                          <Badge size="sm" color={pickupOrderStatusBadge(order.status)}>
                            {pickupOrderStatusLabel(order.status)}
                          </Badge>
                          {order.isExpress && (
                            <Badge size="sm" color="error">Expreso</Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-4 align-middle">
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {order.senderName}
                        </p>
                        <p className="mt-0.5 max-w-[220px] truncate text-xs text-gray-500 dark:text-gray-400">
                          {order.pickupAddress}
                        </p>
                        {esMostrador && order.supplierName && (
                          <p className="mt-0.5 text-xs text-gray-400">{order.supplierName}</p>
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-4 align-middle">
                        <p className="text-theme-sm text-gray-700 dark:text-gray-300">
                          {order.recipientName}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {servicePointTypeLabel(order.destinationPointType)}
                          {order.destinationBranchOfficeCode
                            ? ` · ${order.destinationBranchOfficeCode}`
                            : ""}
                        </p>
                      </TableCell>

                      <TableCell className="px-5 py-4 align-middle">
                        {order.driverFullName ? (
                          <>
                            <p className="text-theme-sm text-gray-700 dark:text-gray-300">
                              {order.driverFullName}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {vehicleTypeLabel(order.requestedVehicleType)}
                            </p>
                          </>
                        ) : (
                          <span className="text-theme-sm text-gray-400">
                            {vehicleTypeLabel(order.requestedVehicleType)} · sin asignar
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle">
                        <p className="text-theme-sm font-medium tabular-nums text-gray-800 dark:text-gray-200">
                          {formatBs(order.estimatedPrice)}
                        </p>
                        <div className="mt-1 flex justify-end">
                          <Badge size="sm" color={paymentTypeBadge(order.paymentType)}>
                            {paymentTypeLabel(order.paymentType)}
                          </Badge>
                        </div>
                      </TableCell>

                      {esMostrador && (
                        <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle">
                          {/* Cada acción solo aparece en el estado que la admite:
                              ofrecerla y fallar es peor que no ofrecerla. */}
                          <div className="flex justify-end gap-1">
                            {canConfirmPickupOrder(order.status) && (
                              <button
                                type="button"
                                disabled={acting}
                                onClick={() => handleConfirm(order)}
                                className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
                              >
                                Confirmar
                              </button>
                            )}
                            {canAssignPickupOrder(order.status) && (
                              <button
                                type="button"
                                onClick={() => openAssign(order)}
                                className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
                              >
                                Asignar
                              </button>
                            )}
                            {canReceivePickupOrder(order.status) && (
                              <button
                                type="button"
                                onClick={() => openReceive(order)}
                                className="rounded-lg bg-success-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success-600"
                              >
                                Recibir
                              </button>
                            )}
                            {canEditPickupOrder(order.status) && (
                              <button
                                type="button"
                                onClick={() => openEdit(order)}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                Editar
                              </button>
                            )}
                            {canCancelPickupOrder(order.status) && (
                              <button
                                type="button"
                                disabled={acting}
                                onClick={() => handleCancel(order)}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:hover:bg-error-500/10"
                              >
                                Anular
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

        {isSuperAdminUser && (
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            Estás viendo las solicitudes de todas las sucursales.
          </p>
        )}
      </ComponentCard>

      <Modal isOpen={formModal.isOpen} onClose={formModal.closeModal} className="m-4 max-w-[880px] z-50">
        {formModal.isOpen && (
          <RecojoForm
            key={editing?.id ?? "nueva"}
            pickupOrder={editing}
            onClose={formModal.closeModal}
            onSaved={refresh}
          />
        )}
      </Modal>

      <Modal isOpen={detailModal.isOpen} onClose={detailModal.closeModal} className="m-4 max-w-[640px] z-50">
        {detailModal.isOpen && detailId && (
          <RecojoDetailModal
            key={detailId}
            pickupOrderId={detailId}
            onClose={detailModal.closeModal}
          />
        )}
      </Modal>

      <Modal isOpen={assignModal.isOpen} onClose={assignModal.closeModal} className="m-4 max-w-[520px] z-50">
        {assignModal.isOpen && selected && (
          <AsignarConductorModal
            key={selected.id}
            pickupOrderId={selected.id}
            pickupOrderCode={selected.code}
            requestedVehicleType={selected.requestedVehicleType}
            pickupDate={selected.pickupDate}
            pickupWindowStart={selected.pickupWindowStart}
            pickupWindowEnd={selected.pickupWindowEnd}
            onClose={assignModal.closeModal}
            onSaved={refresh}
          />
        )}
      </Modal>

      <Modal isOpen={receiveModal.isOpen} onClose={receiveModal.closeModal} className="m-4 max-w-[720px] z-50">
        {receiveModal.isOpen && receiving && (
          <RecibirRecojoModal
            key={receiving.id}
            pickupOrder={receiving}
            onClose={receiveModal.closeModal}
            onSaved={refresh}
          />
        )}
      </Modal>
    </div>
  );
}
