"use client";

import React, { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useToast } from "@/context/ToastContext";
import { TrashBinIcon } from "@/icons";
import {
  orderDeliveryService,
  OrderDeliveryPaginatedItem,
  OrderDeliveryDetailItem,
} from "@/services/orderDeliveryService";
import {
  shipmentService,
  CreateShipmentRequest,
  CreateShipmentLineRequest,
} from "@/services/shipmentService";

interface ShipmentFormProps {
  mode: "create" | "edit" | "view";
  shipmentId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ShipmentForm({ mode, shipmentId, onClose, onSaved }: ShipmentFormProps) {
  const { showToast } = useToast();
  const readOnly = mode === "view";

  const [loading, setLoading] = useState(mode !== "create");
  const [submitting, setSubmitting] = useState(false);

  // Data sources
  const [orders, setOrders] = useState<OrderDeliveryPaginatedItem[]>([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDeliveryDetailItem[]>([]);

  // Form State
  const [orderDeliveryId, setOrderDeliveryId] = useState<string>("");
  const [lines, setLines] = useState<CreateShipmentLineRequest[]>([]);
  
  // View data
  const [guia, setGuia] = useState("");
  const [cliente, setCliente] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderDeliveryService.getDeliveries(1, 100);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "No se pudieron cargar las órdenes de entrega.");
    }
  }, [showToast]);

  const loadOrderDetails = useCallback(async (id: string) => {
    try {
      const order = await orderDeliveryService.getDeliveryById(id);
      setSelectedOrderDetails(order.details);
      
      // Auto-populate lines with 0 weight/cost
      if (mode === "create") {
        setLines(
          order.details.map(d => ({
            orderDeliveryDetailId: d.id,
            weight: 0,
            shippingCost: 0
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
      setGuia(shipment.numeroGuia);
      setCliente(shipment.clienteNombreCompleto);
      setLines(shipment.details.map(d => ({
        orderDeliveryDetailId: d.orderDeliveryDetailId, // Reusing field for mapping
        shipmentDetailId: d.id,
        weight: d.weight,
        shippingCost: d.shippingCost,
        articleName: d.articleName, // Just for display
      })) as any);
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
          lines,
        };
        await shipmentService.createShipment(payload);
        showToast("success", "Envío creado", "El envío fue registrado exitosamente.");
      } else if (mode === "edit" && shipmentId) {
        await shipmentService.updateShipment(shipmentId, { lines: lines as any });
        showToast("success", "Envío actualizado", "El envío fue actualizado exitosamente.");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      showToast("error", "Error", err.message || "No se pudo guardar el envío.");
    } finally {
      setSubmitting(false);
    }
  };

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
        <form id="shipment-form" onSubmit={handleSubmit} className="space-y-6">
          
          {/* Header Info */}
          <div className="grid grid-cols-1 gap-5">
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
                      [{new Date(o.createdAt).toLocaleDateString()}] {o.clienteNombreCompleto} - {o.departamento}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>N° de Guía</Label>
                  <Input value={guia} disabled />
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Input value={cliente} disabled />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800"></div>

          {/* Details */}
          <div>
            <h5 className="mb-4 text-sm font-semibold text-brand-500 uppercase tracking-wider">Detalles de Envío</h5>
            
            <div className="space-y-3">
              {lines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Seleccione una orden para cargar sus artículos.</p>
                </div>
              ) : (
                lines.map((line, idx) => {
                  const detail = mode === "create" 
                    ? selectedOrderDetails.find(d => d.id === line.orderDeliveryDetailId) 
                    : { articleName: (line as any).articleName, quantity: 1 }; // Fallback for view/edit since backend might not return quantity in shipment details

                  return (
                    <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center rounded-xl bg-gray-50 p-4 dark:bg-gray-800/40">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-white/90 text-sm">
                          {detail?.articleName || "Artículo desconocido"}
                        </p>
                        {mode === "create" && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Cant: {detail?.quantity} | Total: Bs {(detail as any)?.lineTotal}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex w-full sm:w-auto gap-3 items-center">
                        <div className="w-28">
                          <Label className="text-xs !mb-1">Peso (kg)</Label>
                          <Input
                            type="number"
                            step={0.01}
                            min="0"
                            value={line.weight}
                            onChange={(e) => handleLineChange(idx, "weight", e.target.value)}
                            disabled={readOnly}
                            required
                            placeholder="0.00"
                          />
                        </div>
                        <div className="w-32">
                          <Label className="text-xs !mb-1">Costo (Bs)</Label>
                          <Input
                            type="number"
                            step={0.1}
                            min="0"
                            value={line.shippingCost}
                            onChange={(e) => handleLineChange(idx, "shippingCost", e.target.value)}
                            disabled={readOnly}
                            required
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Totals */}
            {lines.length > 0 && (
              <div className="mt-5 flex justify-end gap-4">
                <div className="rounded-xl border border-gray-200 bg-white px-5 py-3 dark:border-gray-800 dark:bg-gray-900 w-full sm:w-auto">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 mb-1">
                    Peso Total
                  </p>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    {totalWeight.toFixed(2)} kg
                  </p>
                </div>
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-5 py-3 dark:border-brand-800 dark:bg-brand-900/20 w-full sm:w-auto">
                  <p className="text-xs font-medium text-brand-600 uppercase tracking-wider dark:text-brand-400 mb-1">
                    Costo Total Envío
                  </p>
                  <p className="text-2xl font-bold text-brand-800 dark:text-brand-200">
                    Bs {totalCost.toFixed(2)}
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
