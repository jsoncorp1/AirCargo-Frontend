"use client";

import React, { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/context/ToastContext";
import {
  orderDeliveryService,
  OrderDeliveryPaginatedItem,
} from "@/services/orderDeliveryService";
import {
  shipmentService,
  CreateShipmentRequest,
} from "@/services/shipmentService";

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  Prepaid: "Pagada",
  CashOnDelivery: "Por Pagar",
};

interface ShipmentFormProps {
  mode: "create" | "edit" | "view";
  shipmentId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

// Everything needed to render the header — sourced from the linked order,
// since the shipment DTO alone doesn't carry phone/delivery-type/supplier.
interface OrderHeaderInfo {
  clientPhone: string;
  department: string;
  clientAddress: string;
  deliveryType: string;
  supplierName: string | null;
}

interface ShipmentLineFormState {
  orderDeliveryDetailId: string;
  shipmentDetailId?: string;
  articleName: string;
  quantity: number;
  unitPrice: number;
  weight: number;
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

export default function ShipmentForm({ mode, shipmentId, onClose, onSaved }: ShipmentFormProps) {
  const { showToast } = useToast();
  const readOnly = mode === "view";

  const [loading, setLoading] = useState(mode !== "create");
  const [submitting, setSubmitting] = useState(false);

  // Data sources
  const [orders, setOrders] = useState<OrderDeliveryPaginatedItem[]>([]);
  const [lines, setLines] = useState<ShipmentLineFormState[]>([]);

  // Form State
  const [orderDeliveryId, setOrderDeliveryId] = useState<string>("");

  // Header display data
  const [guia, setGuia] = useState("");
  const [fecha, setFecha] = useState("");
  const [cliente, setCliente] = useState("");
  const [orderInfo, setOrderInfo] = useState<OrderHeaderInfo | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderDeliveryService.getDeliveries(1, 100);
      // Only orders that haven't been shipped yet make sense to attach a new shipment to.
      setOrders(res.data.filter((o) => !o.isAttended));
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "No se pudieron cargar las órdenes de entrega.");
    }
  }, [showToast]);

  const loadOrderDetails = useCallback(async (id: string) => {
    try {
      const order = await orderDeliveryService.getDeliveryById(id);
      setCliente(order.clientFullName);
      setOrderInfo({
        clientPhone: order.clientPhone,
        department: order.department,
        clientAddress: order.clientAddress,
        deliveryType: order.deliveryType,
        supplierName: order.supplierName,
      });

      if (mode === "create") {
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
    }
  }, [mode]);

  const loadShipment = useCallback(async () => {
    if (!shipmentId) return;
    try {
      const shipment = await shipmentService.getShipmentById(shipmentId);
      setOrderDeliveryId(shipment.orderDeliveryId);
      setGuia(shipment.code);
      setFecha(new Date(shipment.createdAt).toLocaleDateString("es-BO"));
      setCliente(shipment.clientFullName);
      setOrderInfo((prev) => ({
        clientPhone: prev?.clientPhone ?? "",
        department: shipment.department,
        clientAddress: shipment.clientAddress,
        deliveryType: prev?.deliveryType ?? "",
        supplierName: prev?.supplierName ?? "",
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
          department: shipment.department,
          clientAddress: shipment.clientAddress,
          deliveryType: order.deliveryType,
          supplierName: order.supplierName,
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
      fetchOrders();
    } else {
      loadShipment();
    }
  }, [mode, fetchOrders, loadShipment]);

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setOrderDeliveryId(val);
    loadOrderDetails(val);
  };

  const handleLineChange = (index: number, field: "weight" | "shippingCost", value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: parseFloat(value) || 0 };
    setLines(newLines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      showToast("error", "Error", "El envío debe tener detalles configurados.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        const payload: CreateShipmentRequest = {
          orderDeliveryId,
          lines: lines.map((l) => ({
            orderDeliveryDetailId: l.orderDeliveryDetailId,
            weight: l.weight,
            shippingCost: l.shippingCost,
          })),
        };
        await shipmentService.createShipment(payload);
        showToast("success", "Envío creado", "El envío fue registrado exitosamente.");
      } else if (mode === "edit" && shipmentId) {
        await shipmentService.updateShipment(shipmentId, {
          lines: lines.map((l) => ({
            shipmentDetailId: l.shipmentDetailId ?? "",
            weight: l.weight,
            shippingCost: l.shippingCost,
          })),
        });
        showToast("success", "Envío actualizado", "El envío fue actualizado exitosamente.");
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      showToast("error", "Error", err instanceof Error ? err.message : "No se pudo guardar el envío.");
    } finally {
      setSubmitting(false);
    }
  };

  const goodsValue = lines.reduce((acc, line) => acc + line.quantity * line.unitPrice, 0);
  const totalCost = lines.reduce((acc, line) => acc + (line.shippingCost || 0), 0);
  const totalWeight = lines.reduce((acc, line) => acc + (line.weight || 0), 0);

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Cargando datos del envío...</div>;
  }

  return (
    <div className="flex flex-col max-h-[85vh]">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800 shrink-0">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Registrar Envío" : mode === "edit" ? "Editar Envío" : "Detalle de Envío"}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {mode === "create"
            ? "Selecciona una orden de entrega y registra el peso y costo de envío de cada artículo."
            : "Información del envío logístico."}
        </p>
      </div>

      <div className="overflow-y-auto px-6 py-5 custom-scrollbar">
        <form id="shipment-form" onSubmit={handleSubmit} className="space-y-5">

          {/* Header Info */}
          {mode === "create" ? (
            <div>
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
                    [{new Date(o.createdAt).toLocaleDateString()}] {o.clientFullName} - {o.department}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {(mode !== "create" || orderInfo) && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40 sm:grid-cols-4">
              {mode !== "create" && <InfoField label="N° de Guía" value={guia} />}
              {mode !== "create" && <InfoField label="Fecha" value={fecha} />}
              <InfoField label="Cliente" value={cliente} />
              <InfoField label="Teléfono" value={orderInfo?.clientPhone} />
              <InfoField label="Destino" value={orderInfo?.department} />
              <InfoField label="Dirección" value={orderInfo?.clientAddress} />
              <InfoField
                label="Tipo de Entrega"
                value={orderInfo?.deliveryType ? DELIVERY_TYPE_LABELS[orderInfo.deliveryType] ?? orderInfo.deliveryType : undefined}
              />
              <InfoField label="Proveedor" value={orderInfo?.supplierName ?? "Cliente esporádico"} />
            </div>
          )}

          <div className="border-t border-gray-100 dark:border-gray-800"></div>

          {/* Details */}
          <div>
            <h5 className="mb-3 text-sm font-semibold text-brand-500 uppercase tracking-wider">Detalles de Envío</h5>

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
                        <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
                              onChange={(e) => handleLineChange(idx, "weight", e.target.value)}
                              disabled={readOnly}
                              required
                              placeholder="0.00"
                              className="!h-9"
                            />
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <Input
                              type="number"
                              step={0.1}
                              min="0"
                              value={line.shippingCost}
                              onChange={(e) => handleLineChange(idx, "shippingCost", e.target.value)}
                              disabled={readOnly}
                              required
                              placeholder="0.00"
                              className="!h-9"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 dark:border-brand-800 dark:bg-brand-900/20">
                  <p className="text-xs font-medium text-brand-600 uppercase tracking-wider dark:text-brand-400">
                    Costo Total (Cliente)
                  </p>
                  <p className="text-lg font-bold text-brand-800 dark:text-brand-200">
                    Bs {(goodsValue + totalCost).toFixed(2)}
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
            const form = document.getElementById("shipment-form") as HTMLFormElement | null;
            if (form) form.requestSubmit();
          }} disabled={submitting || lines.length === 0}>
            {submitting ? "Guardando..." : mode === "create" ? "Registrar Envío" : "Guardar Cambios"}
          </Button>
        )}
      </div>
    </div>
  );
}
