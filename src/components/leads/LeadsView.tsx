"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import ShipmentDateRangeFilter, {
  DateRange,
  lastWeekRange,
} from "@/components/envios/ShipmentDateRangeFilter";
import {
  leadService,
  LeadListItem,
  LeadListFilters,
  LeadStatus,
  LEAD_STATUS_FILTER_OPTIONS,
  LEAD_MAX_PER_PAGE,
  leadStatusLabel,
  leadStatusBadge,
  getLeadErrorMessage,
} from "@/services/leadService";
import {
  BolivianDepartment,
  BOLIVIAN_DEPARTMENT_LABELS,
} from "@/services/supplierService";
import { downloadCsv, timestampedFilename, CsvColumn } from "@/utils/csvExport";
import LeadStatusModal from "./LeadStatusModal";
import LeadDetailModal from "./LeadDetailModal";
import { formatDateTime } from "@/utils/datetime";

const DEFAULT_PER_PAGE = 10;

const STATUS_TABS: TabItem[] = [
  { value: "", label: "Todos" },
  ...LEAD_STATUS_FILTER_OPTIONS,
];

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const CSV_COLUMNS: CsvColumn<LeadListItem>[] = [
  { header: "Fecha", value: (l) => formatDateTime(l.createdAt) },
  { header: "Compañía", value: (l) => l.companyName },
  { header: "Contacto", value: (l) => l.contactFullName },
  { header: "Correo", value: (l) => l.contactEmail },
  { header: "Teléfono", value: (l) => l.contactPhone },
  { header: "Ciudad", value: (l) => BOLIVIAN_DEPARTMENT_LABELS[l.city] ?? l.city },
  { header: "Estado", value: (l) => leadStatusLabel(l.status) },
  { header: "Responsable", value: (l) => l.assignedToFullName ?? "" },
];

export default function LeadsView() {
  const { showToast } = useToast();
  // El backend acota al admin a los leads de su departamento e ignora el filtro
  // `city` que mande. Por eso el selector de ciudad solo se le muestra al
  // superadmin: para un admin sería un control que no hace nada.
  const { isSuperAdminUser } = useAuth();

  const detailModal = useModal();
  const statusModal = useModal();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [status, setStatus] = useState<LeadStatus | "">("");
  const [city, setCity] = useState<BolivianDepartment | "">("");
  const [dateRange, setDateRange] = useState<DateRange>(() => lastWeekRange());
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // El backend busca sobre la tabla entera, así que cada tecla sería una
  // consulta: se espera a que el usuario deje de escribir.
  useEffect(() => {
    const handle = setTimeout(() => setSearchTerm(searchInput.trim()), 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const filters: LeadListFilters = useMemo(
    () => ({
      ...(status ? { status } : {}),
      ...(isSuperAdminUser && city ? { city } : {}),
      ...(dateRange.from ? { dateFrom: dateRange.from } : {}),
      ...(dateRange.to ? { dateTo: dateRange.to } : {}),
      ...(searchTerm ? { searchTerm } : {}),
    }),
    [status, city, dateRange.from, dateRange.to, searchTerm, isSuperAdminUser]
  );

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leadService.getLeads(currentPage, perPage, filters);
      setLeads(res.data);
      setTotalPages(res.totalPages);
      setTotalCount(res.count);
    } catch (err) {
      showToast(
        "error",
        "Error",
        getLeadErrorMessage(err, "No se pudieron cargar los clientes potenciales.")
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, filters, showToast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    setCurrentPage(1);
  }, [perPage, filters]);

  // La exportación pide una página grande con los MISMOS filtros que se ven en
  // pantalla: exportar algo distinto de lo que el usuario está mirando sorprende.
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await leadService.getLeads(1, LEAD_MAX_PER_PAGE, filters);
      if (res.data.length === 0) {
        showToast("warning", "Nada que exportar", "No hay clientes potenciales con estos filtros.");
        return;
      }
      downloadCsv(timestampedFilename("leads_aircargo"), res.data, CSV_COLUMNS);
      showToast(
        "success",
        "Archivo generado",
        res.count > res.data.length
          ? `Se exportaron ${res.data.length} de ${res.count}. Afiná los filtros para el resto.`
          : `Se exportaron ${res.data.length} registro(s).`
      );
    } catch (err) {
      showToast("error", "Error", getLeadErrorMessage(err, "No se pudo generar el archivo."));
    } finally {
      setExporting(false);
    }
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    detailModal.openModal();
  };

  const openStatus = (id: string) => {
    setSelectedId(id);
    statusModal.openModal();
  };

  const selectedLead = leads.find((l) => l.id === selectedId);
  const newCount = leads.filter((l) => l.status === "New").length;

  return (
    <div>
      <PageBreadcrumb pageTitle="Clientes Potenciales (Leads)" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Solicitudes en el período
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "—" : totalCount}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Sin atender en esta página
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "—" : newCount}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Alcance</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
            {isSuperAdminUser ? "Todo el país" : "Mi departamento"}
          </p>
        </div>
      </div>

      <ComponentCard
        title="Solicitudes desde la web"
        desc="Empresas que dejaron sus datos en el formulario de contacto de la landing. Cambiar el estado te deja el registro a cargo."
      >
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <Tabs items={STATUS_TABS} value={status} onChange={(v) => setStatus(v as LeadStatus | "")} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative sm:w-56">
              <input
                type="text"
                placeholder="Compañía, contacto o correo…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 pl-10 text-sm text-gray-800 placeholder:text-gray-400 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
              <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {isSuperAdminUser && (
              <div className="sm:w-44">
                <select
                  className={selectClassName}
                  value={city}
                  onChange={(e) => setCity(e.target.value as BolivianDepartment | "")}
                >
                  <option value="">Todas las ciudades</option>
                  {(
                    Object.entries(BOLIVIAN_DEPARTMENT_LABELS) as [BolivianDepartment, string][]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <ShipmentDateRangeFilter className="sm:w-60" value={dateRange} onChange={setDateRange} />

            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-success-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-success-700 disabled:opacity-50"
            >
              {exporting ? "Generando…" : "Exportar CSV"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                <TableRow>
                  {["Fecha", "Compañía", "Contacto", "Ciudad", "Teléfono", "Estado", "Responsable", ""].map(
                    (h, i) => (
                      <TableCell
                        key={`${h}-${i}`}
                        isHeader
                        className="px-5 py-3 text-start text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
                      >
                        {h}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <TableRow>
                    <TableCell className="px-5 py-10 text-center text-sm text-gray-500">
                      Cargando clientes potenciales…
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-5 py-10 text-center text-sm text-gray-500">
                      No hay solicitudes con estos filtros.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/20"
                    >
                      <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {formatDateTime(lead.createdAt)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {lead.companyName}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {lead.contactFullName}
                        <br />
                        <a
                          href={`mailto:${lead.contactEmail}`}
                          className="text-xs text-gray-400 hover:text-brand-500"
                        >
                          {lead.contactEmail}
                        </a>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {BOLIVIAN_DEPARTMENT_LABELS[lead.city] ?? lead.city}
                      </TableCell>
                      <TableCell className="px-5 py-3 font-mono text-sm text-gray-600 dark:text-gray-300">
                        <a href={`tel:${lead.contactPhone}`} className="hover:text-brand-500">
                          {lead.contactPhone}
                        </a>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm">
                        <Badge size="sm" color={leadStatusBadge(lead.status)}>
                          {leadStatusLabel(lead.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {lead.assignedToFullName ?? "—"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(lead.id)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/[0.05] dark:hover:text-white"
                          >
                            Ver
                          </button>
                          <button
                            type="button"
                            onClick={() => openStatus(lead.id)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-500 transition-colors hover:bg-brand-50 dark:hover:bg-brand-500/10"
                          >
                            Gestionar
                          </button>
                        </div>
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

      <Modal isOpen={detailModal.isOpen} onClose={detailModal.closeModal} className="m-4 max-w-[560px] z-50">
        {detailModal.isOpen && selectedId && (
          <LeadDetailModal key={selectedId} leadId={selectedId} onClose={detailModal.closeModal} />
        )}
      </Modal>

      <Modal isOpen={statusModal.isOpen} onClose={statusModal.closeModal} className="m-4 max-w-[480px] z-50">
        {statusModal.isOpen && selectedLead && (
          <LeadStatusModal
            key={selectedLead.id}
            lead={selectedLead}
            onClose={statusModal.closeModal}
            onSaved={fetchLeads}
          />
        )}
      </Modal>
    </div>
  );
}
