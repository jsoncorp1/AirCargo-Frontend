"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { articleService, Article } from "@/services/articleService";
import { Supplier, supplierService } from "@/services/supplierService";
import ArticuloForm, { ArticuloFormData } from "./ArticuloForm";
import { useToast } from "@/context/ToastContext";

import ArticulosSummary from "./ArticulosSummary";
import ArticulosToolbar from "./ArticulosToolbar";
import ArticulosList, { ArticuloLocal } from "./ArticulosList";

const DEFAULT_PER_PAGE = 10;
const SEARCH_BATCH_SIZE = 200;

function mapArticulo(a: Article): ArticuloLocal {
  return {
    id: a.id,
    nombre: a.name,
    sku: a.sku,
    empresaId: a.supplierId,
    precio: a.price,
    stock: a.count,
    estado: "Activo", // Default status as backend doesn't provide one
    fechaRegistro: a.fechaRegistro ?? "",
  };
}

export default function ArticulosTable() {
  const { showToast } = useToast();

  const [pageArticulos, setPageArticulos] = useState<ArticuloLocal[]>([]);
  const [pageTotalPages, setPageTotalPages] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);

  const [batchArticulos, setBatchArticulos] = useState<ArticuloLocal[]>([]);
  const [batchLoading, setBatchLoading] = useState(true);

  const [empresas, setEmpresas] = useState<Supplier[]>([]);
  const [empresaMap, setEmpresaMap] = useState<Record<string, string>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"" | "Activo" | "Inactivo">("");
  const [empresaFilter, setEmpresaFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [filterResetKey, setFilterResetKey] = useState(0);

  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [selectedArticulo, setSelectedArticulo] = useState<ArticuloLocal | null>(null);
  const [articuloToDelete, setArticuloToDelete] = useState<ArticuloLocal | null>(null);

  const formModal = useModal();
  const deleteModal = useModal();

  const isFiltering = Boolean(searchTerm.trim()) || Boolean(estadoFilter) || Boolean(empresaFilter);

  const fetchPage = useCallback(async (page: number, supplierId: string) => {
    setPageLoading(true);
    try {
      const resp = await articleService.getArticles(page, perPage, supplierId || undefined);
      setPageArticulos(resp.data.map(mapArticulo));
      setPageTotalPages(resp.totalPages);
    } catch (e) {
      console.error(e);
    }
    setPageLoading(false);
  }, [perPage]);

  const fetchBatch = useCallback(async (supplierId: string) => {
    setBatchLoading(true);
    try {
      const resp = await articleService.getArticles(1, SEARCH_BATCH_SIZE, supplierId || undefined);
      setBatchArticulos(resp.data.map(mapArticulo));
    } catch (e) {
      console.error(e);
    }
    setBatchLoading(false);
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const resp = await supplierService.getSuppliers(1, SEARCH_BATCH_SIZE);
      setEmpresas(resp.data);
      const map: Record<string, string> = {};
      resp.data.forEach((e) => (map[e.id] = e.name));
      setEmpresaMap(map);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchAll = useCallback(() => {
    fetchPage(currentPage, empresaFilter);
    fetchBatch(empresaFilter);
    fetchSuppliers();
  }, [fetchPage, fetchBatch, fetchSuppliers, currentPage, empresaFilter]);

  useEffect(() => {
    fetchPage(currentPage, empresaFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, empresaFilter, perPage]);

  useEffect(() => {
    fetchBatch(empresaFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter, empresaFilter, perPage]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return batchArticulos.filter((a) => {
      const matchesSearch =
        a.nombre.toLowerCase().includes(term) ||
        a.sku.toLowerCase().includes(term) ||
        (empresaMap[a.empresaId] || "").toLowerCase().includes(term);
      const matchesEstado = !estadoFilter || a.estado === estadoFilter;
      return matchesSearch && matchesEstado;
    });
  }, [batchArticulos, empresaMap, searchTerm, estadoFilter]);

  const filteredTotalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginatedFiltered = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const paginated = isFiltering ? paginatedFiltered : pageArticulos;
  const totalPages = isFiltering ? filteredTotalPages : pageTotalPages;
  const loading = isFiltering ? batchLoading : pageLoading;

  const clearFilters = () => {
    setSearchTerm("");
    setEstadoFilter("");
    setEmpresaFilter("");
    setCurrentPage(1);
    setFilterResetKey((k) => k + 1);
  };

  const openCreate = () => { setFormMode("create"); setSelectedArticulo(null); formModal.openModal(); };
  const openEdit = (art: ArticuloLocal) => { setFormMode("edit"); setSelectedArticulo(art); formModal.openModal(); };
  const openView = (art: ArticuloLocal) => { setFormMode("view"); setSelectedArticulo(art); formModal.openModal(); };
  const askDelete = (art: ArticuloLocal) => { setArticuloToDelete(art); deleteModal.openModal(); };

  const handleSubmit = async (data: ArticuloFormData) => {
    try {
      if (formMode === "create") {
        await articleService.createArticle(data);
        showToast("success", "Artículo creado", `El artículo "${data.name}" se creó exitosamente.`);
      } else if (formMode === "edit" && selectedArticulo) {
        await articleService.updateArticle(selectedArticulo.id, data);
        showToast("success", "Artículo actualizado", `El artículo "${data.name}" se actualizó exitosamente.`);
      }
      fetchAll();
      formModal.closeModal();
    } catch (error: unknown) {
      showToast("error", "Error al guardar", error instanceof Error ? error.message : "Ocurrió un error al guardar el artículo.");
    }
  };

  const { pending: deleting, run: runDelete } = useSubmitLock();

  const confirmDelete = () =>
    runDelete(async () => {
      if (articuloToDelete) {
        try {
          await articleService.deleteArticle(articuloToDelete.id);
          showToast("success", "Artículo eliminado", `El artículo "${articuloToDelete.nombre}" fue eliminado.`);
          fetchAll();
        } catch (error: unknown) {
          showToast("error", "Error al eliminar", error instanceof Error ? error.message : "No se pudo eliminar el artículo.");
        }
      }
      deleteModal.closeModal();
      setArticuloToDelete(null);
    });

  // Cálculos para el componente Summary
  const totalArticulos = batchArticulos.length;
  const stockBajo = batchArticulos.filter(a => a.stock < 20).length;
  const valorTotal = batchArticulos.reduce((sum, a) => sum + (a.precio * a.stock), 0);

  return (
    <div className="space-y-6">
      <ArticulosSummary 
        totalArticulos={totalArticulos}
        stockBajo={stockBajo}
        valorTotal={valorTotal}
        loading={batchLoading}
      />

      <ArticulosToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        estadoFilter={estadoFilter}
        onEstadoChange={setEstadoFilter}
        empresaFilter={empresaFilter}
        onEmpresaChange={setEmpresaFilter}
        empresasOptions={empresas.map(e => ({ value: e.id, label: e.name }))}
        onClearFilters={clearFilters}
        onAddArticulo={openCreate}
        filterResetKey={filterResetKey}
      />

      <ArticulosList
        articulos={paginated}
        loading={loading}
        empresaMap={empresaMap}
        currentPage={currentPage}
        totalPages={totalPages}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={setPerPage}
        onView={openView}
        onEdit={openEdit}
        onDelete={askDelete}
      />

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

      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[420px] m-4 z-50">
        <div className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-error-50 dark:bg-error-500/10">
            <svg className="size-6 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Eliminar artículo</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            ¿Estás seguro de eliminar <strong className="text-gray-800 dark:text-white">{articuloToDelete?.nombre}</strong>? Esta acción no se puede deshacer.
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
