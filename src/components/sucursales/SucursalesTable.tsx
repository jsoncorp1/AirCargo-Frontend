import React, { useEffect, useState, useCallback, useMemo } from "react";
import Pagination from "@/components/tables/Pagination";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";

import {
  branchOfficeService,
  BranchOffice,
  CreateBranchOfficeRequest,
} from "@/services/branchOfficeService";
import { BOLIVIAN_DEPARTMENT_LABELS } from "@/services/supplierService";

import SucursalesToolbar from "./SucursalesToolbar";
import SucursalesList from "./SucursalesList";
import SucursalFormModal from "./SucursalFormModal";
import SucursalDeleteModal from "./SucursalDeleteModal";

const DEFAULT_PER_PAGE = 10;
const SEARCH_BATCH_SIZE = 200; // Para permitir filtrado local (frontend)

export default function SucursalesTable() {
  const { showToast } = useToast();

  // --- Data States ---
  const [pageOffices, setPageOffices] = useState<BranchOffice[]>([]);
  const [pageTotalPages, setPageTotalPages] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);

  // --- Search/Filter States (Local) ---
  const [batchOffices, setBatchOffices] = useState<BranchOffice[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [hasFetchedBatch, setHasFetchedBatch] = useState(false);

  // --- Controls ---
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState("");

  // --- Modals ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<BranchOffice | null>(null);
  const [officeToDelete, setOfficeToDelete] = useState<BranchOffice | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { pending: submitting, run: runSubmit } = useSubmitLock();
  const { pending: deleting, run: runDelete } = useSubmitLock();

  const isFiltering = searchTerm.trim().length > 0;

  // 1. Fetch paginado normal
  const fetchPage = useCallback(async () => {
    if (isFiltering) return;
    setPageLoading(true);
    try {
      const res = await branchOfficeService.getBranchOffices(currentPage, perPage);
      setPageOffices(res.data);
      setPageTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "No se pudieron cargar las sucursales.");
    } finally {
      setPageLoading(false);
    }
  }, [currentPage, perPage, isFiltering, showToast]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // 2. Fetch de lote completo (solo al buscar)
  const fetchBatch = useCallback(async () => {
    if (hasFetchedBatch) return;
    setBatchLoading(true);
    try {
      const res = await branchOfficeService.getBranchOffices(1, SEARCH_BATCH_SIZE);
      setBatchOffices(res.data);
      setHasFetchedBatch(true);
    } catch (err) {
      console.error(err);
    } finally {
      setBatchLoading(false);
    }
  }, [hasFetchedBatch]);

  useEffect(() => {
    if (isFiltering && !hasFetchedBatch) {
      fetchBatch();
    }
  }, [isFiltering, hasFetchedBatch, fetchBatch]);

  // Vuelve a pag 1 si se cambia limit o filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage, searchTerm]);

  // --- Filtering Logic ---
  const filteredOffices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return batchOffices.filter((o) => {
      if (!term) return true;
      const deptLabel = (BOLIVIAN_DEPARTMENT_LABELS[o.bolivianDepartment] || "").toLowerCase();
      return (
        o.code.toLowerCase().includes(term) ||
        o.city.toLowerCase().includes(term) ||
        deptLabel.includes(term) ||
        (o.address || "").toLowerCase().includes(term)
      );
    });
  }, [batchOffices, searchTerm]);

  const filteredTotalPages = Math.max(1, Math.ceil(filteredOffices.length / perPage));
  const paginatedFilteredOffices = filteredOffices.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const displayedOffices = isFiltering ? paginatedFilteredOffices : pageOffices;
  const totalPages = isFiltering ? filteredTotalPages : pageTotalPages;
  const loading = isFiltering ? batchLoading : pageLoading;

  // --- Handlers ---
  const reloadData = async () => {
    if (isFiltering) {
      setHasFetchedBatch(false); // force re-fetch batch
    } else {
      await fetchPage();
    }
  };

  const handleOpenForm = (office?: BranchOffice) => {
    setFormError(null);
    setEditingOffice(office || null);
    setIsModalOpen(true);
  };

  const handleSave = (data: any) => {
    setFormError(null);
    runSubmit(async () => {
      try {
        const payload: CreateBranchOfficeRequest = {
          code: data.code.trim(),
          bolivianDepartment: data.bolivianDepartment,
          city: data.city.trim(),
          address: data.address.trim() || null,
          latitude: data.latitude.trim() ? Number(data.latitude) : null,
          longitude: data.longitude.trim() ? Number(data.longitude) : null,
          phone: data.phone.trim(),
        };

        if (editingOffice) {
          await branchOfficeService.updateBranchOffice(editingOffice.id, payload);
          showToast(
            "success",
            "Sucursal actualizada",
            `La sucursal "${payload.code}" fue actualizada exitosamente.`
          );
        } else {
          await branchOfficeService.createBranchOffice(payload);
          showToast(
            "success",
            "Sucursal creada",
            `La sucursal "${payload.code}" fue creada exitosamente.`
          );
        }
        setIsModalOpen(false);
        await reloadData();
      } catch (err: any) {
        setFormError(err.message || "Error al guardar la sucursal.");
      }
    });
  };

  const askDelete = (office: BranchOffice) => {
    setOfficeToDelete(office);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    runDelete(async () => {
      if (!officeToDelete) return;
      try {
        await branchOfficeService.deleteBranchOffice(officeToDelete.id);
        showToast(
          "success",
          "Eliminada",
          `La sucursal ${officeToDelete.code} ha sido eliminada.`
        );
        await reloadData();
      } catch (err: any) {
        showToast("error", "Error al eliminar", err.message || "Hubo un problema al eliminar.");
      } finally {
        setIsDeleteModalOpen(false);
        setOfficeToDelete(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <SucursalesToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onNew={() => handleOpenForm()}
      />

      <SucursalesList
        branchOffices={displayedOffices}
        loading={loading}
        onEdit={handleOpenForm}
        onDelete={askDelete}
      />

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.02] gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Mostrar</span>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-500 dark:text-gray-400">por página</span>
          </div>
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-[540px] m-4 z-50"
      >
        <SucursalFormModal
          branchOffice={editingOffice}
          isSaving={submitting}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
          error={formError}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="max-w-[420px] m-4 z-50"
      >
        <SucursalDeleteModal
          branchCode={officeToDelete?.code || ""}
          isDeleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
