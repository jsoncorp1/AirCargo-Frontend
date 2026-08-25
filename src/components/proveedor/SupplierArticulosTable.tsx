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
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import { Modal } from "@/components/ui/modal";
import { articleService, Article } from "@/services/articleService";
import { BoxCubeIcon, EyeIcon } from "@/icons";
import { useModal } from "@/hooks/useModal";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_PER_PAGE = 10;
// El backend no soporta búsqueda de texto como query param; mientras el buscador
// esté activo se trae un lote más grande y se filtra/pagina en cliente.
const SEARCH_BATCH_SIZE = 200;

const STOCK_BAJO = 20;

const money = (value: number) =>
  new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(value);

function stockBadge(stock: number) {
  if (stock === 0) return <Badge size="sm" color="error">Sin stock</Badge>;
  if (stock < STOCK_BAJO) return <Badge size="sm" color="warning">Stock bajo</Badge>;
  return <Badge size="sm" color="success">Disponible</Badge>;
}

function SkeletonRow() {
  return (
    <TableRow>
      {[6, 40, 20, 16, 16].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div className={`h-4 w-${w} animate-pulse rounded-md bg-gray-100 dark:bg-gray-800`} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function SupplierArticulosTable() {
  // `companyId` es el proveedor del usuario autenticado.
  const { companyId } = useAuth();

  // Página real del servidor: se usa cuando no hay búsqueda activa.
  const [pageArticulos, setPageArticulos] = useState<Article[]>([]);
  const [pageTotalPages, setPageTotalPages] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);
  // Lote grande: el único uso que queda es la búsqueda por texto, que no tiene
  // filtro server-side.
  const [batchArticulos, setBatchArticulos] = useState<Article[]>([]);
  const [batchLoading, setBatchLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [selectedArticulo, setSelectedArticulo] = useState<Article | null>(null);
  const viewModal = useModal();

  const isFiltering = Boolean(searchTerm.trim());

  // El backend ya acota el listado al proveedor del usuario, pero se manda el
  // `supplierId` igual para que la consulta diga explícitamente de quién es.
  const fetchPage = useCallback(async (page: number) => {
    setPageLoading(true);
    try {
      const resp = await articleService.getArticles(page, perPage, companyId ?? undefined);
      setPageArticulos(resp.data);
      setPageTotalPages(resp.totalPages);
    } catch (err) {
      console.error("Error fetching articles", err);
    } finally {
      setPageLoading(false);
    }
  }, [perPage, companyId]);

  const fetchBatch = useCallback(async () => {
    setBatchLoading(true);
    try {
      const resp = await articleService.getArticles(1, SEARCH_BATCH_SIZE, companyId ?? undefined);
      setBatchArticulos(resp.data);
    } catch (err) {
      console.error("Error fetching articles", err);
    } finally {
      setBatchLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchPage(currentPage);
  }, [fetchPage, currentPage]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  // Volver a la página 1 al cambiar el tamaño de página.
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return batchArticulos;
    return batchArticulos.filter(
      (a) => a.name.toLowerCase().includes(term) || a.sku.toLowerCase().includes(term)
    );
  }, [batchArticulos, searchTerm]);

  const filteredTotalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginatedFiltered = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const paginated = isFiltering ? paginatedFiltered : pageArticulos;
  const totalPages = isFiltering ? filteredTotalPages : pageTotalPages;
  const loading = isFiltering ? batchLoading : pageLoading;

  // Cuántas filas quedaron atrás en las páginas anteriores.
  const rowOffset = (currentPage - 1) * perPage;

  const openView = (art: Article) => {
    setSelectedArticulo(art);
    viewModal.openModal();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder="Buscar por artículo o SKU..."
            defaultValue={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="w-14 px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                  Nro
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Artículo
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                  Precio
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                  Stock
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-16 text-center" colSpan={5}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                        <BoxCubeIcon className="size-7 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        No se encontraron artículos
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((art, index) => (
                  <TableRow
                    key={art.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Correlativo de la vista, no del artículo: sigue contando
                        entre páginas para que la fila 11 sea la 11 y no la 1. */}
                    <TableCell className="w-14 whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm tabular-nums text-gray-400">
                      {rowOffset + index + 1}
                    </TableCell>

                    <TableCell className="px-5 py-4 align-middle">
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {art.name}
                      </p>
                      <span className="mt-0.5 block font-mono text-gray-400 text-theme-xs">
                        {art.sku}
                      </span>
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle font-semibold text-gray-800 text-theme-sm tabular-nums dark:text-white/90">
                      {money(art.price)}
                    </TableCell>

                    {/* La etiqueta va debajo y no al lado: al lado empujaba el
                        ancho de la columna y desalineaba las filas vecinas. */}
                    <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-medium text-gray-700 text-theme-sm tabular-nums dark:text-gray-300">
                          {art.count}
                        </span>
                        {stockBadge(art.count)}
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle">
                      <button
                        onClick={() => openView(art)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                        title="Ver detalle"
                      >
                        <EyeIcon className="size-4 shrink-0" /> Ver
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
          <div className="flex flex-col">
            <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Detalle del artículo
              </h4>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {selectedArticulo.sku}
                </span>
                {stockBadge(selectedArticulo.count)}
              </div>
            </div>

            <div className="divide-y divide-gray-100 px-6 py-5 dark:divide-gray-800">
              <div className="flex justify-between gap-4 py-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Nombre</span>
                <span className="text-right text-sm font-medium text-gray-800 dark:text-gray-200">
                  {selectedArticulo.name}
                </span>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Precio</span>
                <span className="text-right text-sm font-medium tabular-nums text-gray-800 dark:text-gray-200">
                  {money(selectedArticulo.price)}
                </span>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Stock</span>
                <span className="text-right text-sm font-medium tabular-nums text-gray-800 dark:text-gray-200">
                  {selectedArticulo.count}
                </span>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 px-6 py-4 dark:border-gray-800">
              <Button size="sm" variant="outline" onClick={viewModal.closeModal}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
