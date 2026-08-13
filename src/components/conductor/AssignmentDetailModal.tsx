"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  shipmentAssignmentService,
  ShipmentAssignmentDetail,
  assignmentStatusLabel,
  assignmentStatusBadge,
  getAssignmentErrorMessage,
} from "@/services/shipmentAssignmentService";
import { SHIPMENT_OBSERVATION_LABELS } from "@/services/shipmentService";

interface AssignmentDetailModalProps {
  assignmentId: string;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-right text-sm font-medium text-gray-800 dark:text-gray-200">{value}</span>
    </div>
  );
}

export default function AssignmentDetailModal({
  assignmentId,
  onClose,
}: AssignmentDetailModalProps) {
  const [detail, setDetail] = useState<ShipmentAssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await shipmentAssignmentService.getAssignmentById(assignmentId);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) {
          setError(getAssignmentErrorMessage(err, "No se pudo cargar la entrega."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Detalle de la entrega</h4>
        {detail && (
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {detail.shipmentCode}
            </span>
            <Badge size="sm" color={assignmentStatusBadge(detail.status)}>
              {assignmentStatusLabel(detail.status)}
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
                A quién entregar
              </h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Cliente" value={detail.clientFullName} />
                <Row
                  label="Teléfono"
                  value={
                    detail.clientPhone ? (
                      <a href={`tel:${detail.clientPhone}`} className="text-brand-500 hover:underline">
                        {detail.clientPhone}
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
                <Row label="Dirección" value={detail.clientAddress} />
                <Row label="Departamento" value={detail.destinationDepartment ?? "—"} />
              </div>
            </section>

            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">Cobro</h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Tipo de entrega" value={detail.deliveryType ?? "—"} />
                <Row
                  label="Monto"
                  value={
                    typeof detail.totalPrice === "number" ? `Bs ${detail.totalPrice.toFixed(2)}` : "—"
                  }
                />
              </div>
            </section>

            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">Carga</h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Bultos" value={detail.packageCount} />
                <Row label="Peso" value={`${detail.totalWeight} kg`} />
                <Row label="Descripción" value={detail.packageDescription ?? "—"} />
              </div>
            </section>

            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                Este intento
              </h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Asignado" value={new Date(detail.assignedAt).toLocaleString("es-BO")} />
                <Row
                  label="Recogido"
                  value={detail.pickedUpAt ? new Date(detail.pickedUpAt).toLocaleString("es-BO") : "—"}
                />
                <Row
                  label="Cerrado"
                  value={detail.completedAt ? new Date(detail.completedAt).toLocaleString("es-BO") : "—"}
                />
                {detail.observation && (
                  <Row
                    label="Observación"
                    value={SHIPMENT_OBSERVATION_LABELS[detail.observation] ?? detail.observation}
                  />
                )}
                {detail.deliveryComment && <Row label="Comentario" value={detail.deliveryComment} />}
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
                      <img src={url} alt={`Evidencia ${i + 1}`} className="h-full w-full object-cover" />
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
