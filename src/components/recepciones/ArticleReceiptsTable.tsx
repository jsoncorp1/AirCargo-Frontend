"use client";

import React, { useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/context/ToastContext";
import Pagination from "@/components/tables/Pagination";
import { EyeIcon, PencilIcon, TrashBinIcon } from "@/icons";
import {
  ArticleReceipt,
  articleReceiptService,
  CreateArticleReceiptRequest,
  UpdateArticleReceiptRequest,
} from "@/services/articleReceiptService";
import { Article } from "@/services/articleService";
import ArticleReceiptForm from "./ArticleReceiptForm";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormMode = "create" | "edit" | "view";

interface ArticleReceiptsTableProps {
  receipts: ArticleReceipt[];
  articles: Article[];
  loading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  onDataChange: () => void; // callback to re-fetch after mutations
}

const PAGE_SIZE = 10;

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {[40, 80, 80, 32, 60].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div
            className={`h-4 w-${w} animate-pulse rounded bg-gray-100 dark:bg-gray-800`}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArticleReceiptsTable({
  receipts,
  articles,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  perPage,
  onPerPageChange,
  onDataChange,
}: ArticleReceiptsTableProps) {
  const { showToast } = useToast();
  const formModal = useModal();
  const deleteModal = useModal();

  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selected, setSelected] = useState<ArticleReceipt | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openCreate = useCallback(() => {
    setSelected(null);
    setFormMode("create");
    formModal.openModal();
  }, [formModal]);

  const openView = useCallback(
    (receipt: ArticleReceipt) => {
      setSelected(receipt);
      setFormMode("view");
      formModal.openModal();
    },
    [formModal]
  );

  const openEdit = useCallback(
    (receipt: ArticleReceipt) => {
      setSelected(receipt);
      setFormMode("edit");
      formModal.openModal();
    },
    [formModal]
  );

  const askDelete = useCallback(
    (receipt: ArticleReceipt) => {
      setSelected(receipt);
      deleteModal.openModal();
    },
    [deleteModal]
  );

  const handleSubmit = async (
    data: CreateArticleReceiptRequest | UpdateArticleReceiptRequest
  ) => {
    try {
      if (formMode === "create") {
        await articleReceiptService.createReceipt(
          data as CreateArticleReceiptRequest
        );
        showToast("success", "Recepción registrada", "El stock del artículo ha sido actualizado.");
      } else if (formMode === "edit" && selected) {
        await articleReceiptService.updateReceipt(
          selected.id,
          data as UpdateArticleReceiptRequest
        );
        showToast("success", "Recepción actualizada", "Los cambios han sido guardados.");
      }
      formModal.closeModal();
      onDataChange();
    } catch (err: any) {
      showToast("error", "Error", err.message || "No se pudo completar la operación.");
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await articleReceiptService.deleteReceipt(selected.id);
      showToast("success", "Recepción eliminada", "El registro ha sido eliminado.");
      deleteModal.closeModal();
      onDataChange();
    } catch (err: any) {
      showToast("error", "Error al eliminar", err.message || "No se pudo eliminar.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Action Bar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 active:bg-brand-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Recepción
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Artículo
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  SKU
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Cantidad
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Fecha de Recepción
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : receipts.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-16 text-center" colSpan={5}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                        <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        No hay recepciones registradas
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Registra la primera recepción para aumentar el stock de un artículo.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map((receipt) => (
                  <TableRow
                    key={receipt.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Article name */}
                    <TableCell className="px-5 py-4">
                      <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {receipt.articleName}
                      </span>
                    </TableCell>

                    {/* SKU */}
                    <TableCell className="px-5 py-4">
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {receipt.articleSku}
                      </span>
                    </TableCell>

                    {/* Count */}
                    <TableCell className="px-5 py-4">
                      <Badge size="sm" color="success">
                        +{receipt.count} uds.
                      </Badge>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {new Date(receipt.createdAt).toLocaleString("es-BO", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openView(receipt)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                          title="Ver detalle"
                        >
                          <EyeIcon className="size-4" /> Ver
                        </button>
                        <button
                          onClick={() => openEdit(receipt)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="size-4" /> Editar
                        </button>
                        <button
                          onClick={() => askDelete(receipt)}
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

        {/* Pagination */}
        <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            perPage={perPage}
            onPerPageChange={onPerPageChange}
          />
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={formModal.isOpen}
        onClose={formModal.closeModal}
        className="max-w-[560px] m-4 z-50"
      >
        <ArticleReceiptForm
          key={selected?.id ?? "new"}
          mode={formMode}
          articles={articles}
          initialData={selected}
          onSubmit={handleSubmit}
          onCancel={formModal.closeModal}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        className="max-w-[420px] m-4 z-50"
      >
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
            <button
              onClick={deleteModal.closeModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg bg-error-500 px-4 py-2 text-sm font-semibold text-white hover:bg-error-600 transition-colors"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
