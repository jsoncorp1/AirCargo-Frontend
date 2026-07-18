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
import { articleService } from "@/services/articleService";
import { Supplier, supplierService } from "@/services/supplierService";
import { Articulo } from "@/data/mock/articulos";
import {
  BoxCubeIcon,
  CheckCircleIcon,
  CloseLineIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashBinIcon,
} from "@/icons";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import ArticuloForm, { ArticuloFormData } from "./ArticuloForm";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

const PAGE_SIZE = 10;

export default function ArticulosTable() {
  const { showToast } = useToast();
  const { companyId, role } = useAuth();
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [empresas, setEmpresas] = useState<Supplier[]>([]);
  const [empresaMap, setEmpresaMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"" | "Activo" | "Inactivo">("");
  const [empresaFilter, setEmpresaFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);
  const [articuloToDelete, setArticuloToDelete] = useState<Articulo | null>(null);

  const formModal = useModal();
  const deleteModal = useModal();
  const isCompanyUser = role?.toLowerCase() === "usuarioempresa";
  const canManageArticles = !isCompanyUser;
  const defaultArticleStatus: Articulo["estado"] = "Activo";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [articlesResp, suppliersResp] = await Promise.all([
      articleService.getArticles(1, 200, isCompanyUser ? companyId ?? undefined : undefined),
      supplierService.getSuppliers(),
    ]);
    // Map backend Articles to UI Articulo shape
    const mappedArticulos = articlesResp.data.map((a) => ({
      id: a.id,
      nombre: a.name,
      sku: a.sku,
      empresaId: a.supplierId,
      precio: a.price,
      stock: a.count,
      estado: defaultArticleStatus, // Default status as backend doesn't provide one
      fechaRegistro: a.fechaRegistro ?? "",
    }));
    setArticulos(mappedArticulos);
    const suppliers = suppliersResp.data;
    setEmpresas(suppliers);
    const map: Record<string, string> = {};
    suppliers.forEach((e) => (map[e.id] = e.name));
    setEmpresaMap(map);
    setLoading(false);
  }, [companyId, isCompanyUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);


  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return articulos.filter((a) => {
      const matchesSearch =
        a.nombre.toLowerCase().includes(term) ||
        a.sku.toLowerCase().includes(term) ||
        (empresaMap[a.empresaId] || "").toLowerCase().includes(term);
      const matchesEstado = !estadoFilter || a.estado === estadoFilter;
      const matchesEmpresa = !empresaFilter || a.empresaId === empresaFilter;
      return matchesSearch && matchesEstado && matchesEmpresa;
    });
  }, [articulos, empresaMap, searchTerm, estadoFilter, empresaFilter]);

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
  const openEdit = (art: Articulo) => { setFormMode("edit"); setSelectedArticulo(art); formModal.openModal(); };
  const openView = (art: Articulo) => { setFormMode("view"); setSelectedArticulo(art); formModal.openModal(); };
  const askDelete = (art: Articulo) => { setArticuloToDelete(art); deleteModal.openModal(); };

  const handleSubmit = async (data: ArticuloFormData) => {
    try {
      if (formMode === "create") {
        await articleService.createArticle(data);
        showToast("success", "Artículo creado", `El artículo "${data.name}" se creó exitosamente.`);
      } else if (formMode === "edit" && selectedArticulo) {
        await articleService.updateArticle(selectedArticulo.id, data);
        showToast("success", "Artículo actualizado", `El artículo "${data.name}" se actualizó exitosamente.`);
      }
      await fetchAll();
      formModal.closeModal();
    } catch (error: unknown) {
      showToast("error", "Error al guardar", error instanceof Error ? error.message : "Ocurrió un error al guardar el artículo.");
    }
  };

  const confirmDelete = async () => {
    if (articuloToDelete) {
      try {
        await articleService.deleteArticle(articuloToDelete.id);
        showToast("success", "Artículo eliminado", `El artículo "${articuloToDelete.nombre}" fue eliminado.`);
        await fetchAll();
      } catch (error: unknown) {
        showToast("error", "Error al eliminar", error instanceof Error ? error.message : "No se pudo eliminar el artículo.");
      }
    }
    deleteModal.closeModal();
    setArticuloToDelete(null);
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge size="sm" color="error">Sin Stock</Badge>;
    if (stock < 20) return <Badge size="sm" color="warning">Stock Bajo</Badge>;
    return <Badge size="sm" color="success">Disponible</Badge>;
  };


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
              placeholder="Buscar por artículo, sku, proveedor..."
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
              placeholder="Todos los proveedores"
              options={empresas.map(e => ({ value: e.id, label: e.name }))}
              onChange={(val) => { setEmpresaFilter(val); setCurrentPage(1); }}
            />
          </div>
        </div>
        {canManageArticles && <Button startIcon={<PlusIcon />} onClick={openCreate}>Nuevo Artículo</Button>}
      </div>

      {/* TABLA */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Artículo</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Proveedor</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Precio</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Stock</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-5 py-4">
                      <div className="space-y-2">
                        <div className="h-4 w-36 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                        <div className="h-3 w-20 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4"><div className="h-4 w-28 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                    <TableCell className="px-5 py-4"><div className="h-4 w-20 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                    <TableCell className="px-5 py-4"><div className="h-4 w-12 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                    <TableCell className="px-5 py-4"><div className="h-5 w-16 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" /></TableCell>
                    <TableCell className="px-5 py-4"><div className="ml-auto h-7 w-44 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" /></TableCell>
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-16 text-center" colSpan={6}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                        <BoxCubeIcon className="size-7 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No se encontraron artículos</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Ajusta los filtros o registra un nuevo artículo.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
              paginated.map((art) => (
                <TableRow key={art.id}>
                  <TableCell className="px-5 py-4">
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{art.nombre}</p>
                    <span className="font-mono text-gray-400 text-theme-xs">{art.sku}</span>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-600 text-theme-sm dark:text-gray-300">
                    {empresaMap[art.empresaId] || "–"}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                    {new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(art.precio)}
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
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openView(art)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                        title="Ver"
                      >
                        <EyeIcon className="size-4" /> Ver
                      </button>
                      {canManageArticles && (
                        <>
                          <button
                            onClick={() => openEdit(art)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="size-4" /> Editar
                          </button>
                          <button
                            onClick={() => askDelete(art)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
                            title="Eliminar"
                          >
                            <TrashBinIcon className="size-4" /> Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
          initialData={selectedArticulo ? {
            name: selectedArticulo.nombre,
            sku: selectedArticulo.sku,
            count: selectedArticulo.stock,
            price: selectedArticulo.precio,
            supplierId: selectedArticulo.empresaId,
          } : null}
          proveedores={empresas}
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
