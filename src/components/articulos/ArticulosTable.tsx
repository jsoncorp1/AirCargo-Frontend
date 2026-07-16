"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/Select";
import Pagination from "@/components/tables/Pagination";
import StatCard from "@/components/proveedores/StatCard";
import { Modal } from "@/components/ui/modal";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { Articulo } from "@/data/mock/articulos";
import { Empresa } from "@/data/mock/empresas";
import { articuloService } from "@/services/articuloService";
import { empresaService } from "@/services/empresaService";
import {
  BoxCubeIcon,
  CheckCircleIcon,
  CloseLineIcon,
  PlusIcon,
  MoreDotIcon,
  EyeIcon,
  PencilIcon,
  TrashBinIcon,
} from "@/icons";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import ArticuloForm, { ArticuloFormData } from "./ArticuloForm";

const PAGE_SIZE = 10;

export default function ArticulosTable() {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaMap, setEmpresaMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"" | "Activo" | "Inactivo">("");
  const [empresaFilter, setEmpresaFilter] = useState<string>("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);
  const [articuloToDelete, setArticuloToDelete] = useState<Articulo | null>(null);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  const formModal = useModal();
  const deleteModal = useModal();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [artsData, empsData] = await Promise.all([
      articuloService.getArticulos(),
      empresaService.getEmpresas(),
    ]);
    setArticulos(artsData);
    setEmpresas(empsData);
    const map: Record<string, string> = {};
    empsData.forEach(e => (map[e.id] = e.nombre));
    setEmpresaMap(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const categorias = useMemo(
    () => Array.from(new Set(articulos.map(a => a.categoria))).sort(),
    [articulos]
  );

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return articulos.filter((a) => {
      const matchesSearch =
        !term ||
        a.nombre.toLowerCase().includes(term) ||
        a.sku.toLowerCase().includes(term) ||
        a.categoria.toLowerCase().includes(term) ||
        (empresaMap[a.empresaId] || "").toLowerCase().includes(term);
      const matchesEstado = !estadoFilter || a.estado === estadoFilter;
      const matchesEmpresa = !empresaFilter || a.empresaId === empresaFilter;
      const matchesCategoria = !categoriaFilter || a.categoria === categoriaFilter;
      return matchesSearch && matchesEstado && matchesEmpresa && matchesCategoria;
    });
  }, [articulos, empresaMap, searchTerm, estadoFilter, empresaFilter, categoriaFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(
    () => ({
      total: articulos.length,
      activos: articulos.filter(a => a.estado === "Activo").length,
      sinStock: articulos.filter(a => a.stock === 0).length,
    }),
    [articulos]
  );

  // Modal helpers
  const openCreate = () => { setFormMode("create"); setSelectedArticulo(null); formModal.openModal(); };
  const openEdit = (art: Articulo) => { setFormMode("edit"); setSelectedArticulo(art); setOpenMenuRowId(null); formModal.openModal(); };
  const openView = (art: Articulo) => { setFormMode("view"); setSelectedArticulo(art); setOpenMenuRowId(null); formModal.openModal(); };
  const askDelete = (art: Articulo) => { setArticuloToDelete(art); setOpenMenuRowId(null); deleteModal.openModal(); };

  const handleSubmit = async (data: ArticuloFormData) => {
    if (formMode === "create") {
      await articuloService.createArticulo(data);
    } else if (formMode === "edit" && selectedArticulo) {
      await articuloService.updateArticulo(selectedArticulo.id, data);
    }
    await fetchAll();
    formModal.closeModal();
  };

  const confirmDelete = async () => {
    if (articuloToDelete) {
      await articuloService.deleteArticulo(articuloToDelete.id);
      await fetchAll();
    }
    deleteModal.closeModal();
    setArticuloToDelete(null);
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge size="sm" color="error">Sin Stock</Badge>;
    if (stock < 20) return <Badge size="sm" color="warning">Stock Bajo</Badge>;
    return <Badge size="sm" color="success">Disponible</Badge>;
  };

  if (loading && articulos.length === 0) {
    return <div className="p-10 text-center text-gray-500">Cargando inventario...</div>;
  }

  return (
    <div className="space-y-5">
      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<BoxCubeIcon className="text-gray-800 size-6 dark:text-white/90" />} label="Total Artículos" value={stats.total} />
        <StatCard icon={<CheckCircleIcon className="text-success-500 size-6" />} label="Artículos Activos" value={stats.activos} />
        <StatCard icon={<CloseLineIcon className="text-error-500 size-6" />} label="Sin Stock" value={stats.sinStock} />
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-3">
          <div className="min-w-[200px] flex-1">
            <Input
              placeholder="Buscar por nombre, SKU, empresa..."
              defaultValue={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="w-44">
            <SelectField
              placeholder="Todos los estados"
              options={[
                { value: "Activo", label: "Activo" },
                { value: "Inactivo", label: "Inactivo" },
              ]}
              onChange={(val) => { setEstadoFilter(val as "" | "Activo" | "Inactivo"); setCurrentPage(1); }}
            />
          </div>
          <div className="w-52">
            <SelectField
              placeholder="Todas las empresas"
              options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
              onChange={(val) => { setEmpresaFilter(val); setCurrentPage(1); }}
            />
          </div>
          <div className="w-44">
            <SelectField
              placeholder="Categorías"
              options={categorias.map(c => ({ value: c, label: c }))}
              onChange={(val) => { setCategoriaFilter(val); setCurrentPage(1); }}
            />
          </div>
        </div>
        <Button startIcon={<PlusIcon />} onClick={openCreate}>Nuevo Artículo</Button>
      </div>

      {/* TABLA */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Artículo</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Empresa</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Categoría</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Precio</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Stock</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginated.map((art) => (
                <TableRow key={art.id}>
                  <TableCell className="px-5 py-4">
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{art.nombre}</p>
                    <span className="font-mono text-gray-400 text-theme-xs">{art.sku}</span>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-600 text-theme-sm dark:text-gray-300">
                    {empresaMap[art.empresaId] || "–"}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {art.categoria}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                    Bs {art.precio}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-theme-sm text-gray-700 dark:text-gray-300 font-medium">{art.stock}</span>
                      {getStockBadge(art.stock)}
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge size="sm" color={art.estado === "Activo" ? "success" : "light"}>
                      {art.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="relative px-5 py-4 text-right">
                    <button
                      className="dropdown-toggle text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                      onClick={() => setOpenMenuRowId(openMenuRowId === art.id ? null : art.id)}
                    >
                      <MoreDotIcon />
                    </button>
                    <Dropdown isOpen={openMenuRowId === art.id} onClose={() => setOpenMenuRowId(null)} className="w-40 p-2 z-10">
                      <DropdownItem onItemClick={() => openView(art)} className="flex items-center gap-2 rounded-lg">
                        <EyeIcon className="size-4" /> Ver
                      </DropdownItem>
                      <DropdownItem onItemClick={() => openEdit(art)} className="flex items-center gap-2 rounded-lg">
                        <PencilIcon className="size-4" /> Editar
                      </DropdownItem>
                      <DropdownItem onItemClick={() => askDelete(art)} className="flex items-center gap-2 rounded-lg text-error-500">
                        <TrashBinIcon className="size-4" /> Eliminar
                      </DropdownItem>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-10 text-center text-gray-500 text-theme-sm dark:text-gray-400">
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

      {/* MODAL FORMULARIO */}
      <Modal isOpen={formModal.isOpen} onClose={formModal.closeModal} className="max-w-[680px] m-4 z-50">
        <ArticuloForm
          key={selectedArticulo?.id ?? "new"}
          mode={formMode}
          initialData={selectedArticulo}
          empresas={empresas}
          onSubmit={handleSubmit}
          onCancel={formModal.closeModal}
        />
      </Modal>

      {/* MODAL ELIMINAR */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[420px] m-4 z-50">
        <div className="p-6">
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Eliminar artículo</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            ¿Eliminar <strong className="text-gray-800 dark:text-white">{articuloToDelete?.nombre}</strong>? Esta acción no se puede deshacer.
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
