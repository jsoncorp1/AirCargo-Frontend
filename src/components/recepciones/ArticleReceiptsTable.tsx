"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/button/Button";
import { TrashBinIcon } from "@/icons";

import {
  ArticleReceipt,
  articleReceiptService,
  CreateArticleReceiptRequest,
  UpdateArticleReceiptRequest,
} from "@/services/articleReceiptService";
import { Article, articleService } from "@/services/articleService";

import ArticleReceiptForm from "./ArticleReceiptForm";
import RecepcionesSummary from "./RecepcionesSummary";
import RecepcionesToolbar from "./RecepcionesToolbar";
import RecepcionesList from "./RecepcionesList";

const DEFAULT_PER_PAGE = 10;
const SEARCH_BATCH_SIZE = 500; // Un lote grande para filtrar en cliente

type FormMode = "create" | "edit" | "view";

export default function ArticleReceiptsTable() {
  const { showToast } = useToast();
  const formModal = useModal();
  const deleteModal = useModal();

  // ─── Data State ──────────────────────────────────────────────────────────
  const [pageReceipts, setPageReceipts] = useState<ArticleReceipt[]>([]);
  const [pageTotalPages, setPageTotalPages] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);

  const [batchReceipts, setBatchReceipts] = useState<ArticleReceipt[]>([]);
  const [batchLoading, setBatchLoading] = useState(true);

  const [articles, setArticles] = useState<Article[]>([]);
  
  // Summary Stats
  const [totalReceiptsCount, setTotalReceiptsCount] = useState(0);

  // ─── Filters & Pagination ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [articleFilter, setArticleFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>(""); // Formato YYYY-MM-DD
  
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [filterResetKey, setFilterResetKey] = useState(0);

  // ─── Modal State ─────────────────────────────────────────────────────────
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selected, setSelected] = useState<ArticleReceipt | null>(null);

  const isFiltering = Boolean(searchTerm.trim()) || Boolean(articleFilter) || Boolean(dateFilter);

  // ─── Fetch Logic ─────────────────────────────────────────────────────────

  const fetchArticles = useCallback(async () => {
    try {
      const res = await articleService.getArticles(1, 500);
      setArticles(res.data);
    } catch (err) {
      console.error("Error fetching articles", err);
    }
  }, []);

  const fetchPage = useCallback(async () => {
    setPageLoading(true);
    try {
      const res = await articleReceiptService.getReceipts(currentPage, perPage);
      setPageReceipts(res.data);
      setPageTotalPages(res.totalPages);
      setTotalReceiptsCount(res.count);
    } catch (e) {
      console.error(e);
    } finally {
      setPageLoading(false);
    }
  }, [currentPage, perPage]);

  const fetchBatch = useCallback(async () => {
    setBatchLoading(true);
    try {
      const res = await articleReceiptService.getReceipts(1, SEARCH_BATCH_SIZE);
      setBatchReceipts(res.data);
      // We can also use batch response to get a more accurate total count if it's within batch size
      if (!isFiltering) {
        setTotalReceiptsCount(res.count);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBatchLoading(false);
    }
  }, [isFiltering]);

  const fetchAll = useCallback(() => {
    fetchPage();
    fetchBatch();
    fetchArticles();
  }, [fetchPage, fetchBatch, fetchArticles]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, perPage]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, articleFilter, dateFilter, perPage]);

  // ─── Client-side Filtering ───────────────────────────────────────────────

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return batchReceipts.filter((r) => {
      // Name & SKU Search
      const matchesSearch = 
        !term || 
        r.articleName.toLowerCase().includes(term) || 
        r.articleSku.toLowerCase().includes(term);
        
      // Article ID Filter
      const matchesArticle = !articleFilter || r.articleId === articleFilter;
      
      // Date Filter
      let matchesDate = true;
      if (dateFilter) {
        // La fecha viene en YYYY-MM-DD
        const receiptDate = new Date(r.createdAt).toISOString().split('T')[0];
        matchesDate = receiptDate === dateFilter;
      }

      return matchesSearch && matchesArticle && matchesDate;
    });
  }, [batchReceipts, searchTerm, articleFilter, dateFilter]);

  const filteredTotalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginatedFiltered = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const paginated = isFiltering ? paginatedFiltered : pageReceipts;
  const totalPages = isFiltering ? filteredTotalPages : pageTotalPages;
  const loading = isFiltering ? batchLoading : pageLoading;

  const clearFilters = () => {
    setSearchTerm("");
    setArticleFilter("");
    setDateFilter("");
    setCurrentPage(1);
    setFilterResetKey(k => k + 1);
  };

  // ─── Handlers ────────────────────────────────────────────────────────────

  const openCreate = useCallback(() => { setSelected(null); setFormMode("create"); formModal.openModal(); }, [formModal]);
  const openView = useCallback((receipt: ArticleReceipt) => { setSelected(receipt); setFormMode("view"); formModal.openModal(); }, [formModal]);
  const openEdit = useCallback((receipt: ArticleReceipt) => { setSelected(receipt); setFormMode("edit"); formModal.openModal(); }, [formModal]);
  const askDelete = useCallback((receipt: ArticleReceipt) => { setSelected(receipt); deleteModal.openModal(); }, [deleteModal]);

  const handleSubmit = async (data: CreateArticleReceiptRequest | UpdateArticleReceiptRequest) => {
    try {
      if (formMode === "create") {
        await articleReceiptService.createReceipt(data as CreateArticleReceiptRequest);
        showToast("success", "Recepción registrada", "El stock del artículo ha sido actualizado.");
      } else if (formMode === "edit" && selected) {
        await articleReceiptService.updateReceipt(selected.id, data as UpdateArticleReceiptRequest);
        showToast("success", "Recepción actualizada", "Los cambios han sido guardados.");
      }
      formModal.closeModal();
      fetchAll();
    } catch (err: any) {
      showToast("error", "Error", err.message || "No se pudo completar la operación.");
    }
  };

  const { pending: deleting, run: runDelete } = useSubmitLock();

  const handleDelete = () =>
    runDelete(async () => {
      if (!selected) return;
      try {
        await articleReceiptService.deleteReceipt(selected.id);
        showToast("success", "Recepción eliminada", "El registro ha sido eliminado.");
        deleteModal.closeModal();
        fetchAll();
      } catch (err: any) {
        showToast("error", "Error al eliminar", err.message || "No se pudo eliminar.");
      }
    });

  // ─── Summary Computations ───────────────────────────────────────────────
  
  const todayDateString = new Date().toDateString();
  const unidadesHoy = batchReceipts
    .filter((r) => new Date(r.createdAt).toDateString() === todayDateString)
    .reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-6">
      <RecepcionesSummary 
        totalRecepciones={totalReceiptsCount}
        unidadesHoy={unidadesHoy}
        articulosDisponibles={articles.length}
        loading={batchLoading}
      />

      <RecepcionesToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        articleFilter={articleFilter}
        onArticleChange={setArticleFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        articlesOptions={[
          { value: "", label: "Todos los artículos" },
          ...articles.map(a => ({ value: a.id, label: `[${a.sku}] ${a.name}` }))
        ]}
        onClearFilters={clearFilters}
        onAddReceipt={openCreate}
        filterResetKey={filterResetKey}
      />

      <RecepcionesList 
        receipts={paginated}
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

      {/* Form Modal */}
      <Modal isOpen={formModal.isOpen} onClose={formModal.closeModal} className="max-w-[560px] m-4 z-50">
        <ArticleReceiptForm
          key={selected?.id ?? "new"}
          mode={formMode}
          articles={articles}
          initialData={selected}
          onSubmit={handleSubmit}
          onCancel={formModal.closeModal}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[420px] m-4 z-50">
        <div className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-error-50 dark:bg-error-500/10">
            <TrashBinIcon className="size-6 text-error-500" />
          </div>
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Eliminar recepción
          </h4>
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            ¿Estás segura de eliminar esta recepción?
          </p>
          {selected && (
            <p className="mb-6 text-sm font-medium text-gray-700 dark:text-gray-200">
              [{selected.articleSku}] {selected.articleName} —{" "}
              <span className="text-success-600">+{selected.count} uds.</span>
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={deleteModal.closeModal} disabled={deleting}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-error-500 hover:bg-error-600 text-white border-transparent">
              {deleting ? "Eliminando…" : "Sí, eliminar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
