"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import {
  pricingService,
  ShippingRate,
  DoorServiceRate,
  isCurrentRate,
  rateSupplierLabel,
} from "@/services/pricingService";
import {
  driverSettlementService,
  DriverCommissionRate,
} from "@/services/driverSettlementService";
import { driverTypeLabel } from "@/services/driverService";
import {
  vehicleTypeLabel,
  formatBs,
} from "@/services/logisticsEnums";
import { driverTaskKindLabel } from "@/services/driverTaskService";
import { BOLIVIAN_DEPARTMENT_LABELS, BolivianDepartment } from "@/services/supplierService";
import { formatDate } from "@/utils/datetime";
import NuevaTarifaModal, { TarifaKind } from "./NuevaTarifaModal";

const DEFAULT_PER_PAGE = 10;

const TABS: TabItem[] = [
  { value: "shipping", label: "Flete" },
  { value: "door", label: "Servicio a domicilio" },
  { value: "commission", label: "Comisiones" },
];

const departmentLabel = (value: string): string =>
  BOLIVIAN_DEPARTMENT_LABELS[value as BolivianDepartment] ?? value;

/** `Vigente` o el rango cerrado. Es lo que hace legible un tarifario histórico. */
function VigenciaCell({ rate }: { rate: { validFrom: string; validTo?: string | null } }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="whitespace-nowrap text-theme-sm text-gray-600 dark:text-gray-300">
        Desde {formatDate(rate.validFrom)}
      </span>
      {isCurrentRate(rate) ? (
        <Badge size="sm" color="success">
          Vigente
        </Badge>
      ) : (
        <span className="whitespace-nowrap text-xs text-gray-400">
          hasta {formatDate(rate.validTo!)}
        </span>
      )}
    </div>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="px-5 py-10 text-center text-sm text-gray-500">
        {text}
      </TableCell>
    </TableRow>
  );
}

const headerClass =
  "px-5 py-3 text-start text-xs font-semibold uppercase text-gray-500 dark:text-gray-400";
const headerRightClass =
  "px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400";
const cellClass = "px-5 py-4 align-middle text-theme-sm text-gray-600 dark:text-gray-300";
const cellRightClass =
  "whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm tabular-nums text-gray-700 dark:text-gray-200";

/**
 * Tarifario del superadmin.
 *
 * Una tarifa NO se edita: se crea la siguiente vigencia y el backend cierra sola
 * la que regía para esa misma clave. Por eso acá no hay lápiz de editar ni papelera
 * — hay un botón de "nueva vigencia" y el histórico completo a la vista.
 */
export default function TarifasView() {
  const [tab, setTab] = useState<TarifaKind>("shipping");
  const nuevaModal = useModal();

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [doorRates, setDoorRates] = useState<DoorServiceRate[]>([]);
  const [commissionRates, setCommissionRates] = useState<DriverCommissionRate[]>([]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "shipping") {
        const res = await pricingService.getShippingRates(page, perPage);
        setShippingRates(res.data);
        setTotalPages(res.totalPages);
      } else if (tab === "door") {
        const res = await pricingService.getDoorServiceRates(page, perPage);
        setDoorRates(res.data);
        setTotalPages(res.totalPages);
      } else {
        const res = await driverSettlementService.getCommissionRates(page, perPage);
        setCommissionRates(res.data);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error("Error fetching rates", err);
    } finally {
      setLoading(false);
    }
  }, [tab, page, perPage]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Cambiar de tarifario vuelve a la página 1: la 4 de flete no existe en puerta.
  const handleTabChange = (value: string) => {
    setTab(value as TarifaKind);
    setPage(1);
  };

  const rowOffset = (page - 1) * perPage;

  return (
    <div>
      <PageBreadcrumb pageTitle="Tarifas" />
      <p className="-mt-3 mb-6 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
        Una tarifa no se edita: se carga la siguiente vigencia y la anterior se cierra sola. El
        histórico queda a la vista para poder explicar qué precio regía en cada fecha.
      </p>

      <ComponentCard>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs items={TABS} value={tab} onChange={handleTabChange} />
          <Button size="sm" onClick={nuevaModal.openModal} className="shrink-0">
            Nueva vigencia
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="max-w-full overflow-x-auto">
            {tab === "shipping" && (
              <Table>
                <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <TableRow>
                    <TableCell isHeader className={headerRightClass}>Nro</TableCell>
                    <TableCell isHeader className={headerClass}>Vigencia</TableCell>
                    <TableCell isHeader className={headerClass}>Empresa</TableCell>
                    <TableCell isHeader className={headerClass}>Ruta</TableCell>
                    <TableCell isHeader className={headerClass}>Modo</TableCell>
                    <TableCell isHeader className={headerRightClass}>Primer kilo</TableCell>
                    <TableCell isHeader className={headerRightClass}>Kilo adicional</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading ? (
                    <EmptyRow colSpan={7} text="Cargando tarifas…" />
                  ) : shippingRates.length === 0 ? (
                    <EmptyRow
                      colSpan={7}
                      text="No hay tarifas de flete cargadas. Sin ellas el cotizador y el alta de envíos fallan."
                    />
                  ) : (
                    shippingRates.map((rate, index) => (
                      <TableRow key={rate.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                        <TableCell className="w-14 whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm tabular-nums text-gray-400">
                          {rowOffset + index + 1}
                        </TableCell>
                        <TableCell className="px-5 py-4 align-middle">
                          <VigenciaCell rate={rate} />
                        </TableCell>
                        <TableCell className={cellClass}>{rateSupplierLabel(rate)}</TableCell>
                        <TableCell className={cellClass}>
                          {departmentLabel(rate.originDepartment)} →{" "}
                          {departmentLabel(rate.destinationDepartment)}
                        </TableCell>
                        <TableCell className="px-5 py-4 align-middle">
                          <Badge size="sm" color={rate.isExpress ? "error" : "light"}>
                            {rate.isExpress ? "Expreso" : "Normal"}
                          </Badge>
                        </TableCell>
                        <TableCell className={cellRightClass}>
                          {formatBs(rate.firstKgPrice)}
                        </TableCell>
                        <TableCell className={cellRightClass}>
                          {formatBs(rate.additionalKgPrice)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {tab === "door" && (
              <Table>
                <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <TableRow>
                    <TableCell isHeader className={headerRightClass}>Nro</TableCell>
                    <TableCell isHeader className={headerClass}>Vigencia</TableCell>
                    <TableCell isHeader className={headerClass}>Empresa</TableCell>
                    <TableCell isHeader className={headerClass}>Departamento</TableCell>
                    <TableCell isHeader className={headerClass}>Vehículo</TableCell>
                    <TableCell isHeader className={headerRightClass}>Costo del viaje</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading ? (
                    <EmptyRow colSpan={6} text="Cargando tarifas…" />
                  ) : doorRates.length === 0 ? (
                    <EmptyRow
                      colSpan={6}
                      text="No hay tarifas de servicio a domicilio cargadas. Hace falta una por departamento y vehículo."
                    />
                  ) : (
                    doorRates.map((rate, index) => (
                      <TableRow key={rate.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                        <TableCell className="w-14 whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm tabular-nums text-gray-400">
                          {rowOffset + index + 1}
                        </TableCell>
                        <TableCell className="px-5 py-4 align-middle">
                          <VigenciaCell rate={rate} />
                        </TableCell>
                        <TableCell className={cellClass}>{rateSupplierLabel(rate)}</TableCell>
                        <TableCell className={cellClass}>
                          {departmentLabel(rate.department)}
                        </TableCell>
                        <TableCell className={cellClass}>
                          {vehicleTypeLabel(rate.vehicleType)}
                        </TableCell>
                        <TableCell className={cellRightClass}>{formatBs(rate.tripCost)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {tab === "commission" && (
              <Table>
                <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <TableRow>
                    <TableCell isHeader className={headerRightClass}>Nro</TableCell>
                    <TableCell isHeader className={headerClass}>Vigencia</TableCell>
                    <TableCell isHeader className={headerClass}>Conductor</TableCell>
                    <TableCell isHeader className={headerClass}>Vehículo</TableCell>
                    <TableCell isHeader className={headerClass}>Tarea</TableCell>
                    <TableCell isHeader className={headerRightClass}>Monto fijo</TableCell>
                    <TableCell isHeader className={headerRightClass}>% del cargo de puerta</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading ? (
                    <EmptyRow colSpan={7} text="Cargando comisiones…" />
                  ) : commissionRates.length === 0 ? (
                    <EmptyRow
                      colSpan={7}
                      text="No hay comisiones cargadas. Sin ellas los conductores esporádicos liquidan en cero."
                    />
                  ) : (
                    commissionRates.map((rate, index) => (
                      <TableRow key={rate.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                        <TableCell className="w-14 whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm tabular-nums text-gray-400">
                          {rowOffset + index + 1}
                        </TableCell>
                        <TableCell className="px-5 py-4 align-middle">
                          <VigenciaCell rate={rate} />
                        </TableCell>
                        <TableCell className={cellClass}>
                          {driverTypeLabel(rate.driverType)}
                        </TableCell>
                        <TableCell className={cellClass}>
                          {vehicleTypeLabel(rate.vehicleType)}
                        </TableCell>
                        <TableCell className={cellClass}>
                          {driverTaskKindLabel(rate.taskKind)}
                        </TableCell>
                        <TableCell className={cellRightClass}>
                          {formatBs(rate.fixedAmount)}
                        </TableCell>
                        <TableCell className={cellRightClass}>
                          {rate.percentOfDoorCharge.toFixed(2)} %
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
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

      <Modal
        isOpen={nuevaModal.isOpen}
        onClose={nuevaModal.closeModal}
        className="m-4 max-w-[560px] z-50"
      >
        {nuevaModal.isOpen && (
          <NuevaTarifaModal
            kind={tab}
            onClose={nuevaModal.closeModal}
            onSaved={() => {
              setPage(1);
              fetchRates();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
