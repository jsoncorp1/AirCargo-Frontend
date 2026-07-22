"use client";

import React, { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import SelectField from "@/components/form/Select";
import {
  articleReceiptService,
  ArticleReceipt,
} from "@/services/articleReceiptService";
import { articleService, Article } from "@/services/articleService";
import ArticleReceiptsTable from "@/components/recepciones/ArticleReceiptsTable";

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEFAULT_PER_PAGE = 10;

export default function RecepcionesPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [receipts, setReceipts] = useState<ArticleReceipt[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Pagination & filtering ──────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [articleFilter, setArticleFilter] = useState<string>("");

  // ── Summary stats ───────────────────────────────────────────────────────────
  const [totalReceivedToday, setTotalReceivedToday] = useState(0);
  const [totalReceiptsCount, setTotalReceiptsCount] = useState(0);

  // ── Fetch helpers ───────────────────────────────────────────────────────────

  const fetchArticles = useCallback(async () => {
    try {
      const res = await articleService.getArticles(1, 200);
      setArticles(res.data);
    } catch (err) {
      console.error("Error fetching articles", err);
    }
  }, []);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await articleReceiptService.getReceipts(
        currentPage,
        perPage,
        articleFilter || undefined
      );
      setReceipts(res.data);
      setTotalPages(res.totalPages);
      setTotalReceiptsCount(res.count);

      // compute "received today"
      const today = new Date().toDateString();
      const todayTotal = res.data
        .filter((r) => new Date(r.createdAt).toDateString() === today)
        .reduce((sum, r) => sum + r.count, 0);
      setTotalReceivedToday(todayTotal);
    } catch (err) {
      console.error("Error fetching receipts", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, articleFilter]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  // Reset to page 1 when filter changes
  const handleArticleFilter = (val: string) => {
    setArticleFilter(val);
    setCurrentPage(1);
  };

  // Volver a la página 1 al cambiar el tamaño de página.
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageBreadcrumb pageTitle="Recepciones de Artículos" />

      {/* ─── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total receipts */}
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Recepciones Registradas
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {loading ? "—" : totalReceiptsCount}
            </p>
          </div>
        </div>

        {/* Received today */}
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-success-50 dark:bg-success-500/10">
            <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Unidades Recibidas Hoy
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {loading ? "—" : `+${totalReceivedToday}`}
            </p>
          </div>
        </div>

        {/* Total articles */}
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-warning-50 dark:bg-warning-500/10">
            <svg className="h-6 w-6 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Artículos Disponibles
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {articles.length}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Main Table Card ──────────────────────────────────────────────────── */}
      <ComponentCard title="Historial de Recepciones">
        {/* Filter bar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Filtra por artículo para ver su historial de recepciones y cómo
            evolucionó su stock.
          </p>
          <div className="w-full sm:w-64">
            <SelectField
              placeholder="Todos los artículos"
              options={[
                { value: "", label: "Todos los artículos" },
                ...articles.map((a) => ({
                  value: a.id,
                  label: `[${a.sku}] ${a.name}`,
                })),
              ]}
              onChange={handleArticleFilter}
            />
          </div>
        </div>

        {/* Table */}
        <ArticleReceiptsTable
          receipts={receipts}
          articles={articles}
          loading={loading}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          onDataChange={fetchReceipts}
        />
      </ComponentCard>
    </div>
  );
}
