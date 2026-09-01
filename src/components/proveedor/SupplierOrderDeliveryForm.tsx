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
import { useAuth } from "@/context/AuthContext";
import { TrashBinIcon, PlusIcon } from "@/icons";
import { articleService, Article } from "@/services/articleService";
import {
  BolivianDepartment,
  BOLIVIAN_DEPARTMENT_LABELS,
} from "@/services/supplierService";
import {
  PaymentType,
  ServicePointType,
  SERVICE_POINT_TYPE_OPTIONS,
  paymentTypeOptions,
} from "@/services/logisticsEnums";
import { useDestinationBranchOffices } from "@/hooks/useDestinationBranchOffices";
import { useSupplierCreditAccount } from "@/hooks/useSupplierCreditAccount";
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
  articleId: string;
  quantity: number;
  unitPrice: string;
}

const PRICE_PATTERN = /^\d*\.?\d*$/;

// El departamento viaja como NOMBRE del enum ("LaPaz"), igual que en el resto de
// la API. Antes se mandaba el índice de este arreglo, lo que ataba el contrato
// al orden de una lista del front.
const DEPARTAMENTOS = (
  Object.entries(BOLIVIAN_DEPARTMENT_LABELS) as [BolivianDepartment, string][]
).map(([value, label]) => ({ value, label }));

interface SupplierOrderDeliveryFormProps {
  mode: "create" | "edit";
  orderId?: string | null;
  onClose: () => void;
  onSaved: () => void;
  // "modal" recorta el alto y hace scroll interno; "page" deja que scrollee la
  // página, que es lo que se quiere cuando el formulario tiene ruta propia.
  layout?: "modal" | "page";
}

export default function SupplierOrderDeliveryForm({ mode, orderId, onClose, onSaved, layout = "modal" }: SupplierOrderDeliveryFormProps) {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(mode !== "create");
  // Cerrojo: bloquea guardar/cancelar mientras la petición está en curso (y
  // corta el segundo click del doble click).
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const [articles, setArticles] = useState<Article[]>([]);

  const [destinationBranchOfficeId, setDestinationBranchOfficeId] = useState("");
  // La sucursal que traía la orden al abrirla. Se guarda aparte para poder
  // mostrarla aunque haya sido dada de baja y ya no venga en el listado.
  const [loadedBranch, setLoadedBranch] = useState<{
    id: string;
    code: string | null;
    city: string | null;
  } | null>(null);

  const [department, setDepartment] = useState<BolivianDepartment | "">("");
  // Modalidad de destino: a domicilio va un conductor, en sucursal el cliente
  // retira. Cambia qué campos son obligatorios y cuáles ni se muestran.
  const [destinationPointType, setDestinationPointType] = useState<ServicePointType>("Door");
  const [clientFullName, setClientFullName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientPhoneAlt, setClientPhoneAlt] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [destinationLocationUrl, setDestinationLocationUrl] = useState("");
  const [destinationAddressReference, setDestinationAddressReference] = useState("");
  // Quién registró la orden y cuándo. Se muestra al pie del detalle.
  const [createdByEmail, setCreatedByEmail] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("Prepaid");
  const [isExpress, setIsExpress] = useState(false);
  const [lines, setLines] = useState<LineFormState[]>([]);

  // Origen/emisor: informativo, solo se puede leer (lo calcula el backend al crear la orden).
  const [senderInfo, setSenderInfo] = useState<{
    originDepartment: string;
    senderFullName: string;
    senderPhone: string;
    senderAddress: string;
  } | null>(null);

  const fetchDependencies = useCallback(async () => {
    try {
      // El backend ya limita los artículos al proveedor del usuario autenticado.
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
      setDepartment(order.destinationDepartment as BolivianDepartment);
      // Las órdenes anteriores al campo no traen modalidad: eran todas a
      // domicilio, que es lo único que existía.
      setDestinationPointType(order.destinationPointType ?? "Door");
      // Se precarga y se vuelve a mandar en el PUT: omitirla borra la sucursal
      // que declaró quien creó la orden.
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
      setClientPhoneAlt(order.clientPhoneAlt ?? "");
      setClientAddress(order.clientAddress);
      setDestinationLocationUrl(order.destinationLocationUrl ?? "");
      setDestinationAddressReference(order.destinationAddressReference ?? "");
      setPaymentType(order.paymentType);
      setIsExpress(order.isExpress);
      setSenderInfo({
        originDepartment: order.originDepartment,
        senderFullName: order.senderFullName,
        senderPhone: order.senderPhone,
        senderAddress: order.senderAddress,
      });
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

  // Segundo nivel de la cascada. El reset va en el handler y no en un efecto:
  // un efecto sobre `department` también dispararía al cargar una orden para
  // editar, borrando la sucursal que acabamos de precargar.
  const selectedDepartment = department || undefined;
  const {
    branches: branchesInDepartment,
    loading: loadingBranches,
    unavailable: branchesUnavailable,
  } = useDestinationBranchOffices(selectedDepartment);

  const handleDepartmentChange = (value: BolivianDepartment | "") => {
    setDepartment(value);
    setDestinationBranchOfficeId("");
  };

  // `OnAccount` solo se ofrece si la empresa tiene cuenta corriente habilitada;
  // el backend igual lo rechaza con `orderdelivery.payment.creditnotallowed`.
  const { companyId } = useAuth();
  const { hasCreditAccount } = useSupplierCreditAccount(companyId);
  const formaDePagoOptions = paymentTypeOptions(hasCreditAccount);

  // Si la empresa deja de tener crédito con una orden ya cargada "a cuenta", el
  // selector se queda sin esa opción: hay que sacarla del estado o el `<select>`
  // muestra vacío y manda un valor que el backend va a rechazar.
  useEffect(() => {
    if (paymentType === "OnAccount" && !hasCreditAccount) {
      setPaymentType("Prepaid");
    }
  }, [hasCreditAccount, paymentType]);

  const destinationIsBranch = destinationPointType === "Branch";

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
    if (!department) {
      showToast("error", "Error", "Selecciona el departamento de destino.");
      return;
    }
    // Las mismas dos reglas que valida el backend, para no perder la carga en un
    // 400: `orderdelivery.destinationbranch.required` y `.destinationaddress.required`.
    if (destinationIsBranch && !destinationBranchOfficeId) {
      showToast("error", "Error", "Si el cliente retira en sucursal, indica en cuál.");
      return;
    }
    if (!destinationIsBranch && !clientAddress.trim()) {
      showToast("error", "Error", "Si la entrega es a domicilio, indica la dirección.");
      return;
    }

    runSubmit(async () => {
      try {
        const submittedLines = lines.map((l) => ({
          articleId: l.articleId,
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice) || 0,
        }));

        // null y no "" cuando no se eligió sucursal: el campo es opcional y el
        // backend espera ausencia, no un id vacío.
        const branchOfficeId = destinationBranchOfficeId || null;

        const destinationFields = {
          destinationDepartment: department,
          destinationPointType,
          destinationBranchOfficeId: branchOfficeId,
          clientFullName,
          clientPhone,
          clientPhoneAlt: clientPhoneAlt.trim() || null,
          clientAddress,
          destinationLocationUrl: destinationLocationUrl.trim() || null,
          destinationAddressReference: destinationAddressReference.trim() || null,
          paymentType,
          isExpress,
        };

        if (mode === "create") {
          const payload: CreateOrderDeliveryRequest = {
            ...destinationFields,
            lines: submittedLines,
          };
          // Crear/editar una orden descuenta stock: el backend protege
          // `Article.Count` con un token de concurrencia y responde 409 sin
          // guardar nada si otra operación lo tocó a la vez. Reintentar el mismo
          // payload es seguro — no duplica la orden.
          await withConcurrencyRetry(() => orderDeliveryService.createDelivery(payload));
          showToast("success", "Orden creada", "La orden de entrega fue creada exitosamente.");
        } else if (mode === "edit" && orderId) {
          await withConcurrencyRetry(() =>
            orderDeliveryService.updateDelivery(orderId, {
              ...destinationFields,
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

  const asPage = layout === "page";

  return (
    <div
      className={`flex flex-col ${
        asPage
          ? "rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          : "max-h-[85vh]"
      }`}
    >
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800 shrink-0">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Nueva Orden de Entrega" : "Editar Orden"}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {mode === "create"
            ? "Crea una nueva orden de entrega y agrega los artículos correspondientes."
            : "Modificá los datos de la orden. Los cambios ajustan el stock de los artículos."}
        </p>
      </div>

      <div className={`px-6 py-5 ${asPage ? "" : "overflow-y-auto custom-scrollbar"}`}>
        <form id="supplier-order-form" onSubmit={handleSubmit} className="space-y-6">

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
                  required
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <Label required>Teléfono</Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                  placeholder="Ej. +591 7XXXXXXX"
                />
              </div>

              <div>
                <Label required={false}>
                  Teléfono alternativo
                  <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
                </Label>
                <Input
                  value={clientPhoneAlt}
                  onChange={(e) => setClientPhoneAlt(e.target.value)}
                  placeholder="Otro número por si no contesta"
                />
              </div>

              <div>
                <Label required>Departamento de Destino</Label>
                <select
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50"
                  value={department}
                  onChange={(e) =>
                    handleDepartmentChange(e.target.value as BolivianDepartment | "")
                  }
                  required
                >
                  <option value="">Selecciona el departamento</option>
                  {DEPARTAMENTOS.map((dep) => (
                    <option key={dep.value} value={dep.value}>{dep.label}</option>
                  ))}
                </select>
              </div>

              {/* La modalidad decide el resto del bloque: en sucursal el cliente
                  retira del mostrador y no hay conductor; a domicilio va uno. */}
              <div>
                <Label required>¿Cómo lo recibe?</Label>
                <select
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50"
                  value={destinationPointType}
                  onChange={(e) =>
                    setDestinationPointType(e.target.value as ServicePointType)
                  }
                  required
                >
                  {SERVICE_POINT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  {destinationIsBranch
                    ? "El envío espera en la sucursal hasta que el cliente lo retire."
                    : "Un conductor lo lleva hasta la dirección del cliente."}
                </p>
              </div>

              {/* Obligatoria si el cliente retira; opcional si va a domicilio,
                  donde solo indica desde qué sucursal sale el reparto. */}
              <div className={destinationIsBranch ? "sm:col-span-2" : ""}>
                <Label required={destinationIsBranch}>Sucursal de Destino</Label>
                <select
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50"
                  value={destinationBranchOfficeId}
                  onChange={(e) => setDestinationBranchOfficeId(e.target.value)}
                  disabled={

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
                    : destinationIsBranch
                    ? "Sucursal donde el cliente va a retirar el paquete."
                    : "Sucursal desde la que sale el reparto."}
                </p>
              </div>

              {/* Los datos del domicilio solo tienen sentido si va un conductor.
                  En un retiro en mostrador el backend los rechaza. */}
              {!destinationIsBranch && (
                <>
                  <div className="sm:col-span-2">
                    <Label required>Dirección Exacta</Label>
                    <Input
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      required
                      placeholder="Ej. Av. Principal #123, Zona Sur"
                    />
                  </div>

                  <div>
                    <Label required={false}>
                      Enlace de mapa
                      <span className="ml-1 text-xs font-normal text-gray-400">(recomendado)</span>
                    </Label>
                    <Input
                      value={destinationLocationUrl}
                      onChange={(e) => setDestinationLocationUrl(e.target.value)}
                      placeholder="https://maps.app.goo.gl/…"
                    />
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                      No es obligatorio, pero es lo que más ayuda al conductor a llegar.
                    </p>
                  </div>

                  <div>
                    <Label required={false}>
                      Referencia
                      <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
                    </Label>
                    <Input
                      value={destinationAddressReference}
                      onChange={(e) => setDestinationAddressReference(e.target.value)}
                      placeholder="Ej. Portón verde, frente a la plaza"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800"></div>

          <div>
            <h5 className="mb-4 text-sm font-semibold text-brand-500 uppercase tracking-wider">Configuración de la Orden</h5>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label required>Forma de Pago</Label>
                <select
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  required
                >
                  {formaDePagoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {paymentType === "OnAccount" && (
                  <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    El importe se suma a tu estado de cuenta del mes y se cobra al cierre.
                  </p>
                )}
              </div>

              <div className="flex items-end pb-2.5">
                <Checkbox
                  id="isExpress"
                  label="Envío Expreso"
                  checked={isExpress}
                  onChange={setIsExpress}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800"></div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-sm font-semibold text-brand-500 uppercase tracking-wider">Artículos a Enviar</h5>
              <button
                type="button"
                onClick={handleAddLine}
                disabled={availableArticles.length === 0}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlusIcon className="size-4" /> Agregar Artículo
              </button>
            </div>

            {availableArticles.length === 0 && (
              <p className="mb-3 text-xs text-warning-600 dark:text-warning-400">
                No hay artículos con stock disponible.
              </p>
            )}

            {lines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">No hay artículos en la orden.</p>
                {availableArticles.length > 0 && (
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
                        <TableCell isHeader className="w-11 px-3 py-2">{null}</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {lines.map((line, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="min-w-[200px] px-3 py-2">
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
                          </TableCell>

                          <TableCell className="px-3 py-2">
                            <Input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => handleLineChange(idx, "quantity", parseInt(e.target.value) || 1)}
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
                              required
                              placeholder="Precio"
                              className="!h-9"
                            />
                          </TableCell>

                          <TableCell className="px-3 py-2 text-right text-sm font-medium text-gray-800 dark:text-white/90">
                            Bs {lineTotal(line).toFixed(2)}
                          </TableCell>

                          <TableCell className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 transition-colors dark:hover:bg-error-500/10 dark:hover:text-error-400"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

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

      {/* En página el pie queda pegado abajo: el formulario es largo y no
          conviene obligar a scrollear hasta el fondo para guardar. */}
      <div
        className={`flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800 shrink-0 ${
          asPage ? "sticky bottom-0 rounded-b-2xl bg-inherit" : ""
        }`}
      >
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button onClick={() => {
          const form = document.getElementById("supplier-order-form") as HTMLFormElement | null;
          if (form) form.requestSubmit();
        }} disabled={submitting}>
          {submitting ? "Guardando..." : mode === "create" ? "Crear Orden" : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
}
