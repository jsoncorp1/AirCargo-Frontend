"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import Pagination from "@/components/tables/Pagination";
import StatCard from "@/components/proveedores/StatCard";
import { useModal } from "@/hooks/useModal";
import { Supplier, supplierService, CreateSupplierRequest, UpdateSupplierRequest } from "@/services/supplierService";
import { articleService } from "@/services/articleService";
import { Empresa } from "@/data/mock/empresas"; // we will keep it for compatibility if needed, but we will mostly use Supplier
import EmpresaForm, { EmpresaFormData } from "./EmpresaForm";
import { GroupIcon, CheckCircleIcon, CloseLineIcon, PlusIcon, MoreDotIcon, EyeIcon, PencilIcon, TrashBinIcon, PlugInIcon } from "@/icons";
import { useToast } from "@/context/ToastContext";

const PAGE_SIZE = 8;

export default function EmpresasTable() {
  const { showToast } = useToast();
  const [empresas, setEmpresas] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [articulosPorEmpresa, setArticulosPorEmpresa] = useState<Record<string, number>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"" | "Activo" | "Inactivo">("");
  const [currentPage, setCurrentPage] = useState(1);

  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [selectedEmpresa, setSelectedEmpresa] = useState<Supplier | null>(null);
  const [empresaToDelete, setEmpresaToDelete] = useState<Supplier | null>(null);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  const formModal = useModal();
  const deleteModal = useModal();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [respSuppliers, respArticles] = await Promise.all([
        supplierService.getSuppliers(),
        articleService.getArticles(1, 1000)
      ]);
      setEmpresas(respSuppliers.data);

      const counts: Record<string, number> = {};
      respArticles.data.forEach(art => {
        if (art.supplierId) {
          counts[art.supplierId] = (counts[art.supplierId] || 0) + 1;
        }
      });
      setArticulosPorEmpresa(counts);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchAll();
  }, []);



  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return empresas.filter((e) => {
      const matchesSearch =
        !term || e.name.toLowerCase().includes(term) || (e.description && e.description.toLowerCase().includes(term));
      const matchesEstado = true; // suppliers in backend don't have status yet
      return matchesSearch && matchesEstado;
    });
  }, [empresas, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(
    () => ({
      total: empresas.length,
      activas: empresas.length,
      inactivas: 0,
    }),
    [empresas]
  );

  const openCreate = () => {
    setFormMode("create");
    setSelectedEmpresa(null);
    formModal.openModal();
  };
  const openEdit = (empresa: Supplier) => {
    setFormMode("edit");
    setSelectedEmpresa(empresa);
    setOpenMenuRowId(null);
    formModal.openModal();
  };
  const openView = (empresa: Supplier) => {
    setFormMode("view");
    setSelectedEmpresa(empresa);
    setOpenMenuRowId(null);
    formModal.openModal();
  };
  const askDelete = (empresa: Supplier) => {
    setEmpresaToDelete(empresa);
    setOpenMenuRowId(null);
    deleteModal.openModal();
  };

  const handleSubmit = async (data: EmpresaFormData) => {
    try {
      if (formMode === "create") {
        await supplierService.createSupplier({ name: data.name, description: data.description });
        showToast("success", "Empresa creada", `La empresa "${data.name}" se creó exitosamente.`);
      } else if (formMode === "edit" && selectedEmpresa) {
        await supplierService.updateSupplier(selectedEmpresa.id, { name: data.name, description: data.description });
        showToast("success", "Empresa actualizada", `La empresa "${data.name}" se actualizó exitosamente.`);
      }
      await fetchAll();
      formModal.closeModal();
    } catch (e: any) {
      showToast("error", "Error al guardar", e.message || "Ocurrió un error al guardar la empresa.");
    }
  };

  const confirmDelete = async () => {
    if (empresaToDelete) {
      try {
        await supplierService.deleteSupplier(empresaToDelete.id);
        showToast("success", "Empresa eliminada", `La empresa fue eliminada.`);
        await fetchAll();
      } catch (e: any) {
        showToast("error", "Error al eliminar", e.message || "No se pudo eliminar la empresa.");
      }
    }
    deleteModal.closeModal();
    setEmpresaToDelete(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />} label="Total de empresas" value={stats.total} />
        <StatCard icon={<CheckCircleIcon className="text-success-500 size-6" />} label="Activas" value={stats.activas} />
        <StatCard icon={<CloseLineIcon className="text-gray-400 size-6" />} label="Inactivas" value={stats.inactivas} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="sm:max-w-xs sm:flex-1">
            <Input
              placeholder="Buscar por nombre o RUC..."
              defaultValue={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="sm:w-48">
            <SelectField
              placeholder="Todos los estados"
              options={[
                { value: "Activo", label: "Activo" },
                { value: "Inactivo", label: "Inactivo" },
              ]}
              onChange={(value) => {
                setEstadoFilter(value as "" | "Activo" | "Inactivo");
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <Button startIcon={<PlusIcon />} onClick={openCreate}>
          Agregar empresa
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Empresa</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Contacto</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ciudad</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Usuarios</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Artículos</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <span className="sr-only">Acciones</span>
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginated.map((empresa) => (
                <TableRow key={empresa.id}>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarText name={empresa.name} />
                      <div>
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{empresa.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <p className="text-gray-700 text-theme-sm dark:text-gray-300">{empresa.description || "-"}</p>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">-</TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="text-gray-500 text-theme-sm dark:text-gray-400">N/A</span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="text-theme-sm font-medium text-brand-500">{articulosPorEmpresa[empresa.id] || 0}</span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge size="sm" color="success">
                      Activo
                    </Badge>
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
              ))}
              {paginated.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <PlugInIcon className="size-10 opacity-30" />
                      <p className="text-sm font-medium">No se encontraron empresas</p>
                      <p className="text-xs">Ajusta los filtros o crea una nueva empresa.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {loading && paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400">
                    Cargando...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
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
            <Button variant="outline" onClick={deleteModal.closeModal}>Cancelar</Button>
            <Button onClick={confirmDelete}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
