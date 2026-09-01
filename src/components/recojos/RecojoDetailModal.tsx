"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  pickupOrderService,
  PickupOrder,
  buildPickupOrderTimeline,
  pickupOrderStatusLabel,
  pickupOrderStatusBadge,
  getPickupOrderErrorMessage,
} from "@/services/pickupOrderService";
import {
  driverTaskStatusLabel,
  driverTaskStatusBadge,
} from "@/services/driverTaskService";
import {
  formatBs,
  paymentTypeLabel,
  servicePointTypeLabel,
  vehicleTypeLabel,
} from "@/services/logisticsEnums";
import { BOLIVIAN_DEPARTMENT_LABELS, BolivianDepartment } from "@/services/supplierService";
import { formatDate, formatDateTime } from "@/utils/datetime";

interface RecojoDetailModalProps {
  pickupOrderId: string;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-right text-sm font-medium text-gray-800 dark:text-gray-200">
        {value}
      </span>
    </div>
  );
}

const departmentLabel = (value: string): string =>
  BOLIVIAN_DEPARTMENT_LABELS[value as BolivianDepartment] ?? value;

export default function RecojoDetailModal({ pickupOrderId, onClose }: RecojoDetailModalProps) {
  const [order, setOrder] = useState<PickupOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await pickupOrderService.getPickupOrderById(pickupOrderId);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) {
          setError(getPickupOrderErrorMessage(err, "No se pudo cargar la solicitud."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickupOrderId]);

  const timeline = order ? buildPickupOrderTimeline(order.status) : [];
  const destinationIsBranch = order?.destinationPointType === "Branch";

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="shrink-0 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Solicitud de recojo
        </h4>
        {order && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {order.code}
            </span>
            <Badge size="sm" color={pickupOrderStatusBadge(order.status)}>
              {pickupOrderStatusLabel(order.status)}
            </Badge>
            {order.isExpress && (
              <Badge size="sm" color="error">
                Expreso
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && <p className="py-8 text-center text-sm text-gray-500">Cargando…</p>}
        {error && <p className="py-8 text-center text-sm text-error-500">{error}</p>}

        {order && (
          <div className="space-y-6">
            {/* Stepper del ciclo de vida. */}
            <section>
              <div className="flex flex-wrap gap-1.5">
                {timeline.map((step) => (
                  <span
                    key={step.status}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      step.current
                        ? "bg-brand-500 text-white"
                        : step.reached
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                ))}
              </div>
              {order.cancellationReason && (
                <p className="mt-3 rounded-lg border border-error-100 bg-error-50 p-3 text-xs text-error-600 dark:border-error-900/30 dark:bg-error-500/10 dark:text-error-400">
                  <span className="font-semibold">Motivo de la anulación:</span>{" "}
                  {order.cancellationReason}
                </p>
              )}
            </section>

            {/* El desglose, no solo el total: es lo que se le explicó al cliente. */}
            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                Precio estimado
              </h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Flete" value={formatBs(order.estimatedFreight)} />
                {order.estimatedPickupCharge > 0 && (
                  <Row label="Recojo a domicilio" value={formatBs(order.estimatedPickupCharge)} />
                )}
                {order.estimatedDeliveryCharge > 0 && (
                  <Row
                    label="Entrega a domicilio"
                    value={formatBs(order.estimatedDeliveryCharge)}
                  />
                )}
                <Row
                  label="Total estimado"
                  value={
                    <span className="text-base font-bold">{formatBs(order.estimatedPrice)}</span>
                  }
                />
              </div>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Sobre el peso declarado. El definitivo sale de la balanza al recibirlo.
              </p>
            </section>

            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                Dónde buscarlo
              </h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Quién entrega" value={order.senderName} />
                <Row
                  label="Teléfono"
                  value={
                    <a
                      href={`tel:${order.senderPhone}`}
                      className="font-mono text-brand-500 hover:underline"
                    >
                      {order.senderPhone}
                    </a>
                  }
                />
                <Row label="Departamento" value={departmentLabel(order.originDepartment)} />
                <Row label="Dirección" value={order.pickupAddress} />
                {order.pickupAddressReference && (
                  <Row label="Referencia" value={order.pickupAddressReference} />
                )}
                <Row
                  label="Mapa"
                  value={
                    <a
                      href={order.pickupLocationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-500 hover:underline"
                    >
                      Abrir ubicación
                    </a>
                  }
                />
                <Row label="Fecha" value={formatDate(order.pickupDate)} />
                <Row
                  label="Ventana"
                  value={`${order.pickupWindowStart.slice(0, 5)} – ${order.pickupWindowEnd.slice(0, 5)}`}
                />
              </div>
            </section>

            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                A dónde va
              </h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Quién recibe" value={order.recipientName} />
                <Row
                  label="Teléfono"
                  value={
                    <a
                      href={`tel:${order.recipientPhone}`}
                      className="font-mono text-brand-500 hover:underline"
                    >
                      {order.recipientPhone}
                    </a>
                  }
                />
                {order.recipientPhoneAlt && (
                  <Row label="Teléfono alt." value={order.recipientPhoneAlt} />
                )}
                <Row label="Departamento" value={departmentLabel(order.destinationDepartment)} />
                <Row
                  label="Modalidad"
                  value={servicePointTypeLabel(order.destinationPointType)}
                />
                {destinationIsBranch ? (
                  <Row label="Sucursal" value={order.destinationBranchOfficeCode ?? "—"} />
                ) : (
                  <>
                    <Row label="Dirección" value={order.destinationAddress ?? "—"} />
                    {order.destinationAddressReference && (
                      <Row label="Referencia" value={order.destinationAddressReference} />
                    )}
                    {order.destinationLocationUrl && (
                      <Row
                        label="Mapa"
                        value={
                          <a
                            href={order.destinationLocationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-500 hover:underline"
                          >
                            Abrir ubicación
                          </a>
                        }
                      />
                    )}
                  </>
                )}
              </div>
            </section>

            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                Qué se envía
              </h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Peso declarado" value={`${order.estimatedWeight} kg`} />
                <Row label="Bultos" value={order.packageCount} />
                <Row label="Descripción" value={order.packageDescription} />
                <Row
                  label="Vehículo pedido"
                  value={vehicleTypeLabel(order.requestedVehicleType)}
                />
                <Row label="Forma de pago" value={paymentTypeLabel(order.paymentType)} />
                {order.comments && <Row label="Comentarios" value={order.comments} />}
              </div>

              {order.details.length > 0 && (
                <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                  {order.details.map((line, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">{line.quantity}×</span> {line.articleName}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-gray-500">
                        {line.estimatedWeight} kg · {formatBs(line.declaredValue)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* El historial de tareas es donde se ven los intentos fallidos. */}
            {order.tasks.length > 0 && (
              <section>
                <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                  Intentos de recojo
                </h5>
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                  {order.tasks.map((task) => (
                    <li key={task.id} className="px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {task.driverFullName}
                        </span>
                        <Badge size="sm" color={driverTaskStatusBadge(task.status)}>
                          {driverTaskStatusLabel(task.status)}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Asignada {formatDateTime(task.assignedAt)}
                        {task.completedAt ? ` · cerrada ${formatDateTime(task.completedAt)}` : ""}
                      </p>
                      {task.comment && (
                        <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">
                          &quot;{task.comment}&quot;
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                Trazas
              </h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Solicitada" value={formatDateTime(order.createdAt)} />
                <Row
                  label="Confirmada"
                  value={
                    order.confirmedAt
                      ? `${formatDateTime(order.confirmedAt)}${
                          order.confirmedByEmail ? ` · ${order.confirmedByEmail}` : ""
                        }`
                      : "—"
                  }
                />
                <Row
                  label="Recogida"
                  value={order.collectedAt ? formatDateTime(order.collectedAt) : "—"}
                />
                <Row
                  label="Recibida"
                  value={order.receivedAt ? formatDateTime(order.receivedAt) : "—"}
                />
                {order.shipmentCode && <Row label="Envío generado" value={order.shipmentCode} />}
              </div>
            </section>
          </div>
        )}
      </div>

      <div className="flex justify-end border-t border-gray-100 px-6 py-4 dark:border-gray-800">
        <Button size="sm" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
