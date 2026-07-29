"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { useProveedoresData } from "@/context/ProveedoresContext";
import ArticuloForm, { ArticuloFormData } from "./ArticuloForm";
import { Articulo } from "@/context/ProveedoresContext";
import { BoxIcon, BoxIconLine, AlertIcon, PlusIcon, MoreDotIcon, EyeIcon, PencilIcon, TrashBinIcon } from "@/icons";

const PAGE_SIZE = 8;
const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export default function ArticulosTable() {
  const { articulos, empresas, addArticulo, updateArticulo, deleteArticulo } = useProveedoresData();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"" | "Activo" | "Inactivo">("");
  const [empresaFilter, setEmpresaFilter] = useState(() => searchParams.get("empresa") ?? "");
  const [currentPage, setCurrentPage] = useState(1);

  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);
  const [articuloToDelete, setArticuloToDelete] = useState<Articulo | null>(null);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  const formModal = useModal();
  const deleteModal = useModal();

  const empresaFiltroNombre = empresas.find((e) => e.id === empresaFilter)?.nombre;

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return articulos.filter((a) => {
      const matchesSearch =
        !term || a.nombre.toLowerCase().includes(term) || a.sku.toLowerCase().includes(term);
      const matchesEstado = !estadoFilter || a.estado === estadoFilter;
      const matchesEmpresa = !empresaFilter || a.empresaId === empresaFilter;
      return matchesSearch && matchesEstado && matchesEmpresa;
    });
  }, [articulos, searchTerm, estadoFilter, empresaFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(
    () => ({
      total: articulos.length,
      stockTotal: articulos.reduce((sum, a) => sum + a.stock, 0),
      sinStock: articulos.filter((a) => a.stock === 0).length,
    }),
    [articulos]
  );

  const empresaNombre = (empresaId: string) =>
    empresas.find((e) => e.id === empresaId)?.nombre ?? "Empresa no encontrada";

  const openCreate = () => {
    setFormMode("create");
    setSelectedArticulo(null);
    formModal.openModal();
  };
  const openEdit = (articulo: Articulo) => {
    setFormMode("edit");
    setSelectedArticulo(articulo);
    setOpenMenuRowId(null);
    formModal.openModal();
  };
  const openView = (articulo: Articulo) => {
    setFormMode("view");
    setSelectedArticulo(articulo);
    setOpenMenuRowId(null);
    formModal.openModal();
  };
  const askDelete = (articulo: Articulo) => {
    setArticuloToDelete(articulo);
    setOpenMenuRowId(null);
    deleteModal.openModal();
  };

  const handleSubmit = (data: ArticuloFormData) => {
    if (formMode === "create") {
      addArticulo(data);
    } else if (formMode === "edit" && selectedArticulo) {
      updateArticulo(selectedArticulo.id, data);
    }
    formModal.closeModal();
  };

  const confirmDelete = () => {
    if (articuloToDelete) deleteArticulo(articuloToDelete.id);
    deleteModal.closeModal();
    setArticuloToDelete(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<BoxIcon className="text-gray-800 size-6 dark:text-white/90" />} label="Total de artículos" value={stats.total} />
        <StatCard icon={<BoxIconLine className="text-success-500 size-6" />} label="Stock total" value={stats.stockTotal} />
        <StatCard icon={<AlertIcon className="text-warning-500 size-6" />} label="Sin stock" value={stats.sinStock} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="sm:max-w-xs sm:flex-1">
            <Input
              placeholder="Buscar por nombre o SKU..."
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
          <div className="sm:w-56">
            <SelectField
              placeholder="Todas las empresas"
              defaultValue={empresaFilter}
              options={empresas.map((e) => ({ value: e.id, label: e.nombre }))}
              onChange={(value) => {
                setEmpresaFilter(value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <Button startIcon={<PlusIcon />} onClick={openCreate}>
          Agregar artículo
        </Button>
      </div>

      {empresaFilter && (
        <div className="flex items-center gap-2 text-theme-sm">
          <span className="text-gray-500 dark:text-gray-400">Filtrado por:</span>
          <Badge size="sm" color="primary">
            {empresaFiltroNombre ?? "Empresa"}
            <button
              className="ml-1"
              onClick={() => {
                setEmpresaFilter("");
                setCurrentPage(1);
              }}
            >
              ×
            </button>
          </Badge>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Artículo</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Empresa</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Precio</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Stock</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <span className="sr-only">Acciones</span>
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginated.map((articulo) => (
                <TableRow key={articulo.id}>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarText name={articulo.nombre} />
                      <div>
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{articulo.nombre}</p>
                        <span className="text-gray-500 text-theme-xs dark:text-gray-400">SKU {articulo.sku}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{empresaNombre(articulo.empresaId)}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{currency.format(articulo.precio)}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                    {articulo.stock === 0 ? (
                      <Badge size="sm" color="warning">Sin stock</Badge>
                    ) : (
                      articulo.stock
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge size="sm" color={articulo.estado === "Activo" ? "success" : "light"}>
                      {articulo.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="relative px-5 py-4 text-right">
                    <button
                      className="dropdown-toggle text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                      onClick={() => setOpenMenuRowId(openMenuRowId === articulo.id ? null : articulo.id)}
                    >
                      <MoreDotIcon />
                    </button>
                    <Dropdown isOpen={openMenuRowId === articulo.id} onClose={() => setOpenMenuRowId(null)} className="w-40 p-2">
                      <DropdownItem onItemClick={() => openView(articulo)} className="flex items-center gap-2 rounded-lg">
                        <EyeIcon className="size-4" /> Ver
                      </DropdownItem>
                      <DropdownItem onItemClick={() => openEdit(articulo)} className="flex items-center gap-2 rounded-lg">
                        <PencilIcon className="size-4" /> Editar
                      </DropdownItem>
                      <DropdownItem onItemClick={() => askDelete(articulo)} className="flex items-center gap-2 rounded-lg text-error-500">
                        <TrashBinIcon className="size-4" /> Eliminar
                      </DropdownItem>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400">
                    No se encontraron artículos con los filtros aplicados.
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
        <ArticuloForm
          key={selectedArticulo?.id ?? "new"}
          mode={formMode}
          initialData={selectedArticulo}
          empresas={empresas}
          defaultEmpresaId={empresaFilter || undefined}
          onSubmit={handleSubmit}
          onCancel={formModal.closeModal}
        />
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[420px] m-4">
        <div className="p-6">
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Eliminar artículo</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            ¿Eliminar <strong>{articuloToDelete?.nombre}</strong>? Esta acción no se puede deshacer.
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
