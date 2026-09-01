"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  driverTaskService,
  DriverTaskDetail,
  driverTaskStatusLabel,
  driverTaskStatusBadge,
  driverTaskKindLabel,
  driverTaskKindBadge,
  getDriverTaskErrorMessage,
} from "@/services/driverTaskService";
import { SHIPMENT_OBSERVATION_LABELS } from "@/services/shipmentService";
import { pickupOrderStatusLabel } from "@/services/pickupOrderService";
import { formatBs, paymentTypeLabel } from "@/services/logisticsEnums";
import { formatDate, formatDateTime } from "@/utils/datetime";

interface DriverTaskDetailModalProps {
  taskId: string;
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

export default function DriverTaskDetailModal({ taskId, onClose }: DriverTaskDetailModalProps) {
  const [detail, setDetail] = useState<DriverTaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await driverTaskService.getTaskById(taskId);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) {
          setError(getDriverTaskErrorMessage(err, "No se pudo cargar la tarea."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const isPickup = detail?.kind === "Pickup";

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Detalle de la tarea
        </h4>
        {detail && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge size="sm" color={driverTaskKindBadge(detail.kind)}>
              {driverTaskKindLabel(detail.kind)}
            </Badge>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {(isPickup ? detail.pickupOrderCode : detail.shipmentCode) ?? "—"}
            </span>
            <Badge size="sm" color={driverTaskStatusBadge(detail.status)}>
              {driverTaskStatusLabel(detail.status)}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && <p className="py-8 text-center text-sm text-gray-500">Cargando…</p>}
        {error && <p className="py-8 text-center text-sm text-error-500">{error}</p>}

        {detail && (
          <div className="space-y-6">
            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                {isPickup ? "Dónde buscarlo" : "A quién entregar"}
              </h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Contacto" value={detail.contactName} />
                <Row
                  label="Teléfono"
                  value={
                    detail.contactPhone ? (
                      <a
                        href={`tel:${detail.contactPhone}`}
                        className="font-mono text-brand-500 hover:underline"
                      >
                        {detail.contactPhone}
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
                {detail.contactPhoneAlt && (
                  <Row
                    label="Teléfono alt."
                    value={
                      <a
                        href={`tel:${detail.contactPhoneAlt}`}
                        className="font-mono text-brand-500 hover:underline"
                      >
                        {detail.contactPhoneAlt}
                      </a>
                    }
                  />
                )}
                <Row label="Dirección" value={detail.address} />
                {detail.addressReference && (
                  <Row label="Referencia" value={detail.addressReference} />
                )}
                {detail.locationUrl && (
                  <Row
                    label="Mapa"
                    value={
                      <a
                        href={detail.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-500 hover:underline"
                      >
                        Abrir ubicación
                      </a>
                    }
                  />
                )}
                <Row label="Departamento" value={detail.destinationDepartment ?? "—"} />
              </div>
            </section>

            {/* Solo el recojo tiene hora comprometida con el cliente. */}
            {isPickup && detail.pickupDate && (
              <section>
                <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                  Cuándo
                </h5>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  <Row label="Fecha" value={formatDate(detail.pickupDate)} />
                  <Row
                    label="Ventana"
                    value={
                      detail.pickupWindowStart && detail.pickupWindowEnd
                        ? `${detail.pickupWindowStart.slice(0, 5)} – ${detail.pickupWindowEnd.slice(0, 5)}`
                        : "—"
                    }
                  />
                  {detail.pickupOrderStatus && (
                    <Row
                      label="Estado de la solicitud"
                      value={pickupOrderStatusLabel(detail.pickupOrderStatus)}
                    />
                  )}
                </div>
              </section>
            )}

            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                Cobro
              </h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row
                  label="Forma de pago"
                  value={detail.paymentType ? paymentTypeLabel(detail.paymentType) : "—"}
                />
                <Row
                  label="A cobrar en la puerta"
                  value={
                    detail.amountToCollect > 0 ? (
                      <span className="font-bold text-warning-600 dark:text-warning-400">
                        {formatBs(detail.amountToCollect)}
                      </span>
                    ) : (
                      "No se cobra nada"
                    )
                  }
                />
                {typeof detail.commissionAmount === "number" && (
                  <Row label="Tu comisión" value={formatBs(detail.commissionAmount)} />
                )}
              </div>
            </section>

            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                Carga
              </h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Bultos" value={detail.packageCount ?? "—"} />
                <Row
                  label="Peso"
                  value={
                    typeof detail.totalWeight === "number" ? `${detail.totalWeight} kg` : "—"
                  }
                />
                <Row label="Descripción" value={detail.packageDescription ?? "—"} />
              </div>
            </section>

            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                Esta tarea
              </h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Asignada" value={formatDateTime(detail.assignedAt)} />
                <Row
                  label="Salida"
                  value={detail.startedAt ? formatDateTime(detail.startedAt) : "—"}
                />
                <Row
                  label="Cerrada"
                  value={detail.completedAt ? formatDateTime(detail.completedAt) : "—"}
                />
                {detail.observation && (
                  <Row
                    label="Observación"
                    value={SHIPMENT_OBSERVATION_LABELS[detail.observation] ?? detail.observation}
                  />
                )}
                {detail.comment && <Row label="Comentario" value={detail.comment} />}
              </div>
            </section>

            {detail.photoUrls && detail.photoUrls.length > 0 && (
              <section>
                <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                  Evidencia
                </h5>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {detail.photoUrls.map((url, i) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Evidencia ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </section>
            )}
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
