"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Checkbox from "@/components/form/input/Checkbox";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { TrashBinIcon, PlusIcon } from "@/icons";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useDestinationBranchOffices } from "@/hooks/useDestinationBranchOffices";
import { useSupplierCreditAccount } from "@/hooks/useSupplierCreditAccount";
import {
  pickupOrderService,
  CreatePickupOrderRequest,
  PickupOrder,
  getPickupOrderErrorMessage,
} from "@/services/pickupOrderService";
import {
  supplierService,
  BOLIVIAN_DEPARTMENT_LABELS,
  BolivianDepartment,
} from "@/services/supplierService";
import {
  PaymentType,
  ServicePointType,
  SERVICE_POINT_TYPE_OPTIONS,
  VehicleType,
  VEHICLE_TYPE_OPTIONS,
  paymentTypeOptions,
} from "@/services/logisticsEnums";
import type { QuoteRequest, QuoteResponse } from "@/services/pricingService";
import QuotePanel from "@/components/pricing/QuotePanel";
import { todayApiDay } from "@/utils/datetime";

interface RecojoFormProps {
  /** En edición se precarga y el backend solo la acepta si sigue en `Requested`. */
  pickupOrder?: PickupOrder | null;
  onClose: () => void;
  onSaved: () => void;
}

interface LineFormState {
  articleName: string;
  quantity: number;
  estimatedWeight: string;
  declaredValue: string;
}

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const DEPARTAMENTOS = (
  Object.entries(BOLIVIAN_DEPARTMENT_LABELS) as [BolivianDepartment, string][]
).map(([value, label]) => ({ value, label }));

const DECIMAL_PATTERN = /^\d*\.?\d*$/;

const emptyLine = (): LineFormState => ({
  articleName: "",
  quantity: 1,
  estimatedWeight: "0",
  declaredValue: "0",
});

/** `09:00:00` ⇄ `09:00`: el input de hora no quiere los segundos del `TimeOnly`. */
const toInputTime = (value?: string | null): string => (value ? value.slice(0, 5) : "");
const toApiTime = (value: string): string => (value.length === 5 ? `${value}:00` : value);

/**
 * Alta y edición de una solicitud de recojo.
 *
 * La respuesta del alta ES la cotización, así que el panel de precio de la
 * derecha muestra el estimado en vivo mientras se completa peso, ruta y
 * vehículo: es lo que se le promete al cliente.
 */
export default function RecojoForm({ pickupOrder, onClose, onSaved }: RecojoFormProps) {
  const { showToast } = useToast();
  const { companyId, isSuperAdminUser } = useAuth();
  const { pending: submitting, run: runSubmit } = useSubmitLock();
  const isEdit = !!pickupOrder;

  // Origen
  const [originDepartment, setOriginDepartment] = useState<BolivianDepartment>(
    pickupOrder?.originDepartment ?? "LaPaz"
  );
  const [senderName, setSenderName] = useState(pickupOrder?.senderName ?? "");
  const [senderPhone, setSenderPhone] = useState(pickupOrder?.senderPhone ?? "");
  const [pickupAddress, setPickupAddress] = useState(pickupOrder?.pickupAddress ?? "");
  const [pickupLocationUrl, setPickupLocationUrl] = useState(
    pickupOrder?.pickupLocationUrl ?? ""
  );
  const [pickupAddressReference, setPickupAddressReference] = useState(
    pickupOrder?.pickupAddressReference ?? ""
  );

  // Destino
  const [destinationPointType, setDestinationPointType] = useState<ServicePointType>(
    pickupOrder?.destinationPointType ?? "Door"
  );
  const [destinationDepartment, setDestinationDepartment] = useState<BolivianDepartment>(
    pickupOrder?.destinationDepartment ?? "SantaCruz"
  );
  const [destinationBranchOfficeId, setDestinationBranchOfficeId] = useState(
    pickupOrder?.destinationBranchOfficeId ?? ""
  );
  const [recipientName, setRecipientName] = useState(pickupOrder?.recipientName ?? "");
  const [recipientPhone, setRecipientPhone] = useState(pickupOrder?.recipientPhone ?? "");
  const [recipientPhoneAlt, setRecipientPhoneAlt] = useState(
    pickupOrder?.recipientPhoneAlt ?? ""
  );
  const [destinationAddress, setDestinationAddress] = useState(
    pickupOrder?.destinationAddress ?? ""
  );
  const [destinationLocationUrl, setDestinationLocationUrl] = useState(
    pickupOrder?.destinationLocationUrl ?? ""
  );
  const [destinationAddressReference, setDestinationAddressReference] = useState(
    pickupOrder?.destinationAddressReference ?? ""
  );

  // Cuándo
  const [pickupDate, setPickupDate] = useState(pickupOrder?.pickupDate ?? todayApiDay());
  const [pickupWindowStart, setPickupWindowStart] = useState(
    toInputTime(pickupOrder?.pickupWindowStart) || "09:00"
  );
  const [pickupWindowEnd, setPickupWindowEnd] = useState(
    toInputTime(pickupOrder?.pickupWindowEnd) || "13:00"
  );

  // Qué
  const [estimatedWeight, setEstimatedWeight] = useState(
    pickupOrder ? String(pickupOrder.estimatedWeight) : "1"
  );
  const [packageCount, setPackageCount] = useState(pickupOrder?.packageCount ?? 1);
  const [packageDescription, setPackageDescription] = useState(
    pickupOrder?.packageDescription ?? ""
  );
  const [requestedVehicleType, setRequestedVehicleType] = useState<VehicleType>(
    pickupOrder?.requestedVehicleType ?? "Motorcycle"
  );
  const [isExpress, setIsExpress] = useState(pickupOrder?.isExpress ?? false);
  const [paymentType, setPaymentType] = useState<PaymentType>(
    pickupOrder?.paymentType ?? "Prepaid"
  );
  const [comments, setComments] = useState(pickupOrder?.comments ?? "");
  const [lines, setLines] = useState<LineFormState[]>(
    pickupOrder?.details?.length
      ? pickupOrder.details.map((d) => ({
          articleName: d.articleName,
          quantity: d.quantity,
          estimatedWeight: String(d.estimatedWeight),
          declaredValue: String(d.declaredValue),
        }))
      : [emptyLine()]
  );

  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  const { hasCreditAccount } = useSupplierCreditAccount(companyId);
  const formaDePagoOptions = paymentTypeOptions(hasCreditAccount);

  // Se DERIVA en vez de corregirse con un efecto: si la empresa no tiene
  // crédito, "a cuenta" simplemente no existe para este formulario. Un efecto
  // que lo reescribiera dejaría un render con un valor que el selector no
  // ofrece, y el `<select>` se vería vacío.
  const effectivePaymentType: PaymentType =
    paymentType === "OnAccount" && !hasCreditAccount ? "Prepaid" : paymentType;

  // Precarga desde la configuración de la empresa: punto de recojo y horario de
  // atención. Solo en el alta, y solo sobre lo que el usuario todavía no tocó —
  // pisar lo que ya escribió sería peor que no precargar nada.
  useEffect(() => {
    if (isEdit || !companyId) return;
    let cancelled = false;

    (async () => {
      try {
        const supplier = await supplierService.getSupplierById(companyId);
        if (cancelled) return;
        setSenderName((prev) => prev || supplier.name);
        setPickupAddress((prev) => prev || supplier.address || "");
        setPickupLocationUrl((prev) => prev || supplier.locationUrl || "");
        setSenderPhone((prev) => prev || supplier.contactPhone || "");
        if (supplier.department) setOriginDepartment(supplier.department);
        if (supplier.businessHoursStart && supplier.businessHoursEnd) {
          setPickupWindowStart(toInputTime(supplier.businessHoursStart));
          setPickupWindowEnd(toInputTime(supplier.businessHoursEnd));
        }
      } catch {
        // La precarga es una comodidad: si falla, se completa a mano.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId, isEdit]);

  const { branches: destinationBranches, loading: loadingBranches } =
    useDestinationBranchOffices(destinationDepartment);

  const handleDestinationDepartmentChange = (value: BolivianDepartment) => {
    setDestinationDepartment(value);
    setDestinationBranchOfficeId("");
  };

  const destinationIsBranch = destinationPointType === "Branch";

  // ─── Líneas ───────────────────────────────────────────────────────────────

  const addLine = () => setLines([...lines, emptyLine()]);
  const removeLine = (index: number) => setLines(lines.filter((_, i) => i !== index));
  const updateLine = (index: number, field: keyof LineFormState, value: string | number) => {
    const next = [...lines];
    next[index] = { ...next[index], [field]: value } as LineFormState;
    setLines(next);
  };
  const updateDecimal = (
    index: number,
    field: "estimatedWeight" | "declaredValue",
    raw: string
  ) => {
    if (DECIMAL_PATTERN.test(raw)) updateLine(index, field, raw);
  };

  // ─── Cotización en vivo ───────────────────────────────────────────────────

  const parsedWeight = Number(estimatedWeight);
  const quoteRequest: QuoteRequest | null =
    !Number.isFinite(parsedWeight) || parsedWeight <= 0
      ? null
      : {
          supplierId: companyId,
          originDepartment,
          destinationDepartment,
          // Una solicitud de recojo SIEMPRE nace en un domicilio: si el paquete
          // lo trajeran al mostrador no haría falta pedir el recojo.
          originPointType: "Door",
          destinationPointType,
          weight: parsedWeight,
          isExpress,
          vehicleType: requestedVehicleType,
        };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!senderName.trim() || !senderPhone.trim() || !pickupAddress.trim()) {
      showToast("error", "Faltan datos", "Completá quién entrega el paquete y dónde buscarlo.");
      return;
    }
    // El enlace de mapa SÍ es obligatorio en un recojo: el conductor va a un
    // domicilio que nadie del equipo conoce.
    if (!pickupLocationUrl.trim()) {
      showToast(
        "error",
        "Falta el mapa",
        "El conductor necesita el enlace de ubicación para encontrar el domicilio."
      );
      return;
    }
    if (destinationIsBranch && !destinationBranchOfficeId) {
      showToast("error", "Faltan datos", "Indicá en qué sucursal se retira el paquete.");
      return;
    }
    if (!destinationIsBranch && (!destinationAddress.trim() || !destinationLocationUrl.trim())) {
      showToast(
        "error",
        "Faltan datos",
        "Si la entrega es a domicilio, indicá la dirección y el enlace de mapa."
      );
      return;
    }
    if (pickupWindowStart >= pickupWindowEnd) {
      showToast(
        "error",
        "Ventana horaria inválida",
        "La hora de inicio tiene que ser anterior a la de fin."
      );
      return;
    }
    if (pickupDate < todayApiDay()) {
      showToast("error", "Fecha inválida", "La fecha de recojo no puede ser anterior a hoy.");
      return;
    }
    if (lines.some((l) => !l.articleName.trim())) {
      showToast("error", "Faltan datos", "Todos los artículos declarados necesitan un nombre.");
      return;
    }

    const payload: CreatePickupOrderRequest = {
      originDepartment,
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      pickupAddress: pickupAddress.trim(),
      pickupLocationUrl: pickupLocationUrl.trim(),
      pickupAddressReference: pickupAddressReference.trim() || null,

      destinationPointType,
      destinationDepartment,
      // Solo se manda lo que corresponde a la modalidad: el backend rechaza el
      // resto en vez de ignorarlo.
      destinationBranchOfficeId: destinationIsBranch ? destinationBranchOfficeId : null,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      recipientPhoneAlt: recipientPhoneAlt.trim() || null,
      destinationAddress: destinationIsBranch ? null : destinationAddress.trim(),
      destinationLocationUrl: destinationIsBranch ? null : destinationLocationUrl.trim(),
      destinationAddressReference: destinationIsBranch
        ? null
        : destinationAddressReference.trim() || null,

      pickupDate,
      pickupWindowStart: toApiTime(pickupWindowStart),
      pickupWindowEnd: toApiTime(pickupWindowEnd),

      estimatedWeight: Number(estimatedWeight) || 0,
      packageCount,
      packageDescription: packageDescription.trim(),
      requestedVehicleType,
      isExpress,
      paymentType: effectivePaymentType,
      comments: comments.trim() || null,

      lines: lines.map((l) => ({
        articleName: l.articleName.trim(),
        quantity: l.quantity,
        estimatedWeight: Number(l.estimatedWeight) || 0,
        declaredValue: Number(l.declaredValue) || 0,
      })),
    };

    runSubmit(async () => {
      try {
        if (isEdit && pickupOrder) {
          await pickupOrderService.updatePickupOrder(pickupOrder.id, payload);
          showToast("success", "Solicitud actualizada", `${pickupOrder.code} quedó guardada.`);
        } else {
          const created = await pickupOrderService.createPickupOrder(payload);
          showToast(
            "success",
            "Solicitud registrada",
            `${created.code} · estimado Bs ${created.estimatedPrice.toFixed(2)}. La sucursal la confirma antes de salir a buscarlo.`
          );
        }
        onSaved();
        onClose();
      } catch (err: unknown) {
        showToast(
          "error",
          "Error",
          getPickupOrderErrorMessage(err, "No se pudo guardar la solicitud.")
        );
      }
    });
  };

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="shrink-0 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {isEdit ? "Editar solicitud de recojo" : "Nueva solicitud de recojo"}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isEdit
            ? "Una vez confirmada, el precio estimado es un compromiso y ya no se puede editar."
            : "Un conductor va a buscar el paquete al domicilio y lo lleva al mostrador."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 overflow-y-auto px-6 py-5">
        {/* ── Dónde buscarlo ───────────────────────────────────────────── */}
        <section>
          <h5 className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-500">
            Dónde buscar el paquete
          </h5>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label required>Quién entrega</Label>
              <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
            </div>
            <div>
              <Label required>Teléfono</Label>
              <Input value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} />
            </div>
            <div>
              <Label required>Departamento</Label>
              <select
                className={selectClassName}
                value={originDepartment}
                onChange={(e) => setOriginDepartment(e.target.value as BolivianDepartment)}
              >
                {DEPARTAMENTOS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label required>Dirección</Label>
              <Input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} />
            </div>
            <div>
              <Label required>Enlace de mapa</Label>
              <Input
                value={pickupLocationUrl}
                onChange={(e) => setPickupLocationUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/…"
              />
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Obligatorio: el conductor va a un domicilio que no conoce.
              </p>
            </div>
            <div>
              <Label required={false}>
                Referencia
                <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
              </Label>
              <Input
                value={pickupAddressReference}
                onChange={(e) => setPickupAddressReference(e.target.value)}
                placeholder="Ej. Portón verde, timbre 2"
              />
            </div>
          </div>
        </section>

        {/* ── Cuándo ───────────────────────────────────────────────────── */}
        <section>
          <h5 className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-500">
            Cuándo pasar
          </h5>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label required>Fecha</Label>
              <Input
                type="date"
                value={pickupDate}
                min={todayApiDay()}
                onChange={(e) => setPickupDate(e.target.value)}
              />
            </div>
            <div>
              <Label required>Desde</Label>
              <Input
                type="time"
                value={pickupWindowStart}
                onChange={(e) => setPickupWindowStart(e.target.value)}
              />
            </div>
            <div>
              <Label required>Hasta</Label>
              <Input
                type="time"
                value={pickupWindowEnd}
                onChange={(e) => setPickupWindowEnd(e.target.value)}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            La ventana viene precargada con el horario de atención de la empresa; ajustala si hace
            falta.
          </p>
        </section>

        {/* ── A dónde va ───────────────────────────────────────────────── */}
        <section>
          <h5 className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-500">
            A dónde va
          </h5>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label required>Quién recibe</Label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            </div>
            <div>
              <Label required>Teléfono</Label>
              <Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
            </div>
            <div>
              <Label required={false}>
                Teléfono alternativo
                <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
              </Label>
              <Input
                value={recipientPhoneAlt}
                onChange={(e) => setRecipientPhoneAlt(e.target.value)}
              />
            </div>
            <div>
              <Label required>Departamento de destino</Label>
              <select
                className={selectClassName}
                value={destinationDepartment}
                onChange={(e) =>
                  handleDestinationDepartmentChange(e.target.value as BolivianDepartment)
                }
              >
                {DEPARTAMENTOS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label required>¿Cómo lo recibe?</Label>
              <select
                className={selectClassName}
                value={destinationPointType}
                onChange={(e) => setDestinationPointType(e.target.value as ServicePointType)}
              >
                {SERVICE_POINT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Los campos del destino son excluyentes: mandar los que no
                corresponden hace que el backend rechace la solicitud. */}
            {destinationIsBranch ? (
              <div>
                <Label required>Sucursal de destino</Label>
                <select
                  className={selectClassName}
                  value={destinationBranchOfficeId}
                  onChange={(e) => setDestinationBranchOfficeId(e.target.value)}
                  disabled={loadingBranches || destinationBranches.length === 0}
                >
                  <option value="">
                    {loadingBranches
                      ? "Cargando sucursales…"
                      : destinationBranches.length === 0
                      ? "Sin sucursales en este departamento"
                      : "Seleccioná una sucursal"}
                  </option>
                  {destinationBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.city}
                      {b.code ? ` — ${b.code}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <Label required>Dirección de entrega</Label>
                  <Input
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                  />
                </div>
                <div>
                  <Label required>Enlace de mapa</Label>
                  <Input
                    value={destinationLocationUrl}
                    onChange={(e) => setDestinationLocationUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/…"
                  />
                </div>
                <div>
                  <Label required={false}>
                    Referencia
                    <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
                  </Label>
                  <Input
                    value={destinationAddressReference}
                    onChange={(e) => setDestinationAddressReference(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Qué es ───────────────────────────────────────────────────── */}
        <section>
          <h5 className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-500">
            Qué se envía
          </h5>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label required>Peso estimado (kg)</Label>
              <Input
                value={estimatedWeight}
                onChange={(e) =>
                  DECIMAL_PATTERN.test(e.target.value) && setEstimatedWeight(e.target.value)
                }
                inputMode="decimal"
              />
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Se cobra el peso de balanza al recibirlo.
              </p>
            </div>
            <div>
              <Label required>Bultos</Label>
              <Input
                type="number"
                min="1"
                value={packageCount}
                onChange={(e) => setPackageCount(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label required>Vehículo que pedís</Label>
              <select
                className={selectClassName}
                value={requestedVehicleType}
                onChange={(e) => setRequestedVehicleType(e.target.value as VehicleType)}
              >
                {VEHICLE_TYPE_OPTIONS.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-warning-600 dark:text-warning-400">
                Si el bulto no entra, el recojo se cierra fallido y hay que pedirlo de nuevo con
                auto.
              </p>
            </div>
            <div>
              <Label required>Forma de pago</Label>
              <select
                className={selectClassName}
                value={effectivePaymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              >
                {formaDePagoOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <Label required>Descripción de los bultos</Label>
              <Input
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                placeholder="Ej. 2 cajas medianas de ropa"
              />
            </div>
            <div className="flex items-end pb-2.5">
              <Checkbox
                id="recojo-express"
                label="Envío expreso"
                checked={isExpress}
                onChange={setIsExpress}
              />
            </div>
          </div>
        </section>

        {/* ── Artículos declarados ─────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wider text-brand-500">
              Artículos declarados
            </h5>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              <PlusIcon className="size-4" /> Agregar
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800/40">
                  <TableRow>
                    <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Artículo
                    </TableCell>
                    <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Cant.
                    </TableCell>
                    <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Peso est. (kg)
                    </TableCell>
                    <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Valor declarado
                    </TableCell>
                    <TableCell isHeader className="w-12 px-3 py-2">{null}</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {lines.map((line, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="min-w-[180px] px-3 py-2">
                        <Input
                          value={line.articleName}
                          onChange={(e) => updateLine(idx, "articleName", e.target.value)}
                          placeholder="Ej. Caja de zapatos"
                          className="!h-9"
                        />
                      </TableCell>
                      <TableCell className="w-24 px-3 py-2">
                        <Input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(idx, "quantity", parseInt(e.target.value) || 1)
                          }
                          className="!h-9"
                        />
                      </TableCell>
                      <TableCell className="w-32 px-3 py-2">
                        <Input
                          value={line.estimatedWeight}
                          onChange={(e) => updateDecimal(idx, "estimatedWeight", e.target.value)}
                          inputMode="decimal"
                          className="!h-9"
                        />
                      </TableCell>
                      <TableCell className="w-32 px-3 py-2">
                        <Input
                          value={line.declaredValue}
                          onChange={(e) => updateDecimal(idx, "declaredValue", e.target.value)}
                          inputMode="decimal"
                          className="!h-9"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right">
                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
                          >
                            <TrashBinIcon className="size-4" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>

        {/* ── Precio estimado ──────────────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <Label required={false}>
              Comentarios
              <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
            </Label>
            <TextArea
              value={comments}
              onChange={setComments}
              rows={4}
              placeholder="Algo que el conductor tenga que saber antes de ir"
            />
          </div>
          <QuotePanel request={quoteRequest} onQuote={setQuote} />
        </section>

        {quote && (
          <p className="-mt-2 text-xs text-gray-400 dark:text-gray-500">
            Es un estimado sobre el peso declarado. El precio definitivo sale del peso de balanza
            cuando el paquete llega al mostrador.
          </p>
        )}

        {isSuperAdminUser && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            La sucursal que sale a buscarlo la resuelve el backend según el departamento de origen.
          </p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Solicitar recojo"}
          </Button>
        </div>
      </form>
    </div>
  );
}
