"use client";

import React, { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { TrashBinIcon, PlusIcon } from "@/icons";
import { articleService, Article } from "@/services/articleService";
import {
  orderDeliveryService,
  CreateOrderDeliveryRequest,
} from "@/services/orderDeliveryService";

// unitPrice is kept as a raw string while editing so the user can type
// decimals (e.g. "42.") without React snapping it back to 0 mid-keystroke —
// number-typed inputs report an empty value for incomplete floats.
interface LineFormState {
  articleId: string;
  quantity: number;
  unitPrice: string;
}

const PRICE_PATTERN = /^\d*\.?\d*$/;

const DEPARTAMENTOS = ["Beni", "Chuquisaca", "Cochabamba", "La Paz", "Oruro", "Pando", "Potosí", "Santa Cruz", "Tarija"];
const TIPOS_ENTREGA = [
  { value: "Prepaid", label: "Pagada" },
  { value: "CashOnDelivery", label: "Por Pagar" },
];

interface SupplierOrderDeliveryFormProps {
  mode: "create" | "edit" | "view";
  orderId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function SupplierOrderDeliveryForm({ mode, orderId, onClose, onSaved }: SupplierOrderDeliveryFormProps) {
  const { showToast } = useToast();
  const { user, companyId } = useAuth();
  const readOnly = mode === "view";

  const [loading, setLoading] = useState(mode !== "create");
  const [submitting, setSubmitting] = useState(false);

  const [articles, setArticles] = useState<Article[]>([]);

  const [department, setDepartment] = useState<number>(0);
  const [clientFullName, setClientFullName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<number>(0);
  const [lines, setLines] = useState<LineFormState[]>([]);

  const fetchDependencies = useCallback(async () => {
    try {
      const articlesResp = await articleService.getArticles(1, 200, companyId ?? undefined);
      setArticles(articlesResp.data);
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "No se pudieron cargar los datos necesarios.");
    }
  }, [companyId, showToast]);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const order = await orderDeliveryService.getDeliveryById(orderId);
      setDepartment(DEPARTAMENTOS.indexOf(order.department));
      setClientFullName(order.clientFullName);
      setClientPhone(order.clientPhone);
      setClientAddress(order.clientAddress);
      setDeliveryType(TIPOS_ENTREGA.findIndex((t) => t.value === order.deliveryType));
      setLines(order.details.map(d => ({
        // Las órdenes del proveedor siempre son corporativas: articleId nunca
        // debería venir null aquí (eso solo ocurre en órdenes esporádicas).
        articleId: d.articleId ?? "",
        quantity: d.quantity,
        unitPrice: String(d.unitPrice)
      })));
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "No se pudo cargar la orden.");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [orderId, showToast, onClose]);

  useEffect(() => {
    fetchDependencies().then(() => {
      if (mode !== "create") {
        loadOrder();
      }
    });
  }, [fetchDependencies, loadOrder, mode]);

  const handleAddLine = () => {
    if (articles.length === 0) return;
    setLines([...lines, { articleId: "", quantity: 1, unitPrice: "0" }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (
    index: number,
    field: "articleId" | "quantity" | "unitPrice",
    value: string | number
  ) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value } as LineFormState;
    if (field === "articleId") {
      const article = articles.find(a => a.id === value);
      if (article) {
        newLines[index].unitPrice = String(article.price);
      }
    }
    setLines(newLines);
  };

  const handlePriceChange = (index: number, raw: string) => {
    if (!PRICE_PATTERN.test(raw)) return;
    handleLineChange(index, "unitPrice", raw);
  };

  const lineTotal = (line: LineFormState) => line.quantity * (Number(line.unitPrice) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      showToast("error", "Error", "Debe agregar al menos un artículo a la orden.");
      return;
    }
    if (lines.some(l => !l.articleId || l.quantity <= 0)) {
      showToast("error", "Error", "Todos los artículos deben tener una cantidad válida.");
      return;
    }
    if (!user?.id) {
      showToast("error", "Error", "No se pudo identificar al usuario actual.");
      return;
    }

    setSubmitting(true);
    try {
      const submittedLines = lines.map((l) => ({
        articleId: l.articleId,
        quantity: l.quantity,
        unitPrice: Number(l.unitPrice) || 0,
      }));

      if (mode === "create") {
        const payload: CreateOrderDeliveryRequest = {
          userId: user.id,
          department,
          clientFullName,
          clientPhone,
          clientAddress,
          deliveryType,
          lines: submittedLines,
        };
        await orderDeliveryService.createDelivery(payload);
        showToast("success", "Orden creada", "La orden de entrega fue creada exitosamente.");
      } else if (mode === "edit" && orderId) {
        await orderDeliveryService.updateDelivery(orderId, {
          department,
          clientFullName,
          clientPhone,
          clientAddress,
          deliveryType,
          lines: submittedLines,
        });
        showToast("success", "Orden actualizada", "La orden de entrega fue actualizada exitosamente.");
      }
      onSaved();
      onClose();
    } catch (error: unknown) {
      showToast("error", "Error", error instanceof Error ? error.message : "No se pudo guardar la orden.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalOrder = lines.reduce((acc, line) => acc + lineTotal(line), 0);

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Cargando datos de la orden...</div>;
  }

  return (
    <div className="flex flex-col max-h-[85vh]">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800 shrink-0">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Nueva Orden de Entrega" : mode === "edit" ? "Editar Orden" : "Detalle de Orden"}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {mode === "create" ? "Crea una nueva orden de entrega y agrega los artículos correspondientes." : "Información de la orden de entrega."}
        </p>
      </div>

      <div className="overflow-y-auto px-6 py-5 custom-scrollbar">
        <form id="supplier-order-form" onSubmit={handleSubmit} className="space-y-6">

          <div>
            <h5 className="mb-4 text-sm font-semibold text-brand-500 uppercase tracking-wider">Datos del Cliente y Destino</h5>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label required>Nombre del Cliente</Label>
                <Input
                  value={clientFullName}
                  onChange={(e) => setClientFullName(e.target.value)}
                  disabled={readOnly}
                  required
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <Label required>Teléfono</Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  disabled={readOnly}
                  required
                  placeholder="Ej. +591 7XXXXXXX"
                />
              </div>

              <div>
                <Label required>Departamento de Destino</Label>
                <select
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50"
                  value={department}
                  onChange={(e) => setDepartment(Number(e.target.value))}
                  disabled={readOnly}
                  required
                >
                  {DEPARTAMENTOS.map((dep, idx) => (
                    <option key={idx} value={idx}>{dep}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label required>Dirección Exacta</Label>
                <Input
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  disabled={readOnly}
                  required
                  placeholder="Ej. Av. Principal #123, Zona Sur"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800"></div>

          <div>
            <h5 className="mb-4 text-sm font-semibold text-brand-500 uppercase tracking-wider">Configuración de la Orden</h5>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label required>Tipo de Entrega</Label>
                <select
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50"
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(Number(e.target.value))}
                  disabled={readOnly}
                  required
                >
                  {TIPOS_ENTREGA.map((tipo, idx) => (
                    <option key={idx} value={idx}>{tipo.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800"></div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-sm font-semibold text-brand-500 uppercase tracking-wider">Artículos a Enviar</h5>
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  <PlusIcon className="size-4" /> Agregar Artículo
                </button>
              )}
            </div>

            <div className="space-y-3">
              {lines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No hay artículos en la orden.</p>
                  {!readOnly && (
                    <button type="button" onClick={handleAddLine} className="mt-2 text-xs font-medium text-brand-600 hover:underline">
                      Agregar el primer artículo
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="hidden gap-3 px-3 text-xs font-medium text-gray-400 dark:text-gray-500 sm:flex">
                    <div className="flex-1">Artículo</div>
                    <div className="w-20">Cant.</div>
                    <div className="w-28">Precio Unit.</div>
                    <div className="w-28 text-right">Total</div>
                    <div className="w-11"></div>
                  </div>
                  {lines.map((line, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center rounded-xl bg-gray-50 p-3 dark:bg-gray-800/40">
                    <div className="w-full sm:flex-1">
                      <select
                        className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50"
                        value={line.articleId}
                        onChange={(e) => handleLineChange(idx, "articleId", e.target.value)}
                        disabled={readOnly}
                        required
                      >
                        <option value="" disabled>Seleccione artículo</option>
                        {articles.map((a) => (
                          <option key={a.id} value={a.id}>[{a.sku}] {a.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex w-full sm:w-auto gap-3 items-center">
                      <div className="w-20">
                        <Input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(idx, "quantity", parseInt(e.target.value) || 1)}
                          disabled={readOnly}
                          required
                          placeholder="Cant."
                        />
                      </div>

                      <div className="w-28">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={line.unitPrice}
                          onChange={(e) => handlePriceChange(idx, e.target.value)}
                          disabled={readOnly}
                          required
                          placeholder="Precio"
                        />
                      </div>

                      <div className="w-28 shrink-0 text-right text-sm font-medium text-gray-800 dark:text-white/90">
                        Bs {lineTotal(line).toFixed(2)}
                      </div>

                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 transition-colors dark:hover:bg-error-500/10 dark:hover:text-error-400"
                        >
                          <TrashBinIcon className="size-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  ))}
                </>
              )}
            </div>

            {lines.length > 0 && (
              <div className="mt-4 flex justify-end">
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-5 py-3 dark:border-brand-800 dark:bg-brand-900/20 w-full sm:w-auto">
                  <p className="text-xs font-medium text-brand-600 uppercase tracking-wider dark:text-brand-400 mb-1">
                    Total de la Orden
                  </p>
                  <p className="text-2xl font-bold text-brand-800 dark:text-brand-200">
                    Bs {totalOrder.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800 shrink-0">
        <Button variant="outline" onClick={onClose}>
          {readOnly ? "Cerrar" : "Cancelar"}
        </Button>
        {!readOnly && (
          <Button onClick={() => {
            const form = document.getElementById("supplier-order-form") as HTMLFormElement | null;
            if (form) form.requestSubmit();
          }} disabled={submitting}>
            {submitting ? "Guardando..." : mode === "create" ? "Crear Orden" : "Guardar Cambios"}
          </Button>
        )}
      </div>
    </div>
  );
}
