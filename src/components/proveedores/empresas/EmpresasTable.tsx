"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import Pagination from "@/components/tables/Pagination";
import { useModal } from "@/hooks/useModal";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import {
  BOLIVIAN_DEPARTMENT_LABELS,
  BolivianDepartment,
  Supplier,
  supplierService,
} from "@/services/supplierService";
import EmpresaForm, { EmpresaFormData } from "./EmpresaForm";
import {
  EyeIcon,
  PencilIcon,
  TrashBinIcon,
  PlusIcon,
  GroupIcon,
} from "@/icons";
import { useToast } from "@/context/ToastContext";

const DEFAULT_PER_PAGE = 8;
// El backend no soporta búsqueda de texto ni filtro por departamento como query params;
// mientras alguno de esos filtros esté activo se trae un lote más grande y se filtra en cliente.
const SEARCH_BATCH_SIZE = 200;

const DEPARTMENT_OPTIONS = (Object.keys(BOLIVIAN_DEPARTMENT_LABELS) as BolivianDepartment[]).map(
  (value) => ({ value, label: BOLIVIAN_DEPARTMENT_LABELS[value] })
);

export default function EmpresasTable() {
  const { showToast } = useToast();

  // Página real del servidor: se usa cuando no hay búsqueda ni filtro de departamento activos.
  const [pageEmpresas, setPageEmpresas] = useState<Supplier[]>([]);
  const [pageTotalPages, setPageTotalPages] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);
  // Lote grande para búsqueda/filtro de departamento (el backend no los soporta como query params).
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, perPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBatch();
  }, []);

  // Volver a la página 1 al activar/cambiar un filtro o el tamaño de página.
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    try {
      if (formMode === "create") {
        await supplierService.createSupplier({ name: data.name, description: data.description, department: data.department });
        showToast("success", "Empresa creada", `La empresa "${data.name}" se creó exitosamente.`);
      } else if (formMode === "edit" && selectedEmpresa) {
        await supplierService.updateSupplier(selectedEmpresa.id, { name: data.name, description: data.description, department: data.department });
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

  return (
    <div className="space-y-5">
      {/* ACCIÓN PRINCIPAL */}
      <div className="flex justify-end">
        <Button startIcon={<PlusIcon />} onClick={openCreate}>Agregar proveedor</Button>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-[200px] flex-1">
          <Input
            placeholder="Buscar por nombre de proveedor"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-52">
          <SelectField
            key={filterResetKey}
            placeholder="Todos los departamentos"
            options={DEPARTMENT_OPTIONS}
            onChange={(value) => {
              setDepartmentFilter(value as "" | BolivianDepartment);
              setCurrentPage(1);
            }}
          />
        </div>
        <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
      </div>

      {/* TABLA */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Proveedor</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Departamento</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Usuarios</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Artículos</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
                        <div className="space-y-2">
                          <div className="h-4 w-36 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                          <div className="h-3 w-24 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4"><div className="h-5 w-24 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" /></TableCell>
                    <TableCell className="px-5 py-4"><div className="h-4 w-10 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                    <TableCell className="px-5 py-4"><div className="h-4 w-10 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                    <TableCell className="px-5 py-4"><div className="ml-auto h-7 w-44 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" /></TableCell>
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                        <GroupIcon className="size-7 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No se encontraron proveedores</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Ajusta los filtros o registra un nuevo proveedor.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <AvatarText name={empresa.name} />
                        <div>
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{empresa.name}</p>
                          <p className="max-w-xs truncate text-gray-400 text-theme-xs">{empresa.description || "Sin descripción"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {empresa.department ? (
                        <Badge size="sm" color="light">{BOLIVIAN_DEPARTMENT_LABELS[empresa.department]}</Badge>
                      ) : (
                        <span className="text-gray-400 text-theme-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{empresa.userQuantity ?? 0}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{empresa.articleQuantity ?? 0}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openView(empresa)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                          title="Ver"
                        >
                          <EyeIcon className="size-4" /> Ver
                        </button>
                        <button
                          onClick={() => openEdit(empresa)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="size-4" /> Editar
                        </button>
                        <button
                          onClick={() => askDelete(empresa)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
                          title="Eliminar"
                        >
                          <TrashBinIcon className="size-4" /> Eliminar
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            perPage={perPage}
            onPerPageChange={setPerPage}
            perPageOptions={[8, 20, 50, 100]}
          />
        </div>
      </div>

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
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Eliminar empresa</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            ¿Eliminar <strong>{empresaToDelete?.name}</strong>? Se eliminarán también sus usuarios y artículos asociados. Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={deleteModal.closeModal} disabled={deleting}>Cancelar</Button>
            <Button onClick={confirmDelete} disabled={deleting}>{deleting ? "Eliminando…" : "Eliminar"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
