"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { Article } from "@/services/articleService";
import {
  ArticleReceipt,
  CreateArticleReceiptRequest,
  UpdateArticleReceiptRequest,
} from "@/services/articleReceiptService";
import { formatDateTimeLong } from "@/utils/datetime";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormMode = "create" | "edit" | "view";

interface ArticleReceiptFormData {
  articleId: string;
  count: number;
}

interface ArticleReceiptFormProps {
  mode: FormMode;
  articles: Article[];
  initialData?: ArticleReceipt | null;
  onSubmit: (
    data: CreateArticleReceiptRequest | UpdateArticleReceiptRequest
  ) => void | Promise<void>;
  onCancel: () => void;
}

// ─── Default state factory ────────────────────────────────────────────────────

const defaultForm = (receipt?: ArticleReceipt | null): ArticleReceiptFormData => ({
  articleId: receipt?.articleId ?? "",
  count: receipt?.count ?? 1,
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArticleReceiptForm({
  mode,
  articles,
  initialData,
  onSubmit,
  onCancel,
}: ArticleReceiptFormProps) {
  const readOnly = mode === "view";
  const [data, setData] = useState<ArticleReceiptFormData>(defaultForm(initialData));
  // Cerrojo por ref: `isSubmitting` como estado solo bloquea a partir del
  // siguiente render, así que un doble click alcanzaba a entrar dos veces.
  const { pending: isSubmitting, run: runSubmit } = useSubmitLock();

  const set = <K extends keyof ArticleReceiptFormData>(
    key: K,
    value: ArticleReceiptFormData[K]
  ) => setData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () =>
    runSubmit(async () => {
      if (mode === "create") {
        await onSubmit({ articleId: data.articleId, count: data.count });
      } else {
        await onSubmit({ count: data.count });
      }
    });

  const selectedArticle = articles.find((a) => a.id === data.articleId);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {mode === "create"
            ? "Registrar Recepción"
            : mode === "edit"
            ? "Editar Recepción"
            : "Detalle de Recepción"}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {mode === "create"
            ? "Registra la cantidad de artículos recibidos del proveedor. El stock se actualizará automáticamente."
            : mode === "view"
            ? "Información del movimiento de recepción."
            : "Modifica la cantidad recepcionada."}
        </p>
      </div>

      {/* Body */}
      <div className="space-y-5 px-6 py-5">
        {/* Article selector – only on create */}
        {mode === "create" && (
          <div>
            <Label required>Artículo</Label>
            <select
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              value={data.articleId}
              onChange={(e) => set("articleId", e.target.value)}
              required
            >
              <option value="" disabled>
                Seleccione un artículo
              </option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.sku}] {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Article name (view/edit mode) */}
        {mode !== "create" && initialData && (
          <div>
            <Label>Artículo</Label>
            <Input
              value={`[${initialData.articleSku}] ${initialData.articleName}`}
              disabled
            />
          </div>
        )}

        {/* Current stock hint for create */}
        {mode === "create" && selectedArticle && (
          <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-800 dark:bg-brand-900/20">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-800/40">
              <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
                Stock actual del artículo
              </p>
              <p className="text-lg font-bold text-brand-800 dark:text-brand-200">
                {selectedArticle.count}{" "}
                <span className="text-xs font-normal">unidades</span>
              </p>
            </div>
          </div>
        )}

        {/* Count */}
        <div>
          <Label required>Cantidad a Recepcionar</Label>
          <Input
            type="number"
            value={data.count}
            disabled={readOnly}
            min="1"
            onChange={(e) => set("count", parseInt(e.target.value) || 1)}
            placeholder="0"
          />
          {!readOnly && (
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Esta cantidad se sumará al stock actual del artículo.
            </p>
          )}
        </div>

        {/* Date (view only) */}
        {mode === "view" && initialData && (
          <div>
            <Label>Fecha de Recepción</Label>
            <Input
              value={formatDateTimeLong(initialData.createdAt)}
              disabled
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {readOnly ? "Cerrar" : "Cancelar"}
        </Button>
        {!readOnly && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (mode === "create" && !data.articleId)}
          >
            {isSubmitting
              ? "Guardando..."
              : mode === "create"
              ? "Registrar Recepción"
              : "Guardar cambios"}
          </Button>
        )}
      </div>
    </div>
  );
}
