"use client";

import React, { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { TrashBinIcon, PlusIcon } from "@/icons";
import { articleService, Article } from "@/services/articleService";
import { BolivianDepartment } from "@/services/supplierService";
import { useDestinationBranchOffices } from "@/hooks/useDestinationBranchOffices";
import {
  orderDeliveryService,
  CreateOrderDeliveryRequest,
} from "@/services/orderDeliveryService";
import { getApiErrorMessage, isConcurrencyConflict } from "@/services/apiErrorMessages";
import { withConcurrencyRetry } from "@/services/withConcurrencyRetry";
import { formatDateTimeLong } from "@/utils/datetime";

// unitPrice is kept as a raw string while editing so the user can type
// decimals (e.g. "42.") without React snapping it back to 0 mid-keystroke —
// number-typed inputs report an empty value for incomplete floats.
interface LineFormState {
  articleId: string | null;
  articleName?: string;
  quantity: number;
  unitPrice: string;
}

const PRICE_PATTERN = /^\d*\.?\d*$/;

// El value es el nombre del enum tal como lo devuelve el backend (BolivianDepartment);
// el label es solo para mostrar. El índice en este arreglo es lo que se manda como
// destinationDepartment (number) al crear/editar.
const DEPARTAMENTOS: { value: string; label: string }[] = [
  { value: "Beni", label: "Beni" },
  { value: "Chuquisaca", label: "Chuquisaca" },
  { value: "Cochabamba", label: "Cochabamba" },
  { value: "LaPaz", label: "La Paz" },
  { value: "Oruro", label: "Oruro" },
  { value: "Pando", label: "Pando" },
  { value: "Potosi", label: "Potosí" },
  { value: "SantaCruz", label: "Santa Cruz" },
  { value: "Tarija", label: "Tarija" },
];
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
  const readOnly = mode === "view";

  const [loading, setLoading] = useState(mode !== "create");
  // Cerrojo: bloquea guardar/cancelar mientras la petición está en curso (y
  // corta el segundo click del doble click).
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  // Data sources
  const [articles, setArticles] = useState<Article[]>([]);

  // Form State
  const [department, setDepartment] = useState<number>(0);
  const [destinationBranchOfficeId, setDestinationBranchOfficeId] = useState("");
  // La sucursal que traía la orden al abrirla. Se guarda aparte para poder
  // mostrarla aunque haya sido dada de baja y ya no venga en el listado.
  const [loadedBranch, setLoadedBranch] = useState<{
    id: string;
    code: string | null;
    city: string | null;
  } | null>(null);
  const [clientFullName, setClientFullName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<number>(0);
  const [isExpress, setIsExpress] = useState(false);
  const [lines, setLines] = useState<LineFormState[]>([]);

  // Origen/emisor: informativo, solo se puede leer (lo calcula el backend al crear la orden).
  const [senderInfo, setSenderInfo] = useState<{
    originDepartment: string;
    senderFullName: string;
    senderPhone: string;
    senderAddress: string;
  } | null>(null);

  // Quién creó la orden: informativo, lo saca el backend del token (JWT) del usuario logueado.
  const [createdByEmail, setCreatedByEmail] = useState("");
  // Cuándo la registró el usuario empresa. Se muestra al pie del detalle junto
  // con quién la creó.
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  const fetchDependencies = useCallback(async () => {
    try {
      const articlesResp = await articleService.getArticles(1, 200);
      setArticles(articlesResp.data);
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "No se pudieron cargar los datos necesarios.");
    }
  }, [showToast]);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const order = await orderDeliveryService.getDeliveryById(orderId);
      setCreatedByEmail(order.createdBy);
      setCreatedAt(order.createdAt);
      setDepartment(DEPARTAMENTOS.findIndex((d) => d.value === order.destinationDepartment));
      // Se precarga y se vuelve a mandar en el PUT: omitirla borra la sucursal
      // que declaró el proveedor al crear la orden.
      setDestinationBranchOfficeId(order.destinationBranchOfficeId ?? "");
      setLoadedBranch(
        order.destinationBranchOfficeId
          ? {
              id: order.destinationBranchOfficeId,
              code: order.destinationBranchOfficeCode,
              city: order.destinationBranchOfficeCity,
            }
          : null
      );
      setClientFullName(order.clientFullName);
      setClientPhone(order.clientPhone);
      setClientAddress(order.clientAddress);
      setDeliveryType(TIPOS_ENTREGA.findIndex((t) => t.value === order.deliveryType));
      setIsExpress(order.isExpress);
      setSenderInfo({
        originDepartment: order.originDepartment,
        senderFullName: order.senderFullName,
        senderPhone: order.senderPhone,
        senderAddress: order.senderAddress,
      });
      setLines(order.details.map(d => ({
        articleId: d.articleId,
        articleName: d.articleName,
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

  // Segundo nivel de la cascada. El reset va en el handler y no en un efecto:
  // un efecto sobre `department` también dispararía al cargar una orden para
  // editar, borrando la sucursal que acabamos de precargar.
  const selectedDepartment = DEPARTAMENTOS[department]?.value as
    | BolivianDepartment
    | undefined;
  const {
    branches: branchesInDepartment,
    loading: loadingBranches,
    unavailable: branchesUnavailable,
  } = useDestinationBranchOffices(selectedDepartment);

  const handleDepartmentChange = (value: number) => {
    setDepartment(value);
    setDestinationBranchOfficeId("");
  };

  // Si la sucursal guardada ya no está en el listado (la dieron de baja después
  // de crear la orden), se muestra igual para que se vea qué decía la orden.
  const missingLoadedBranch =
    loadedBranch && !branchesInDepartment.some((b) => b.id === loadedBranch.id)
      ? loadedBranch
      : null;

  // Solo se pueden agregar artículos con stock disponible; los que ya están
  // en una línea existente (ej. al editar) se siguen mostrando aunque su
  // stock haya bajado a 0 después, para no perder la selección previa.
  const availableArticles = articles.filter(a => a.count > 0);

  const handleAddLine = () => {
    if (availableArticles.length === 0) return;
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
    // Auto-fill price if article changed
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      showToast("error", "Error", "Debe agregar al menos un artículo a la orden.");
      return;
    }
    if (lines.some(l => !l.articleId || l.quantity <= 0)) {
      showToast("error", "Error", "Todos los artículos deben tener una cantidad válida.");
      return;
    }

    runSubmit(async () => {
      try {
        const submittedLines = lines.map((l) => ({
          articleId: l.articleId ?? "",
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice) || 0,
        }));

        // null y no "" cuando no se eligió sucursal: el campo es opcional y el
        // backend espera ausencia, no un id vacío.
        const branchOfficeId = destinationBranchOfficeId || null;

        if (mode === "create") {
          const payload: CreateOrderDeliveryRequest = {
            destinationDepartment: department,
            destinationBranchOfficeId: branchOfficeId,
            clientFullName,
            clientPhone,
            clientAddress,
            deliveryType,
            isExpress,
            lines: submittedLines,
          };
          // Crear/editar una orden descuenta stock: el backend protege
          // `Article.Count` con un token de concurrencia y responde 409 sin
          // guardar nada si otra operación lo tocó a la vez. Reintentar el mismo
          // payload es seguro — no duplica la orden.
          await withConcurrencyRetry(() => orderDeliveryService.createDelivery(payload));
          showToast("success", "Orden creada", "La orden de entrega fue creada exitosamente.");
        } else if (mode === "edit" && orderId) {
          // Update endpoint uses same DTO shape without userId
          await withConcurrencyRetry(() =>
            orderDeliveryService.updateDelivery(orderId, {
              destinationDepartment: department,
              destinationBranchOfficeId: branchOfficeId,
              clientFullName,
              clientPhone,
              clientAddress,
              deliveryType,
              isExpress,
              lines: submittedLines,
            })
          );
          showToast("success", "Orden actualizada", "La orden de entrega fue actualizada exitosamente.");
        }
        onSaved();
        onClose();
      } catch (error: unknown) {
        showToast(
          "error",
          isConcurrencyConflict(error) ? "Conflicto de concurrencia" : "Error",
          getApiErrorMessage(error, "No se pudo guardar la orden.")
        );
      }
    });
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
        <form id="order-form" onSubmit={handleSubmit} className="space-y-6">

          {/* Section: Origen / Emisor (informativo, lo calcula el backend) */}
          {senderInfo && (
            <div>
              <h5 className="mb-4 text-sm font-semibold text-brand-500 uppercase tracking-wider">Origen / Emisor</h5>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Departamento de Origen</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{senderInfo.originDepartment || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Remitente</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{senderInfo.senderFullName || "—"}</p>
                </div>
                {senderInfo.senderPhone && (
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Teléfono del Remitente</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{senderInfo.senderPhone}</p>
                  </div>
                )}
                {senderInfo.senderAddress && (
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Dirección del Remitente</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{senderInfo.senderAddress}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Datos del Cliente */}
          <div>
            <h5 className="mb-4 text-sm font-semibold text-brand-500 uppercase tracking-wider">Datos del Cliente y Destino</h5>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Nombre y teléfono comparten fila para que Departamento y
                  Sucursal queden uno al lado del otro: la cascada se lee mal
                  si el segundo paso cae en la fila siguiente. */}
              <div>
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
                  onChange={(e) => handleDepartmentChange(Number(e.target.value))}
                  disabled={readOnly}
                  required
                >
                  {DEPARTAMENTOS.map((dep, idx) => (
                    <option key={dep.value} value={idx}>{dep.label}</option>
                  ))}
                </select>
              </div>

              {/* Opcional: si el departamento no tiene sucursales, la orden se
                  crea igual y se elige al despachar. */}
              <div>
                <Label>Sucursal de Destino</Label>
                <select
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50"
                  value={destinationBranchOfficeId}
                  onChange={(e) => setDestinationBranchOfficeId(e.target.value)}
                  disabled={
                    readOnly ||
                    loadingBranches ||
                    (branchesInDepartment.length === 0 && !missingLoadedBranch)
                  }
                >
                  <option value="">
                    {loadingBranches
                      ? "Cargando sucursales…"
                      : branchesInDepartment.length === 0
                      ? "Sin sucursales en este departamento"
                      : "Seleccioná una sucursal"}
                  </option>
                  {missingLoadedBranch && (
                    <option value={missingLoadedBranch.id}>
                      {missingLoadedBranch.city ?? "Sucursal"}
                      {missingLoadedBranch.code ? ` — ${missingLoadedBranch.code}` : ""}
                      {" (dada de baja)"}
                    </option>
                  )}
                  {branchesInDepartment.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.city}
                      {branch.code ? ` — ${branch.code}` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  {branchesUnavailable
                    ? "No se pudieron cargar las sucursales."
                    : missingLoadedBranch
                    ? "La sucursal declarada ya no está activa: elegí otra para poder guardar."
                    : branchesInDepartment.length === 0
                    ? "La entrega se coordina desde la sucursal más cercana."
                    : "Sucursal donde se recibe el paquete en destino."}
                </p>
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

              <div className="flex items-end pb-2.5">
                <Checkbox
                  id="isExpress"
                  label="Envío Expreso"
                  checked={isExpress}
                  onChange={setIsExpress}
                  disabled={readOnly}
                />
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
                  disabled={availableArticles.length === 0}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PlusIcon className="size-4" /> Agregar Artículo
                </button>
              )}
            </div>

            {!readOnly && availableArticles.length === 0 && (
              <p className="mb-3 text-xs text-warning-600 dark:text-warning-400">
                No hay artículos con stock disponible.
              </p>
            )}

            {lines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">No hay artículos en la orden.</p>
                {!readOnly && availableArticles.length > 0 && (
                  <button type="button" onClick={handleAddLine} className="mt-2 text-xs font-medium text-brand-600 hover:underline">
                    Agregar el primer artículo
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-800/40">
                      <TableRow>
                        <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Artículo
                        </TableCell>
                        <TableCell isHeader className="w-24 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Cant.
                        </TableCell>
                        <TableCell isHeader className="w-32 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Precio Unit.
                        </TableCell>
                        <TableCell isHeader className="w-28 px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Total
                        </TableCell>
                        {!readOnly && <TableCell isHeader className="w-11 px-3 py-2">{null}</TableCell>}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {lines.map((line, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="min-w-[200px] px-3 py-2">
                            {readOnly || line.articleId === null ? (
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {line.articleName || "Artículo sin especificar"}
                              </span>
                            ) : (
                              <select
                                className="h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50"
                                value={line.articleId}
                                onChange={(e) => handleLineChange(idx, "articleId", e.target.value)}
                                required
                              >
                                <option value="" disabled>Seleccione artículo</option>
                                {availableArticles.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.name} - Stock: {a.count}
                                  </option>
                                ))}
                              </select>
                            )}
                          </TableCell>

                          <TableCell className="px-3 py-2">
                            <Input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => handleLineChange(idx, "quantity", parseInt(e.target.value) || 1)}
                              disabled={readOnly}
                              required
                              placeholder="Cant."
                              className="!h-9"
                            />
                          </TableCell>

                          <TableCell className="px-3 py-2">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={line.unitPrice}
                              onChange={(e) => handlePriceChange(idx, e.target.value)}
                              disabled={readOnly}
                              required
                              placeholder="Precio"
                              className="!h-9"
                            />
                          </TableCell>

                          <TableCell className="px-3 py-2 text-right text-sm font-medium text-gray-800 dark:text-white/90">
                            Bs {lineTotal(line).toFixed(2)}
                          </TableCell>

                          {!readOnly && (
                            <TableCell className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 transition-colors dark:hover:bg-error-500/10 dark:hover:text-error-400"
                              >
                                <TrashBinIcon className="size-4" />
                              </button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

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

            {/* Trazabilidad: quién registró la orden y cuándo. Va al pie porque
                es dato de auditoría, no un campo que se edite. */}
            {mode !== "create" && createdByEmail && (
              <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Orden creada por{" "}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {createdByEmail}
                  </span>
                  {createdAt && (
                    <>
                      {" "}el{" "}
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {formatDateTimeLong(createdAt)}
                      </span>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800 shrink-0">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
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
