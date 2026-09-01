"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import {
  BolivianDepartment,
  Supplier,
  supplierService,
} from "@/services/supplierService";
import EmpresaForm, { EmpresaFormData } from "./EmpresaForm";
import { useToast } from "@/context/ToastContext";
import ProveedoresToolbar from "./ProveedoresToolbar";
import ProveedoresList from "./ProveedoresList";
import ProveedoresSummary from "./ProveedoresSummary";

const DEFAULT_PER_PAGE = 8;
const SEARCH_BATCH_SIZE = 200;

export default function EmpresasTable() {
  const { showToast } = useToast();

  const [pageEmpresas, setPageEmpresas] = useState<Supplier[]>([]);
  const [pageTotalPages, setPageTotalPages] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);

  const [batchEmpresas, setBatchEmpresas] = useState<Supplier[]>([]);
  const [batchLoading, setBatchLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<"" | BolivianDepartment>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [filterResetKey, setFilterResetKey] = useState(0);

  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [selectedEmpresa, setSelectedEmpresa] = useState<Supplier | null>(null);
  const [empresaToDelete, setEmpresaToDelete] = useState<Supplier | null>(null);

  const formModal = useModal();
  const deleteModal = useModal();

  const isFiltering = Boolean(searchTerm.trim()) || Boolean(departmentFilter);

  const fetchPage = async (page: number) => {
    setPageLoading(true);
    try {
      const resp = await supplierService.getSuppliers(page, perPage);
      setPageEmpresas(resp.data);
      setPageTotalPages(resp.totalPages);
    } catch (e) {
      console.error(e);
    }
    setPageLoading(false);
  };

  const fetchBatch = async () => {
    setBatchLoading(true);
    try {
      const resp = await supplierService.getSuppliers(1, SEARCH_BATCH_SIZE);
      setBatchEmpresas(resp.data);
    } catch (e) {
      console.error(e);
    }
    setBatchLoading(false);
  };

  const fetchAll = () => {
    fetchPage(currentPage);
    fetchBatch();
  };

  useEffect(() => {
    fetchPage(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, perPage]);

  useEffect(() => {
    fetchBatch();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, perPage]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return batchEmpresas.filter((e) => {
      const matchesSearch =
        !term || e.name.toLowerCase().includes(term) || (e.description && e.description.toLowerCase().includes(term));
      const matchesDepartment = !departmentFilter || e.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [batchEmpresas, searchTerm, departmentFilter]);

  const filteredTotalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginatedFiltered = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const paginated = isFiltering ? paginatedFiltered : pageEmpresas;
  const totalPages = isFiltering ? filteredTotalPages : pageTotalPages;
  const loading = isFiltering ? batchLoading : pageLoading;

  const clearFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("");
    setCurrentPage(1);
    setFilterResetKey((k) => k + 1);
  };

  const openCreate = () => {
    setFormMode("create");
    setSelectedEmpresa(null);
    formModal.openModal();
  };
  const openEdit = (empresa: Supplier) => {
    setFormMode("edit");
    setSelectedEmpresa(empresa);
    formModal.openModal();
  };
  const openView = (empresa: Supplier) => {
    setFormMode("view");
    setSelectedEmpresa(empresa);
    formModal.openModal();
  };
  const askDelete = (empresa: Supplier) => {
    setEmpresaToDelete(empresa);
    deleteModal.openModal();
  };

  const handleSubmit = async (data: EmpresaFormData) => {
    // El PUT reemplaza la empresa completa: se mandan TODOS los campos de
    // configuración, no solo los tres de siempre. Omitir uno lo borra.
    const payload = {
      name: data.name,
      description: data.description,
      department: data.department,
      kind: data.kind,
      address: data.address ?? null,
      locationUrl: data.locationUrl ?? null,
      contactPhone: data.contactPhone ?? null,
      businessHoursStart: data.businessHoursStart ?? null,
      businessHoursEnd: data.businessHoursEnd ?? null,
      hasCreditAccount: !!data.hasCreditAccount,
      paymentDueDay: data.paymentDueDay ?? null,
    };

    try {
      if (formMode === "create") {
        await supplierService.createSupplier(payload);
        showToast("success", "Empresa creada", `La empresa "${data.name}" se creó exitosamente.`);
      } else if (formMode === "edit" && selectedEmpresa) {
        await supplierService.updateSupplier(selectedEmpresa.id, payload);
        showToast("success", "Empresa actualizada", `La empresa "${data.name}" se actualizó exitosamente.`);
      }
      fetchAll();
      formModal.closeModal();
    } catch (e: any) {
      showToast("error", "Error al guardar", e.message || "Ocurrió un error al guardar la empresa.");
    }
  };

  const { pending: deleting, run: runDelete } = useSubmitLock();

  const confirmDelete = () =>
    runDelete(async () => {
      if (empresaToDelete) {
        try {
          await supplierService.deleteSupplier(empresaToDelete.id);
          showToast("success", "Empresa eliminada", `La empresa fue eliminada.`);
          fetchAll();
        } catch (e: any) {
          showToast("error", "Error al eliminar", e.message || "No se pudo eliminar la empresa.");
        }
      }
      deleteModal.closeModal();
      setEmpresaToDelete(null);
    });

  // Calculate metrics for summary cards
  const totalProveedores = batchEmpresas.length;
  const totalUsuarios = batchEmpresas.reduce((acc, p) => acc + (p.userQuantity || 0), 0);

  return (
    <div className="space-y-6">
      <ProveedoresSummary 
        totalProveedores={totalProveedores} 
        totalUsuarios={totalUsuarios} 
        loading={batchLoading} 
      />

      <ProveedoresToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        departmentFilter={departmentFilter}
        onDepartmentChange={setDepartmentFilter}
        onClearFilters={clearFilters}
        onAddProveedor={openCreate}
        filterResetKey={filterResetKey}
      />

      <ProveedoresList
        proveedores={paginated}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={setPerPage}
        onView={openView}
        onEdit={openEdit}
        onDelete={askDelete}
      />

      <Modal isOpen={formModal.isOpen} onClose={formModal.closeModal} className="max-w-[640px] m-4">
        <EmpresaForm
          key={selectedEmpresa?.id ?? "new"}
          mode={formMode}
          initialData={selectedEmpresa}
          onSubmit={handleSubmit}
          onCancel={formModal.closeModal}
        />
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[420px] m-4">
        <div className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-error-50 dark:bg-error-500/10">
            <svg className="size-6 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Eliminar empresa</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            ¿Estás seguro de eliminar <strong>{empresaToDelete?.name}</strong>? Se eliminarán también sus usuarios y artículos asociados. Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={deleteModal.closeModal} disabled={deleting}>Cancelar</Button>
            <Button onClick={confirmDelete} disabled={deleting} className="bg-error-500 hover:bg-error-600 text-white border-transparent">
              {deleting ? "Eliminando…" : "Sí, eliminar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
