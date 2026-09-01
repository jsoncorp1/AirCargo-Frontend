"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import {
  orderDeliveryService,
  OrderDeliveryPaginatedItem,
  OrderType,
} from "@/services/orderDeliveryService";
import {
  shipmentService,
  CreateShipmentRequest,
  ShipmentStatus,
  ShipmentObservation,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_BADGE,
  SHIPMENT_OBSERVATION_LABELS,
  getShipmentErrorMessage,
} from "@/services/shipmentService";
import { branchOfficeService, BranchOffice } from "@/services/branchOfficeService";
import type { BolivianDepartment } from "@/services/supplierService";
import {
  PaymentType,
  PaymentMethod,
  ServicePointType,
  VehicleType,
  VEHICLE_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  paymentTypeLabel,
  paymentMethodLabel,
  servicePointTypeLabel,
  formatBs,
} from "@/services/logisticsEnums";
import type { QuoteRequest, QuoteResponse } from "@/services/pricingService";
import QuotePanel from "@/components/pricing/QuotePanel";
import PriceOverrideField, {
  PriceOverrideState,
  emptyPriceOverride,
  needsOverrideReason,
  priceOverridePayload,
} from "@/components/pricing/PriceOverrideField";
import { useAuth } from "@/context/AuthContext";
import ShipmentWaybill from "./ShipmentWaybill";
import ShipmentLetterPdf from "./ShipmentLetterPdf";
import { exportElementToPDF } from "@/utils/pdfExport";
import { formatDate, formatTime } from "@/utils/datetime";

interface ShipmentFormProps {
  mode: "create" | "edit" | "view";
  shipmentId?: string | null;
  // Al atender una orden desde el listado de órdenes, la orden ya viene elegida:
  // en vez del selector se muestran sus datos y solo se piden los del envío.
  presetOrderDeliveryId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

// Everything needed to render the header — sourced from the linked order,
// since the shipment DTO alone doesn't carry phone/delivery-type/supplier.
interface OrderHeaderInfo {
  clientPhone: string;
  destinationDepartment: string;
  // Sucursal que declaró quien creó la orden. Se muestra para que el admin vea
  // qué pidieron antes de confirmar la sucursal real del envío.
  destinationBranchOfficeCode: string | null;
  destinationBranchOfficeCity: string | null;
  clientAddress: string;
  paymentType: PaymentType;
  // Modalidad de destino: define si el precio incluye cargo de puerta y si el
  // envío va a esperar un retiro en mostrador en vez de un conductor.
  destinationPointType: ServicePointType;
  // Modalidad de origen: con la de destino arma el tipo de envío (P2P/S2P/…)
  // que imprime la guía.
  originPointType: ServicePointType;
  // Ubicación y observación del destino: la guía corporativa las imprime.
  destinationLocationUrl: string | null;
  destinationAddressReference: string | null;
  // Corporativa o esporádica: define qué variante de guía se imprime.
  orderType: OrderType;
  isExpress: boolean;
  supplierId: string | null;
  supplierName: string | null;
  originDepartment: string;
  senderFullName: string;
  senderPhone: string;
  senderAddress: string;
}

interface ShipmentLineFormState {
  orderDeliveryDetailId: string;
  shipmentDetailId?: string;
  articleName: string;
  quantity: number;
  unitPrice: number;
  weight: number;
  // Solo de LECTURA: lo calcula el backend repartiendo el precio del envío
  // entre las líneas según su peso. Ya no se carga a mano ni se manda.
  shippingCost: number;
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
        {value || "—"}
      </p>
    </div>
  );
}

export default function ShipmentForm({
  mode,
  shipmentId,
  presetOrderDeliveryId,
  onClose,
  onSaved,
}: ShipmentFormProps) {
  const { showToast } = useToast();
  // El superadmin no tiene sucursal propia: debe indicar desde cuál atiende.
  // Para admin/conductor el backend usa la suya e ignora lo que se mande.
  const { isSuperAdminUser, branchOfficeLabel } = useAuth();
  const readOnly = mode === "view";
  // Modo "atender orden": create con la orden ya fijada desde el listado.
  const attendingOrder = mode === "create" && !!presetOrderDeliveryId;

  const [loading, setLoading] = useState(mode !== "create");
  // Cerrojo: bloquea guardar/cancelar mientras la petición está en curso (y
  // corta el segundo click del doble click).
  const { pending: submitting, run: runSubmit } = useSubmitLock();
  const [exporting, setExporting] = useState<"print" | "pdf" | null>(null);
  const waybillRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Data sources
  const [orders, setOrders] = useState<OrderDeliveryPaginatedItem[]>([]);
  const [branchOffices, setBranchOffices] = useState<BranchOffice[]>([]);
  const [lines, setLines] = useState<ShipmentLineFormState[]>([]);

  // Form State
  const [orderDeliveryId, setOrderDeliveryId] = useState<string>(presetOrderDeliveryId ?? "");
  const [originBranchOfficeId, setOriginBranchOfficeId] = useState<string>("");
  const [destinationBranchOfficeId, setDestinationBranchOfficeId] = useState<string>("");
  const [packageCount, setPackageCount] = useState<number>(1);
  const [packageDescription, setPackageDescription] = useState<string>("");
  // Define el cargo de puerta. Solo pesa si el destino es domicilio: en un
  // retiro en mostrador no se cobra viaje.
  const [deliveryVehicleType, setDeliveryVehicleType] = useState<VehicleType>("Motorcycle");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  // El precio sale de la tarifa; esto es solo el ajuste manual y su motivo.
  const [priceOverride, setPriceOverride] = useState<PriceOverrideState>(emptyPriceOverride);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  // Multisucursal / estado (solo lectura, viene del backend)
  const [originBranchLabel, setOriginBranchLabel] = useState<string | null>(null);
  const [destinationBranchLabel, setDestinationBranchLabel] = useState<string | null>(null);
  const [status, setStatus] = useState<ShipmentStatus | null>(null);
  const [observation, setObservation] = useState<ShipmentObservation | null>(null);
  const [deliveryComment, setDeliveryComment] = useState<string | null>(null);

  // Header display data
  const [guia, setGuia] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  // El instante real del envío: `fecha` y `hora` son texto ya formateado
  // para mostrar, y la carta PDF necesita la fecha de verdad, no ese texto.
  const [createdAt, setCreatedAt] = useState("");
  const [cliente, setCliente] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [orderInfo, setOrderInfo] = useState<OrderHeaderInfo | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      // Solo las órdenes sin atender se pueden convertir en envío. El backend
      // además limita el listado a las del departamento del admin: atender una
      // orden de otro departamento devuelve 403 shipment.orderdelivery.forbidden.
      const res = await orderDeliveryService.getDeliveries(1, 100, {
        attentionStatus: "Unattended",
      });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "No se pudieron cargar las órdenes de entrega.");
    }
  }, [showToast]);

  const fetchBranchOffices = useCallback(async () => {
    try {
      const res = await branchOfficeService.getBranchOffices(1, 100);
      setBranchOffices(res.data);
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "No se pudieron cargar las sucursales.");
    }
  }, [showToast]);

  const loadOrderDetails = useCallback(async (id: string) => {
    try {
      const order = await orderDeliveryService.getDeliveryById(id);
      setCliente(order.clientFullName);
      setOrderInfo({
        clientPhone: order.clientPhone,
        destinationDepartment: order.destinationDepartment,
        destinationBranchOfficeCode: order.destinationBranchOfficeCode,
        destinationBranchOfficeCity: order.destinationBranchOfficeCity,
        clientAddress: order.clientAddress,
        paymentType: order.paymentType,
        destinationPointType: order.destinationPointType ?? "Door",
        // Una orden despacha siempre desde mostrador; el origen a domicilio
        // solo existe cuando el envío nació de una solicitud de recojo.
        originPointType: "Branch",
        destinationLocationUrl: order.destinationLocationUrl ?? null,
        destinationAddressReference: order.destinationAddressReference ?? null,
        orderType: order.orderType,
        isExpress: order.isExpress,
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        originDepartment: order.originDepartment,
        senderFullName: order.senderFullName,
        senderPhone: order.senderPhone,
        senderAddress: order.senderAddress,
      });

      if (mode === "create") {
        // La sucursal que declaró la orden se preselecciona, pero es una
        // indicación y no una orden de mando: el admin puede cambiarla y el
        // envío se crea con la que él elija, sin tocar la orden.
        if (order.destinationBranchOfficeId) {
          setDestinationBranchOfficeId(order.destinationBranchOfficeId);
        }

        setLines(
          order.details.map(d => ({
            orderDeliveryDetailId: d.id,
            articleName: d.articleName,
            quantity: d.quantity,
            unitPrice: d.unitPrice,
            weight: 0,
            shippingCost: 0,
          }))
        );
      }
    } catch (err) {
      console.error(err);
      // Sin las líneas de la orden no se puede armar el envío: hay que avisar,
      // si no el formulario queda vacío y el botón deshabilitado sin explicación.
      showToast(
        "error",
        "Error",
        getShipmentErrorMessage(err, "No se pudieron cargar los datos de la orden.")
      );
    }
  }, [mode, showToast]);

  const loadShipment = useCallback(async () => {
    if (!shipmentId) return;
    try {
      const shipment = await shipmentService.getShipmentById(shipmentId);
      setOrderDeliveryId(shipment.orderDeliveryId);
      setGuia(shipment.code);
      setCreatedAt(shipment.createdAt);
      setFecha(formatDate(shipment.createdAt));
      setHora(formatTime(shipment.createdAt));
      setCliente(shipment.clientFullName);
      setCreatedBy(shipment.createdBy);
      setPackageCount(shipment.packageCount);
      setPackageDescription(shipment.packageDescription);
      setOriginBranchLabel(
        shipment.originBranchOfficeCode
          ? [shipment.originBranchOfficeCode, shipment.originBranchOfficeCity].filter(Boolean).join(" — ")
          : null
      );
      setDestinationBranchLabel(
        shipment.destinationBranchOfficeCode
          ? [shipment.destinationBranchOfficeCode, shipment.destinationBranchOfficeCity].filter(Boolean).join(" — ")
          : null
      );
      setStatus(shipment.status ?? null);
      setObservation(shipment.observation ?? null);
      setDeliveryComment(shipment.deliveryComment ?? null);
      setPaymentMethod(shipment.paymentMethod ?? "");
      setOrderInfo((prev) => ({
        clientPhone: prev?.clientPhone ?? "",
        destinationDepartment: shipment.destinationDepartment,
        // Estos dos vienen de la orden, no del envío: se completan abajo.
        destinationBranchOfficeCode: prev?.destinationBranchOfficeCode ?? null,
        destinationBranchOfficeCity: prev?.destinationBranchOfficeCity ?? null,
        clientAddress: shipment.clientAddress,
        paymentType: prev?.paymentType ?? shipment.paymentType ?? "Prepaid",
        destinationPointType:
          shipment.destinationPointType ?? prev?.destinationPointType ?? "Door",
        originPointType: shipment.originPointType ?? prev?.originPointType ?? "Branch",
        destinationLocationUrl:
          shipment.destinationLocationUrl ?? prev?.destinationLocationUrl ?? null,
        destinationAddressReference:
          shipment.destinationAddressReference ?? prev?.destinationAddressReference ?? null,
        // El envío no dice de qué tipo de orden salió, pero su código sí
        // (`COR-…`/`ESP-…`): la guía lo deduce sola si acá no hay nada todavía.
        orderType: prev?.orderType ?? (shipment.code?.toUpperCase().startsWith("ESP")
          ? "Sporadic"
          : "Corporate"),
        isExpress: prev?.isExpress ?? false,
        supplierId: prev?.supplierId ?? null,
        supplierName: prev?.supplierName ?? "",
        originDepartment: shipment.originDepartment,
        senderFullName: shipment.senderFullName,
        senderPhone: shipment.senderPhone,
        senderAddress: shipment.senderAddress,
      }));
      setLines(shipment.details.map(d => ({
        orderDeliveryDetailId: d.orderDeliveryDetailId,
        shipmentDetailId: d.id,
        articleName: d.articleName,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        weight: d.weight,
        shippingCost: d.shippingCost,
      })));

      // Fill in the fields the shipment itself doesn't carry (phone, delivery type, supplier).
      try {
        const order = await orderDeliveryService.getDeliveryById(shipment.orderDeliveryId);
        setOrderInfo({
          clientPhone: order.clientPhone,
          destinationDepartment: shipment.destinationDepartment,
          destinationBranchOfficeCode: order.destinationBranchOfficeCode,
          destinationBranchOfficeCity: order.destinationBranchOfficeCity,
          clientAddress: shipment.clientAddress,
          paymentType: order.paymentType,
          destinationPointType:
            shipment.destinationPointType ?? order.destinationPointType ?? "Door",
          originPointType: shipment.originPointType ?? "Branch",
          destinationLocationUrl:
            shipment.destinationLocationUrl ?? order.destinationLocationUrl ?? null,
          destinationAddressReference:
            shipment.destinationAddressReference ?? order.destinationAddressReference ?? null,
          orderType: order.orderType,
          isExpress: order.isExpress,
          supplierId: order.supplierId,
          supplierName: order.supplierName,
          originDepartment: shipment.originDepartment,
          senderFullName: shipment.senderFullName,
          senderPhone: shipment.senderPhone,
          senderAddress: shipment.senderAddress,
        });
      } catch {
        // Non-fatal — the order may have been removed; keep what the shipment itself has.
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "No se pudo cargar el envío.");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [shipmentId, showToast, onClose]);

  useEffect(() => {
    if (mode === "create") {
      fetchBranchOffices();
      if (presetOrderDeliveryId) {
        // La orden ya está elegida: solo se cargan sus líneas y datos de cabecera.
        loadOrderDetails(presetOrderDeliveryId);
      } else {
        fetchOrders();
      }
    } else {
      loadShipment();
    }
  }, [
    mode,
    presetOrderDeliveryId,
    fetchOrders,
    fetchBranchOffices,
    loadOrderDetails,
    loadShipment,
  ]);

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setOrderDeliveryId(val);
    loadOrderDetails(val);
  };

  useEffect(() => {
    if (orderInfo?.paymentType !== "Prepaid") {
      setPaymentMethod("");
    }
  }, [orderInfo?.paymentType]);

  // Solo el peso: el costo por línea lo calcula el backend repartiendo el precio
  // del envío, así que ya no hay nada que tipear en esa columna.
  const handleWeightChange = (index: number, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], weight: parseFloat(value) || 0 };
    setLines(newLines);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      showToast("error", "Error", "El envío debe tener detalles configurados.");
      return;
    }
    if (packageCount <= 0) {
      showToast("error", "Error", "La cantidad de paquetes debe ser mayor a cero.");
      return;
    }
    if (!packageDescription.trim()) {
      showToast("error", "Error", "Debe describir los paquetes del envío.");
      return;
    }
    if (mode === "create" && !destinationBranchOfficeId) {
      showToast("error", "Error", "Debe seleccionar la sucursal de destino.");
      return;
    }
    if (mode === "create" && isSuperAdminUser && !originBranchOfficeId) {
      showToast("error", "Error", "Debe seleccionar la sucursal de origen.");
      return;
    }
    if (orderInfo?.paymentType === "Prepaid" && !paymentMethod) {
      showToast("error", "Error", "Debe seleccionar un medio de pago para un envío prepagado.");
      return;
    }

    runSubmit(async () => {
      try {
        // `shippingPrice: null` = manda la tarifa. Solo se manda un número
        // cuando el operador la ajustó a mano, y ahí va con su motivo.
        const pricing = priceOverridePayload(priceOverride, quote?.total);

        if (mode === "create") {
          const payload: CreateShipmentRequest = {
            orderDeliveryId,
            // Se manda siempre: el backend lo ignora para admin/conductor.
            originBranchOfficeId: originBranchOfficeId || null,
            destinationBranchOfficeId,
            packageCount,
            packageDescription: packageDescription.trim(),
            deliveryVehicleType,
            paymentMethod: paymentMethod || null,
            ...pricing,
            lines: lines.map((l) => ({
              orderDeliveryDetailId: l.orderDeliveryDetailId,
              weight: l.weight,
            })),
          };
          await shipmentService.createShipment(payload);
          showToast(
            "success",
            attendingOrder ? "Orden atendida" : "Envío creado",
            attendingOrder
              ? "Se generó la guía; la orden queda como atendida y el envío ya aparece en Envíos."
              : "El envío fue registrado exitosamente."
          );
        } else if (mode === "edit" && shipmentId) {
          // El PUT recotiza con el peso corregido: cambiar el peso cambia el
          // precio en vez de dejar el importe viejo.
          await shipmentService.updateShipment(shipmentId, {
            packageCount,
            packageDescription: packageDescription.trim(),
            deliveryVehicleType,
            paymentMethod: paymentMethod || null,
            ...pricing,
            lines: lines.map((l) => ({
              shipmentDetailId: l.shipmentDetailId ?? "",
              weight: l.weight,
            })),
          });
          showToast("success", "Envío actualizado", "El envío fue actualizado exitosamente.");
        }
        onSaved();
        onClose();
      } catch (err: unknown) {
        showToast("error", "Error", getShipmentErrorMessage(err, "No se pudo guardar el envío."));
      }
    });
  };

  const handlePrint = () => {
    setExporting("print");
    try {
      if (!waybillRef.current) return;
      const printWindow = window.open("", "_blank", "width=800,height=900");
      if (!printWindow) {
        showToast("error", "Error", "El navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes.");
        return;
      }

      // Obtener los estilos de Tailwind actuales
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(style => style.outerHTML)
        .join('\n');

      const waybillHtml = waybillRef.current.outerHTML;

      printWindow.document.write(`<!DOCTYPE html>
        <html>
          <head>
            <title>Guía ${guia || "envío"}</title>
            ${styles}
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              @page {
                size: 80mm 200mm;
                margin: 0;
              }
              html, body {
                width: 80mm;
                background: white;
                margin: 0;
                padding: 0;
              }
              /* Forzar impresión de fondos (necesario para bg-black etc en Tailwind) */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .page-break { page-break-after: always; }
            </style>
          </head>
          <body onload="setTimeout(function() { window.print(); window.close(); }, 500)">
            ${waybillHtml}
            <div class="page-break"></div>
            ${waybillHtml}
            <div class="page-break"></div>
            ${waybillHtml}
            <div class="page-break"></div>
            ${waybillHtml}
          </body>
        </html>`);
      printWindow.document.close();
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "No se pudo generar la vista de impresión.");
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (!pdfRef.current) return;
    try {
      setExporting("pdf");
      await exportElementToPDF(pdfRef.current, {
        filename: `Guia_${guia || "Envio"}.pdf`,
        format: [80, 200]
      });
    } catch (error) {
      console.error(error);
      showToast("error", "Error", "Hubo un error al generar el PDF.");
    } finally {
      setExporting(null);
    }
  };

  const goodsValue = lines.reduce((acc, line) => acc + line.quantity * line.unitPrice, 0);
  const totalCost = lines.reduce((acc, line) => acc + (line.shippingCost || 0), 0);
  const totalWeight = lines.reduce((acc, line) => acc + (line.weight || 0), 0);

  // El departamento desde el que sale: la sucursal elegida manda sobre el de la
  // orden, que solo dice dónde está la empresa.
  const originDepartment =
    (branchOffices.find((b) => b.id === originBranchOfficeId)?.bolivianDepartment as
      | BolivianDepartment
      | undefined) ?? (orderInfo?.originDepartment as BolivianDepartment | undefined);

  // Una orden corporativa despacha SIEMPRE desde el mostrador: el origen es
  // `Branch` y no se elige. Un origen a domicilio es una solicitud de recojo.
  const quoteRequest: QuoteRequest | null =
    readOnly || !orderInfo || !originDepartment || totalWeight <= 0
      ? null
      : {
          supplierId: orderInfo.supplierId,
          originDepartment,
          destinationDepartment: orderInfo.destinationDepartment,
          originPointType: "Branch",
          destinationPointType: orderInfo.destinationPointType,
          weight: totalWeight,
          isExpress: orderInfo.isExpress,
          vehicleType: deliveryVehicleType,
        };

  // El cargo de puerta solo existe si va un conductor. En un retiro en mostrador
  // el vehículo no cambia el precio, así que preguntarlo sería ruido.
  const chargesDoorService = orderInfo?.destinationPointType === "Door";

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Cargando datos del envío...</div>;
  }

  if (mode === "view") {
    return (
      <div className="flex flex-col max-h-[85vh]">
        <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800 shrink-0">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Detalle de Envío</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Guía de envío lista para imprimir.</p>
        </div>

        <div className="overflow-y-auto bg-gray-100 px-6 py-6 custom-scrollbar dark:bg-gray-900/60">
          {(status || originBranchLabel || destinationBranchLabel) && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-wrap items-center gap-3">
                {status && (
                  <Badge size="sm" color={SHIPMENT_STATUS_BADGE[status] ?? "light"}>
                    {SHIPMENT_STATUS_LABELS[status] ?? status}
                  </Badge>
                )}
                {observation && (
                  <span className="text-xs text-warning-600 dark:text-orange-400">
                    {SHIPMENT_OBSERVATION_LABELS[observation] ?? observation}
                  </span>
                )}
                {(originBranchLabel || destinationBranchLabel) && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {originBranchLabel ?? "—"} &rarr; {destinationBranchLabel ?? "—"}
                  </span>
                )}
              </div>
              {deliveryComment && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Comentario del delivery:</span> {deliveryComment}
                </p>
              )}
            </div>
          )}
          <div ref={waybillRef} className="flex justify-center">
            <ShipmentWaybill
              code={guia}
              orderType={orderInfo?.orderType}
              originDepartment={orderInfo?.originDepartment ?? ""}
              originBranchAddress={(orderInfo as any)?.originBranchOfficeAddress || (orderInfo as any)?.originAddress || null}
              destinationDepartment={orderInfo?.destinationDepartment ?? ""}
              senderFullName={orderInfo?.senderFullName ?? ""}
              senderPhone={orderInfo?.senderPhone ?? ""}
              senderAddress={orderInfo?.senderAddress ?? ""}
              clientFullName={cliente}
              clientPhone={orderInfo?.clientPhone ?? ""}
              clientAddress={orderInfo?.clientAddress ?? ""}
              paymentType={orderInfo?.paymentType ?? "Prepaid"}
              paymentMethod={paymentMethod || undefined}
              originPointType={orderInfo?.originPointType}
              destinationPointType={orderInfo?.destinationPointType}
              destinationLocationUrl={orderInfo?.destinationLocationUrl}
              destinationAddressReference={orderInfo?.destinationAddressReference}
              isExpress={orderInfo?.isExpress ?? false}
              packageCount={packageCount}
              packageDescription={packageDescription}
              lines={lines}
              fecha={fecha}
              hora={hora}
              createdBy={createdBy}
            />
          </div>
          <div className="absolute top-[-9999px] left-[-9999px]">
            <ShipmentLetterPdf
              ref={pdfRef}
              envio={{
                id: shipmentId || "",
                orderDeliveryId: orderDeliveryId,
                waybillNumber: "",
                code: guia,
                originDepartment: orderInfo?.originDepartment ?? "",
                senderFullName: orderInfo?.senderFullName ?? "",
                senderPhone: orderInfo?.senderPhone ?? "",
                senderAddress: orderInfo?.senderAddress ?? "",
                clientFullName: cliente,
                clientAddress: orderInfo?.clientAddress ?? "",
                clientPhone: orderInfo?.clientPhone ?? "",
                destinationDepartment: orderInfo?.destinationDepartment ?? "",
                totalWeight: lines.reduce((acc, l) => acc + (l.weight || 0), 0),
                shippingPrice: lines.reduce((acc, l) => acc + (l.shippingCost || 0), 0),
                packageCount: packageCount,
                packageDescription: packageDescription,
                createdAt: createdAt || new Date().toISOString(),
                createdBy: createdBy,
                details: lines.map((l, i) => ({
                  id: String(i),
                  orderDeliveryDetailId: "",
                  articleName: l.articleName,
                  quantity: l.quantity,
                  unitPrice: l.unitPrice,
                  weight: l.weight,
                  shippingCost: l.shippingCost
                })),
                status: status || "AtOriginBranch",
                paymentType: orderInfo?.paymentType ?? "Prepaid",
                destinationPointType: orderInfo?.destinationPointType ?? "Door",
              } as any}
            />
          </div>

          {/* MOCK UI: Historial de Observaciones y Evidencias */}
          <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
            <h5 className="mb-4 text-sm font-semibold text-brand-500 uppercase tracking-wider">Historial de Observaciones (Próximamente)</h5>
            <div className="space-y-4">
              {/* Mock Timeline Item 1 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-500 mt-1.5"></div>
                  <div className="w-px h-full bg-gray-200 dark:bg-gray-700 mt-2"></div>
                </div>
                <div className="pb-4">
                  <p className="text-xs text-gray-500">{fecha} {hora}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Envío registrado en sucursal origen</p>
                </div>
              </div>
              {/* Mock Timeline Item 2 */}
              {status === "Delivered" && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-success-500 mt-1.5"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Recientemente</p>
                    <p className="text-sm font-medium text-success-600 dark:text-success-400">Entregado al cliente exitosamente</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Conductor: Juan Pérez</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6 pb-4">
            <h5 className="mb-4 text-sm font-semibold text-brand-500 uppercase tracking-wider">Evidencias Fotográficas (Próximamente)</h5>
            {status === "Delivered" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center relative overflow-hidden group">
                  <span className="text-xs text-gray-500">Foto de Paquete</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?w=300&q=80" alt="Mock 1" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center relative overflow-hidden group">
                  <span className="text-xs text-gray-500">Firma / QR</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1556740714-a8395b3bf30f?w=300&q=80" alt="Mock 2" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Las evidencias se mostrarán aquí una vez que el envío sea entregado u observado.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800 shrink-0">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={exporting !== null}
            startIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V4a1 1 0 011-1h10a1 1 0 011 1v5M6 18H4a1 1 0 01-1-1v-6a1 1 0 011-1h16a1 1 0 011 1v6a1 1 0 01-1 1h-2m-10 0h8v4a1 1 0 01-1 1H8a1 1 0 01-1-1v-4z" />
              </svg>
            }
          >
            {exporting === "print" ? "Preparando..." : "Imprimir Guía"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={exporting !== null}
            startIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            }
          >
            {exporting === "pdf" ? "Exportando..." : "Descargar PDF"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[85vh]">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800 shrink-0">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {attendingOrder
            ? "Atender Orden"
            : mode === "create"
            ? "Registrar Envío"
            : mode === "edit"
            ? "Editar Envío"
            : "Detalle de Envío"}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {attendingOrder
            ? "Completa los datos del envío para esta orden. Al guardar se genera la guía y la orden queda atendida."
            : mode === "create"
            ? "Selecciona una orden de entrega y registra el peso y costo de envío de cada artículo."
            : "Información del envío logístico."}
        </p>
      </div>

      <div className="overflow-y-auto px-6 py-5 custom-scrollbar">
        <form id="shipment-form" onSubmit={handleSubmit} className="space-y-5">

          {/* Header Info */}
          {mode === "create" ? (
            <div>
              {!attendingOrder && (
                <>
                  <Label required>Orden de Entrega Asociada</Label>
                  <select
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    value={orderDeliveryId}
                    onChange={handleOrderChange}
                    required
                  >
                    <option value="" disabled>Seleccione una orden</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        [{formatDate(o.createdAt)}] {o.clientFullName} - {o.destinationDepartment}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {/* Origen: solo el superadmin lo elige (es global, no tiene
                  sucursal propia). Al resto se le muestra la suya, informativa. */}
              <div className={attendingOrder ? "" : "mt-4"}>
                <Label required={isSuperAdminUser}>Sucursal de Origen</Label>
                {isSuperAdminUser ? (
                  <>
                    <select
                      className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      value={originBranchOfficeId}
                      onChange={(e) => setOriginBranchOfficeId(e.target.value)}
                      required
                    >
                      <option value="" disabled>Seleccione la sucursal de origen</option>
                      {branchOffices.map((b) => (
                        <option key={b.id} value={b.id}>{b.code} — {b.city}</option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                      Indica desde qué sucursal estás atendiendo este envío.
                    </p>
                  </>
                ) : (
                  <>
                    <Input value={branchOfficeLabel} disabled className="bg-gray-50 text-gray-500" />
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                      Se registra automáticamente con la sucursal de tu usuario.
                    </p>
                  </>
                )}
              </div>

              <div className="mt-4">
                <Label required>Sucursal de Destino</Label>
                <select
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  value={destinationBranchOfficeId}
                  onChange={(e) => setDestinationBranchOfficeId(e.target.value)}
                  required
                >
                  <option value="" disabled>Seleccione la sucursal de destino</option>
                  {branchOffices
                    .filter((b) => !orderInfo?.destinationDepartment || b.bolivianDepartment === orderInfo.destinationDepartment)
                    .map((b) => (
                    <option key={b.id} value={b.id}>{b.code} — {b.city}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {(mode !== "create" || orderInfo) && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
              <h5 className="mb-4 flex items-center gap-2 text-sm font-bold text-brand-600 uppercase tracking-wider dark:text-brand-400">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                  1
                </span>
                Información de Cabecera
              </h5>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
              {mode !== "create" && <InfoField label="N° de Guía" value={guia} />}
              {mode !== "create" && <InfoField label="Fecha" value={fecha} />}
              <InfoField label="Cliente" value={cliente} />
              <InfoField label="Teléfono" value={orderInfo?.clientPhone} />
              <InfoField
                label="Destino"
                value={
                  orderInfo?.destinationDepartment
                    ? orderInfo.destinationBranchOfficeCity
                      ? `${orderInfo.destinationDepartment} · ${orderInfo.destinationBranchOfficeCity}`
                      : orderInfo.destinationDepartment
                    : undefined
                }
              />
              <InfoField label="Dirección" value={orderInfo?.clientAddress} />
              <InfoField
                label="Forma de Pago"
                value={orderInfo?.paymentType ? paymentTypeLabel(orderInfo.paymentType) : undefined}
              />
              {(mode !== "create" || orderInfo?.paymentType === "Prepaid") && (
                <InfoField
                  label="Cobro"
                  value={paymentMethod ? paymentMethodLabel(paymentMethod) : undefined}
                />
              )}
              <InfoField
                label="Modalidad"
                value={
                  orderInfo?.destinationPointType
                    ? servicePointTypeLabel(orderInfo.destinationPointType)
                    : undefined
                }
              />
              <div className="min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500">Envío Expreso</p>
                <Badge size="sm" color={orderInfo?.isExpress ? "error" : "light"}>
                  {orderInfo?.isExpress ? "Expreso" : "Normal"}
                </Badge>
              </div>
              <InfoField label="Proveedor" value={orderInfo?.supplierName ?? "Cliente esporádico"} />
              <InfoField label="Origen" value={orderInfo?.originDepartment} />
              <InfoField label="Remitente" value={orderInfo?.senderFullName} />
              {orderInfo?.senderPhone && <InfoField label="Teléfono Remitente" value={orderInfo.senderPhone} />}
              {orderInfo?.senderAddress && <InfoField label="Dirección Remitente" value={orderInfo.senderAddress} />}
              {mode !== "create" && (
                <>
                  <InfoField label="Sucursal Origen" value={originBranchLabel} />
                  <InfoField label="Sucursal Destino" value={destinationBranchLabel} />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Estado</p>
                    {status ? (
                      <Badge size="sm" color={SHIPMENT_STATUS_BADGE[status] ?? "light"}>
                        {SHIPMENT_STATUS_LABELS[status] ?? status}
                      </Badge>
                    ) : (
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">—</p>
                    )}
                  </div>
                  <InfoField
                    label="Observación"
                    value={observation ? SHIPMENT_OBSERVATION_LABELS[observation] ?? observation : null}
                  />
                  {deliveryComment && (
                    <div className="col-span-2 min-w-0 sm:col-span-4">
                      <p className="text-xs text-gray-400 dark:text-gray-500">Comentario del Delivery</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{deliveryComment}</p>
                    </div>
                  )}
                </>
              )}
              </div>
            </div>
          )}

          {/* Paquetes */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
            <h5 className="mb-4 flex items-center gap-2 text-sm font-bold text-brand-600 uppercase tracking-wider dark:text-brand-400">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                2
              </span>
              Paquetes y Contenido
            </h5>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label required>Cantidad de Paquetes</Label>
              <Input
                type="number"
                min="1"
                value={packageCount}
                onChange={(e) => setPackageCount(parseInt(e.target.value) || 1)}
                disabled={readOnly}
                required
              />
            </div>
            <div>
              <Label required>Descripción de Paquetes</Label>
              <Input
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                disabled={readOnly}
                required
                placeholder="Ej. 3 cajas"
              />
            </div>
          </div>
          </div>

          {/* Details */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
            <h5 className="mb-4 flex items-center gap-2 text-sm font-bold text-brand-600 uppercase tracking-wider dark:text-brand-400">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                3
              </span>
              Artículos y Costos
            </h5>

            {lines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Seleccione una orden para cargar sus artículos.</p>
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
                        <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Cant.
                        </TableCell>
                        <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          P. Unit.
                        </TableCell>
                        <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Peso (kg)
                        </TableCell>
                        <TableCell isHeader className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Costo Envío
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {lines.map((line, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="px-3 py-2 text-sm text-gray-800 dark:text-white/90">
                            {line.articleName || "Artículo desconocido"}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            {line.quantity}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            Bs {line.unitPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <Input
                              type="number"
                              step={0.01}
                              min="0"
                              value={line.weight}
                              onChange={(e) => handleWeightChange(idx, e.target.value)}
                              disabled={readOnly}
                              required
                              placeholder="0.00"
                              className="!h-9"
                            />
                          </TableCell>
                          {/* Ya no se carga: el backend reparte el precio del
                              envío entre las líneas según su peso. */}
                          <TableCell className="whitespace-nowrap px-3 py-2 text-right align-middle text-sm tabular-nums text-gray-600 dark:text-gray-300">
                            {line.shippingCost > 0 ? formatBs(line.shippingCost) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Precio: sale de la tarifa vigente, no se carga a mano. */}
            {!readOnly && lines.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  {/* El vehículo define el cargo de puerta, así que solo se
                      pregunta cuando hay puerta que cobrar. */}
                  {chargesDoorService && (
                    <div>
                      <Label required>Vehículo para la entrega</Label>
                      <select
                        className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                        value={deliveryVehicleType}
                        onChange={(e) => setDeliveryVehicleType(e.target.value as VehicleType)}
                      >
                        {VEHICLE_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                        El auto cuesta más que la moto: elegí el que realmente va a ir.
                      </p>
                    </div>
                  )}

                  {!chargesDoorService && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      El cliente retira en sucursal, así que no se cobra viaje a domicilio.
                    </p>
                  )}

                  {orderInfo?.paymentType === "Prepaid" && (
                    <div>
                      <Label required>Medio de Cobro</Label>
                      <select
                        className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        required
                      >
                        <option value="" disabled>Seleccione el medio de pago</option>
                        {PAYMENT_METHOD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                        Cómo ingresó el dinero a la caja.
                      </p>
                    </div>
                  )}

                  <PriceOverrideField
                    value={priceOverride}
                    onChange={setPriceOverride}
                    calculatedPrice={quote?.total}
                    disabled={submitting}
                  />
                </div>

                <QuotePanel request={quoteRequest} onQuote={setQuote} />
              </div>
            )}

            {/* Totals */}
            {lines.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Peso Total
                  </p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {totalWeight.toFixed(2)} kg
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Costo Envío
                  </p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    Bs {totalCost.toFixed(2)}
                  </p>
                </div>
                {/* El costo de envío se registra aparte y NO se suma al precio
                    total: el total es el valor de los artículos de la orden. */}
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 dark:border-brand-800 dark:bg-brand-900/20">
                  <p className="text-xs font-medium text-brand-600 uppercase tracking-wider dark:text-brand-400">
                    Precio Total (Artículos)
                  </p>
                  <p className="text-lg font-bold text-brand-800 dark:text-brand-200">
                    Bs {goodsValue.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800 shrink-0">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          {readOnly ? "Cerrar" : "Cancelar"}
        </Button>
        {!readOnly && (
          <Button onClick={() => {
            const form = document.getElementById("shipment-form") as HTMLFormElement | null;
            if (form) form.requestSubmit();
          }} disabled={submitting || lines.length === 0}>
            {submitting
              ? "Guardando..."
              : attendingOrder
              ? "Atender y Generar Guía"
              : mode === "create"
              ? "Registrar Envío"
              : "Guardar Cambios"}
          </Button>
        )}
      </div>
    </div>
  );
}
