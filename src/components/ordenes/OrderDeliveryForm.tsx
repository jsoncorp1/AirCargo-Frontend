"use client";

import React, { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { TrashBinIcon, PlusIcon } from "@/icons";
import { userService, User } from "@/services/userService";
import { articleService, Article } from "@/services/articleService";
import {
  orderDeliveryService,
  CreateOrderDeliveryRequest,
  CreateOrderDeliveryLineRequest,
} from "@/services/orderDeliveryService";

const DEPARTAMENTOS = ["Beni", "Chuquisaca", "Cochabamba", "La Paz", "Oruro", "Pando", "Potosí", "Santa Cruz", "Tarija"];
const TIPOS_ENTREGA = [
  { value: "Prepaid", label: "Pagada" },
  { value: "CashOnDelivery", label: "Por Pagar" },
];

interface OrderDeliveryFormProps {
  mode: "create" | "edit" | "view";
  orderId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function OrderDeliveryForm({ mode, orderId, onClose, onSaved }: OrderDeliveryFormProps) {
  const { showToast } = useToast();
  const { companyId, role } = useAuth();
  const readOnly = mode === "view";
  const isCompanyUser = role?.toLowerCase() === "usuarioempresa";

  const [loading, setLoading] = useState(mode !== "create");
  const [submitting, setSubmitting] = useState(false);

  // Data sources
  const [users, setUsers] = useState<User[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  // Form State
  const [userId, setUserId] = useState<string>("");
  const [department, setDepartment] = useState<number>(0);
  const [clientFullName, setClientFullName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<number>(0);
  const [lines, setLines] = useState<CreateOrderDeliveryLineRequest[]>([]);

  const fetchDependencies = useCallback(async () => {
    try {
      const [usersResp, articlesResp] = await Promise.all([
        userService.getUsers(), // Need pagination ideally, but fine for now
        articleService.getArticles(1, 200, isCompanyUser ? companyId ?? undefined : undefined),
      ]);
      setUsers(usersResp.data);
      setArticles(articlesResp.data);
      if (usersResp.data.length > 0 && mode === "create") {
        setUserId(usersResp.data[0].id);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "No se pudieron cargar los datos necesarios.");
    }
  }, [companyId, isCompanyUser, mode, showToast]);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const order = await orderDeliveryService.getDeliveryById(orderId);
      setUserId(order.userId);
      setDepartment(DEPARTAMENTOS.indexOf(order.department));
      setClientFullName(order.clientFullName);
      setClientPhone(order.clientPhone);
      setClientAddress(order.clientAddress);
      setDeliveryType(TIPOS_ENTREGA.findIndex((t) => t.value === order.deliveryType));
      setLines(order.details.map(d => ({
        articleId: d.articleId,
        quantity: d.quantity,
        unitPrice: d.unitPrice
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
    setLines([...lines, { articleId: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (
    index: number,
    field: keyof CreateOrderDeliveryLineRequest,
    value: CreateOrderDeliveryLineRequest[keyof CreateOrderDeliveryLineRequest]
  ) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    // Auto-fill price if article changed
    if (field === "articleId") {
      const article = articles.find(a => a.id === value);
      if (article) {
        newLines[index].unitPrice = article.price;
      }
    }
    setLines(newLines);
  };

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

    setSubmitting(true);
    try {
      if (mode === "create") {
        const payload: CreateOrderDeliveryRequest = {
          userId,
          department,
          clientFullName,
          clientPhone,
          clientAddress,
          deliveryType,
          lines,
        };
        await orderDeliveryService.createDelivery(payload);
        showToast("success", "Orden creada", "La orden de entrega fue creada exitosamente.");
      } else if (mode === "edit" && orderId) {
        // Update endpoint uses same DTO shape without userId
        await orderDeliveryService.updateDelivery(orderId, {
          department,
          clientFullName,
          clientPhone,
          clientAddress,
          deliveryType,
          lines,
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

  const totalOrder = lines.reduce((acc, line) => acc + (line.quantity * line.unitPrice), 0);

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
        <form id="order-form" onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Datos del Cliente */}
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

          {/* Section: Configuración de Orden */}
          <div>
            <h5 className="mb-4 text-sm font-semibold text-brand-500 uppercase tracking-wider">Configuración de la Orden</h5>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {mode === "create" && (
                <div>
                  <Label required>Usuario Responsable (Vendedor/Admin)</Label>
                  <select
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Seleccione un usuario</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </select>
                </div>
              )}
              
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

          {/* Section: Artículos */}
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
                lines.map((line, idx) => (
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
                      <div className="w-24">
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
                      
                      <div className="w-32">
                        <div className="flex h-11 items-center px-4 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-medium text-gray-800 dark:text-white/90">
                          Bs {(line.quantity * line.unitPrice).toFixed(2)}
                        </div>
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
                ))
              )}
            </div>

            {/* Resumen */}
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

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800 shrink-0">
        <Button variant="outline" onClick={onClose}>
          {readOnly ? "Cerrar" : "Cancelar"}
        </Button>
        {!readOnly && (
          <Button onClick={() => {
            const form = document.getElementById("order-form") as HTMLFormElement | null;
            if (form) form.requestSubmit();
          }} disabled={submitting}>
            {submitting ? "Guardando..." : mode === "create" ? "Crear Orden" : "Guardar Cambios"}
          </Button>
        )}
      </div>
    </div>
  );
}
