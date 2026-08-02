"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/button/Button";
import { TrashBinIcon, GroupIcon } from "@/icons";

import { User, userService } from "@/services/userService";
import { CONDUCTOR_ROLE_ID } from "@/services/roleService";
import { branchOfficeService } from "@/services/branchOfficeService"; // asumiendo que existe, sino podemos extraer únicas

import ConductoresSummary from "./ConductoresSummary";
import ConductoresToolbar from "./ConductoresToolbar";
import ConductoresList from "./ConductoresList";
import ConductorForm from "./ConductorForm";

const DEFAULT_PER_PAGE = 8;
const SEARCH_BATCH_SIZE = 500;

export default function ConductoresTable() {
  const { showToast } = useToast();
  const formModal = useModal();
  const deleteModal = useModal();

  // ─── Data State ──────────────────────────────────────────────────────────
  const [allConductores, setAllConductores] = useState<User[]>([]);
  const [batchLoading, setBatchLoading] = useState(true);

  // ─── Filters & Pagination ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [selectedConductor, setSelectedConductor] = useState<User | null>(null);

  // ─── Fetch Logic ─────────────────────────────────────────────────────────

  const fetchBatch = useCallback(async () => {
    setBatchLoading(true);
    try {
      // Obtenemos lote grande de usuarios
      const res = await userService.getUsers(1, SEARCH_BATCH_SIZE);
      
      // Filtramos solo los que tienen el rol de Conductor
      const drivers = res.data.filter(u => u.roleId === CONDUCTOR_ROLE_ID);
      
      setAllConductores(drivers);
    } catch (err) {
      console.error("Error fetching conductores", err);
      showToast("error", "Error", "No se pudieron cargar los conductores.");
    } finally {
      setBatchLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  // Resetear página 1 al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, branchFilter, perPage]);

  // ─── Client-side Filtering ───────────────────────────────────────────────

  const filteredConductores = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allConductores.filter((c) => {
      // 1. Filter by Branch
      if (branchFilter && c.branchOfficeId !== branchFilter) return false;

      // 2. Search Term (Name, Email, DNI)
      const matchesSearch =
        !term ||
        c.fullName.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        (c.dni && c.dni.toLowerCase().includes(term));

      return matchesSearch;
    });
  }, [allConductores, searchTerm, branchFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredConductores.length / perPage));
  const paginated = filteredConductores.slice((currentPage - 1) * perPage, currentPage * perPage);

  const clearFilters = () => {
    setSearchTerm("");
    setBranchFilter("");
    setCurrentPage(1);
  };

  // ─── Options & Stats ─────────────────────────────────────────────────────

  // Extraer sucursales únicas para el selector de filtros
  const uniqueBranches = useMemo(() => {
    const branchesMap = new Map<string, string>();
    allConductores.forEach(c => {
      if (c.branchOfficeId && c.branchOfficeCity) {
        branchesMap.set(c.branchOfficeId, c.branchOfficeCity);
      }
    });
    const options = [{ value: "", label: "Todas las sucursales" }];
    branchesMap.forEach((city, id) => {
      options.push({ value: id, label: city });
    });
    return options;
  }, [allConductores]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const openCreate = useCallback(() => { setSelectedConductor(null); setFormMode("create"); formModal.openModal(); }, [formModal]);
  const openView = useCallback((user: User) => { setSelectedConductor(user); setFormMode("view"); formModal.openModal(); }, [formModal]);
  const openEdit = useCallback((user: User) => { setSelectedConductor(user); setFormMode("edit"); formModal.openModal(); }, [formModal]);
  const askDelete = useCallback((user: User) => { setSelectedConductor(user); deleteModal.openModal(); }, [deleteModal]);

  const { pending: deleting, run: runDelete } = useSubmitLock();

  const handleDelete = () =>
    runDelete(async () => {
      if (!selectedConductor) return;
      try {
        await userService.deleteUser(selectedConductor.id);
        showToast("success", "Conductor eliminado", "El registro ha sido eliminado exitosamente.");
        deleteModal.closeModal();
        fetchBatch();
      } catch (error: unknown) {
        showToast("error", "Error al eliminar", error instanceof Error ? error.message : "No se pudo eliminar al conductor.");
      }
    });

  return (
    <div className="space-y-6">
      <ConductoresSummary
        totalConductores={allConductores.length}
        sucursalesActivas={uniqueBranches.length - 1} // Restamos la opción "Todas"
        loading={batchLoading}
      />

      <ConductoresToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        branchFilter={branchFilter}
        onBranchChange={setBranchFilter}
        branchOptions={uniqueBranches}
        onClearFilters={clearFilters}
        onAddConductor={openCreate}
      />

      <ConductoresList
        conductores={paginated}
        loading={batchLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={setPerPage}
        onView={openView}
        onEdit={openEdit}
        onDelete={askDelete}
      />

      {/* Form Modal */}
      <Modal isOpen={formModal.isOpen} onClose={formModal.closeModal} className="max-w-[600px] m-4 z-50">
        {formModal.isOpen && (
          <ConductorForm
            key={selectedConductor?.id ?? "new"}
            mode={formMode}
            initialData={selectedConductor}
            onClose={formModal.closeModal}
            onSaved={fetchBatch}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[420px] m-4 z-50">
        <div className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-error-50 dark:bg-error-500/10">
            <TrashBinIcon className="size-6 text-error-500" />
          </div>
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Eliminar Conductor
          </h4>
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            ¿Estás segura de eliminar a este conductor del sistema?
          </p>
          {selectedConductor && (
            <div className="mb-5 mt-3 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex items-center gap-3">
               <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 font-bold">
                 {selectedConductor.fullName.charAt(0)}
               </div>
               <div>
                 <p className="font-medium text-gray-800 dark:text-white/90">{selectedConductor.fullName}</p>
                 <p className="text-gray-500 dark:text-gray-400 mt-1">{selectedConductor.email}</p>
               </div>
            </div>
          )}
          <p className="mb-6 text-xs text-error-500">Esta acción no se puede deshacer y el conductor ya no tendrá acceso al sistema móvil.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={deleteModal.closeModal} disabled={deleting}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-error-500 hover:bg-error-600 text-white border-transparent">
              {deleting ? "Eliminando…" : "Sí, eliminar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
