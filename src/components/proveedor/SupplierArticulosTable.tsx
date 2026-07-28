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
import Pagination from "@/components/tables/Pagination";
import StatCard from "@/components/proveedores/StatCard";
import { Modal } from "@/components/ui/modal";
import { articleService, Article } from "@/services/articleService";
import { BoxCubeIcon, CheckCircleIcon, CloseLineIcon, EyeIcon } from "@/icons";
import { useModal } from "@/hooks/useModal";

const DEFAULT_PER_PAGE = 10;
// El backend no soporta búsqueda de texto como query param; mientras el buscador
// esté activo se trae un lote más grande y se filtra/pagina en cliente.
const SEARCH_BATCH_SIZE = 200;

function getStockBadge(stock: number) {
  if (stock === 0) return <Badge size="sm" color="error">Sin Stock</Badge>;
  if (stock < 20) return <Badge size="sm" color="warning">Stock Bajo</Badge>;
  return <Badge size="sm" color="success">Disponible</Badge>;
}

export default function SupplierArticulosTable() {
  // Página real del servidor: se usa cuando no hay búsqueda activa.
  const [pageArticulos, setPageArticulos] = useState<Article[]>([]);
  const [pageTotalPages, setPageTotalPages] = useState(1);
  const [pageTotalCount, setPageTotalCount] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  // Lote grande para la búsqueda y para las StatCards.
  const [batchArticulos, setBatchArticulos] = useState<Article[]>([]);
  const [batchLoading, setBatchLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [selectedArticulo, setSelectedArticulo] = useState<Article | null>(null);
  const viewModal = useModal();

  const isFiltering = Boolean(searchTerm.trim());

  const fetchPage = useCallback(async (page: number) => {
    setPageLoading(true);
    // El backend ya limita el listado al proveedor del usuario autenticado.
    const resp = await articleService.getArticles(page, perPage);
    setPageArticulos(resp.data);
    setPageTotalPages(resp.totalPages);
    setPageTotalCount(resp.count);
    setPageLoading(false);
  }, [perPage]);

  const fetchBatch = useCallback(async () => {
    setBatchLoading(true);
    const resp = await articleService.getArticles(1, SEARCH_BATCH_SIZE);
    setBatchArticulos(resp.data);
    setBatchLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage(currentPage);
  }, [fetchPage, currentPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBatch();
  }, [fetchBatch]);

  // Volver a la página 1 al cambiar el tamaño de página.
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return batchArticulos.filter(
      (a) => a.name.toLowerCase().includes(term) || a.sku.toLowerCase().includes(term)
    );
  }, [batchArticulos, searchTerm]);

  const filteredTotalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginatedFiltered = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const paginated = isFiltering ? paginatedFiltered : pageArticulos;
  const totalPages = isFiltering ? filteredTotalPages : pageTotalPages;
  const loading = isFiltering ? batchLoading : pageLoading;

  const stats = useMemo(
    () => ({
      total: pageTotalCount,
      disponibles: batchArticulos.filter((a) => a.count > 0).length,
      sinStock: batchArticulos.filter((a) => a.count === 0).length,
    }),
    [pageTotalCount, batchArticulos]
  );

  const openView = (art: Article) => {
    setSelectedArticulo(art);
    viewModal.openModal();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<BoxCubeIcon className="text-gray-800 size-6 dark:text-white/90" />} label="Total Artículos" value={stats.total} />
        <StatCard icon={<CheckCircleIcon className="text-success-500 size-6" />} label="Disponibles" value={stats.disponibles} />
        <StatCard icon={<CloseLineIcon className="text-error-500 size-6" />} label="Sin Stock" value={stats.sinStock} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-[200px] flex-1">
          <Input
            placeholder="Buscar por artículo o sku..."
            defaultValue={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Artículo</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Precio</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Stock</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-5 py-4"><div className="h-4 w-36 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                    <TableCell className="px-5 py-4"><div className="h-4 w-20 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                    <TableCell className="px-5 py-4"><div className="h-4 w-12 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                    <TableCell className="px-5 py-4"><div className="ml-auto h-7 w-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" /></TableCell>
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-16 text-center" colSpan={4}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                        <BoxCubeIcon className="size-7 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No se encontraron artículos</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((art) => (
                  <TableRow key={art.id}>
                    <TableCell className="px-5 py-4">
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{art.name}</p>
                      <span className="font-mono text-gray-400 text-theme-xs">{art.sku}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                      {new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(art.price)}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-theme-sm text-gray-700 dark:text-gray-300 font-medium">{art.count}</span>
                        {getStockBadge(art.count)}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <button
                        onClick={() => openView(art)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                        title="Ver"
                      >
                        <EyeIcon className="size-4" /> Ver
                      </button>
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
          />
        </div>
      </div>

      <Modal isOpen={viewModal.isOpen} onClose={viewModal.closeModal} className="max-w-[500px] m-4 z-50">
        {selectedArticulo && (
          <div className="p-6 lg:p-8 space-y-4">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Detalle del artículo</h4>
            <div className="space-y-3 text-sm">
              <p><span className="text-gray-500">Nombre:</span> <span className="font-medium text-gray-800 dark:text-white/90">{selectedArticulo.name}</span></p>
              <p><span className="text-gray-500">SKU:</span> <span className="font-mono">{selectedArticulo.sku}</span></p>
              <p><span className="text-gray-500">Precio:</span> {new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(selectedArticulo.price)}</p>
              <p><span className="text-gray-500">Stock:</span> {selectedArticulo.count}</p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={viewModal.closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
