"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useAuth } from "@/context/AuthContext";
import { PlusIcon } from "@/icons";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import ShipmentDateRangeFilter, {
  DateRange,
  lastWeekRange,
} from "@/components/envios/ShipmentDateRangeFilter";
import {
  manifestService,
  Manifest,
  ManifestListFilters,
  ManifestStatus,
  MANIFEST_STATUS_LABELS,
  manifestStatusLabel,
  manifestStatusBadge,
} from "@/services/manifestService";
import CreateManifestModal from "./CreateManifestModal";

const DEFAULT_PER_PAGE = 10;

interface ManifiestosViewProps {
  // Prefijo de ruta del detalle: cada rol vive en su propio árbol de rutas
  // (`/manifiestos` para el superadmin, `/admin/manifiestos` para el admin).
  basePath: string;
}

const STATUS_TABS: TabItem[] = [
  { value: "", label: "Todos" },
  ...(Object.entries(MANIFEST_STATUS_LABELS) as [ManifestStatus, string][]).map(
    ([value, label]) => ({ value, label })
  ),
];

export default function ManifiestosView({ basePath }: ManifiestosViewProps) {
  const router = useRouter();
  const { branchOfficeCode, branchOfficeCity, isSuperAdminUser } = useAuth();
  const createModal = useModal();

  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [status, setStatus] = useState<ManifestStatus | "">("");
  const [dateRange, setDateRange] = useState<DateRange>(() => lastWeekRange());

  const filters: ManifestListFilters = useMemo(
    () => ({
      ...(status ? { status } : {}),
      ...(dateRange.from ? { dateFrom: dateRange.from } : {}),
      ...(dateRange.to ? { dateTo: dateRange.to } : {}),
    }),
    [status, dateRange.from, dateRange.to]
  );

  const fetchManifests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await manifestService.getManifests(currentPage, perPage, filters);
      setManifests(res.data);
      setTotalPages(res.totalPages);
      setTotalCount(res.count);
    } catch (err) {
      console.error("Error fetching manifests", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, filters]);

  useEffect(() => {
    fetchManifests();
  }, [fetchManifests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [perPage, filters]);

  const branchLabel = [branchOfficeCode, branchOfficeCity].filter(Boolean).join(" — ");
  const openCount = manifests.filter((m) => m.status === "Open").length;

  return (
    <div>
      <PageBreadcrumb pageTitle="Manifiestos" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Manifiestos en el período</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "—" : totalCount}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Abiertos en esta página</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "—" : openCount}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {isSuperAdminUser ? "Alcance" : "Mi sucursal"}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
            {isSuperAdminUser ? "Todas las sucursales" : branchLabel || "Sin sucursal"}
          </p>
        </div>
      </div>

      <ComponentCard
        title="Lotes de transporte"
        desc="Cada manifiesto agrupa los envíos que viajan juntos entre dos sucursales. Despacharlo o recibirlo mueve todos sus envíos de una sola vez."
      >
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <Tabs items={STATUS_TABS} value={status} onChange={(v) => setStatus(v as ManifestStatus | "")} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <ShipmentDateRangeFilter className="sm:w-64" value={dateRange} onChange={setDateRange} />
            <Button startIcon={<PlusIcon />} onClick={createModal.openModal} className="shrink-0">
              Nuevo manifiesto
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                <TableRow>
                  {["Código", "Ruta", "Estado", "Envíos", "Transporte", "Salida", "Creado", ""].map((h, i) => (
                    <TableCell
                      key={`${h}-${i}`}
                      isHeader
                      className="px-5 py-3 text-start text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <TableRow>
                    <TableCell className="px-5 py-10 text-center text-sm text-gray-500">
                      Cargando manifiestos…
                    </TableCell>
                  </TableRow>
                ) : manifests.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-5 py-10 text-center text-sm text-gray-500">
                      No hay manifiestos en este período.
                    </TableCell>
                  </TableRow>
                ) : (
                  manifests.map((manifest) => (
                    <TableRow
                      key={manifest.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/20"
                    >
                      <TableCell className="px-5 py-3">
                        <Link
                          href={`${basePath}/${manifest.id}`}
                          className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 hover:text-brand-500 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {manifest.code}
                        </Link>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                        {manifest.originBranchOfficeCode} &rarr; {manifest.destinationBranchOfficeCode}
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <Badge size="sm" color={manifestStatusBadge(manifest.status)}>
                          {manifestStatusLabel(manifest.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {manifest.shipmentCount ?? "—"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {manifest.transportReference || "—"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {manifest.departureAt
                          ? new Date(manifest.departureAt).toLocaleString("es-BO")
                          : "—"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(manifest.createdAt).toLocaleDateString("es-BO")}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <Link
                          href={`${basePath}/${manifest.id}`}
                          className="text-sm font-medium text-brand-500 hover:text-brand-600"
                        >
                          Ver
                        </Link>
                      </TableCell>
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
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              perPage={perPage}
              onPerPageChange={setPerPage}
            />
          </div>
        )}
      </ComponentCard>

      <Modal isOpen={createModal.isOpen} onClose={createModal.closeModal} className="m-4 max-w-[520px] z-50">
        {createModal.isOpen && (
          <CreateManifestModal
            onClose={createModal.closeModal}
            // Recién creado está vacío: lo útil es ir directo a cargarle envíos.
            onCreated={(manifest) => router.push(`${basePath}/${manifest.id}`)}
          />
        )}
      </Modal>
    </div>
  );
}
