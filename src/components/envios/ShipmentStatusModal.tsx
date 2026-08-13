"use client";

import React, { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import TextArea from "@/components/form/input/TextArea";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import {
  shipmentService,
  ShipmentStatus,
  ShipmentObservation,
  SHIPMENT_STATUS_TRANSITIONS,
  SHIPMENT_OBSERVATION_LABELS,
  OBSERVABLE_STATUSES,
  shipmentStatusLabel,
  shipmentStatusBadge,
  getShipmentErrorMessage,
} from "@/services/shipmentService";

type ActionMode = "status" | "observation" | "comment";

const MAX_COMMENT_LENGTH = 500;

interface ShipmentStatusModalProps {
  shipmentId: string;
  code: string;
  currentStatus: ShipmentStatus;
  currentObservation?: ShipmentObservation | null;
  onClose: () => void;
  onSaved: () => void;
}

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function ShipmentStatusModal({
  shipmentId,
  code,
  currentStatus,
  currentObservation,
  onClose,
  onSaved,
}: ShipmentStatusModalProps) {
  const { showToast } = useToast();

  const allowedStatuses = SHIPMENT_STATUS_TRANSITIONS[currentStatus] ?? [];
  const canObserve = OBSERVABLE_STATUSES.includes(currentStatus);
  const isFinal = allowedStatuses.length === 0 && !canObserve;

  // Cuando no hay nada que cambiar a mano hay dos razones muy distintas, y al
  // usuario le importa cuál: o el envío terminó, o su estado lo mueve otro
  // módulo (el manifiesto en el viaje entre sucursales, la asignación en el
  // reparto final) y esta pantalla es solo para corregir.
  const lockedReason = !isFinal
    ? null
    : currentStatus === "Delivered" || currentStatus === "Returned"
    ? "El envío está en un estado final; solo se puede agregar un comentario."
    : currentStatus === "AtOriginBranch" || currentStatus === "InManifest"
    ? "El estado de este envío lo mueve su manifiesto. Despacha el lote desde Manifiestos para ponerlo en tránsito."
    : "El estado de este envío lo mueve su reparto. Asígnalo a un conductor desde Reparto para avanzarlo.";

  const initialMode: ActionMode = canObserve ? "observation" : allowedStatuses.length > 0 ? "status" : "comment";
  const [mode, setMode] = useState<ActionMode>(initialMode);
  const [status, setStatus] = useState<ShipmentStatus | "">("");
  const [observation, setObservation] = useState<ShipmentObservation | "">("");
  const [deliveryComment, setDeliveryComment] = useState("");
  // Cerrojo: bloquea los botones mientras el PATCH está en curso (y corta el
  // segundo click del doble click).
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const modeOptions = useMemo(
    () =>
      [
        canObserve && { value: "observation" as const, label: "Registrar observación" },
        allowedStatuses.length > 0 && { value: "status" as const, label: "Cambiar estado" },
        { value: "comment" as const, label: "Solo comentario" },
      ].filter(Boolean) as { value: ActionMode; label: string }[],
    [canObserve, allowedStatuses.length]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const comment = deliveryComment.trim();
    if (mode === "status" && !status) {
      showToast("error", "Error", "Selecciona el nuevo estado del envío.");
      return;
    }
    if (mode === "observation" && !observation) {
      showToast("error", "Error", "Selecciona la observación a registrar.");
      return;
    }
    if (mode === "comment" && !comment) {
      showToast("error", "Error", "Escribe el comentario a registrar.");
      return;
    }

    runSubmit(async () => {
      try {
        // Se manda `status` o `observation`, nunca ambos; el comentario acompaña a cualquiera.
        const res = await shipmentService.changeShipmentStatus(shipmentId, {
          ...(mode === "status" && status ? { status } : {}),
          ...(mode === "observation" && observation ? { observation } : {}),
          ...(comment ? { deliveryComment: comment } : {}),
        });
        showToast(
          "success",
          "Envío actualizado",
          `La guía ${res.code} quedó en estado "${shipmentStatusLabel(res.status)}".`
        );
        onSaved();
        onClose();
      } catch (err: unknown) {
        showToast("error", "Error", getShipmentErrorMessage(err, "No se pudo actualizar el envío."));
      }
    });
  };

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Estado del Envío
        </h4>
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {code}
          </span>
          <Badge size="sm" color={shipmentStatusBadge(currentStatus)}>
            {shipmentStatusLabel(currentStatus)}
          </Badge>
          {currentObservation && (
            <span className="text-xs text-warning-600 dark:text-orange-400">
              {SHIPMENT_OBSERVATION_LABELS[currentObservation]}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
        {lockedReason && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300">
            {lockedReason}
          </div>
        )}

        {modeOptions.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {modeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === opt.value
                    ? "border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-400"
                    : "border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {mode === "status" && (
          <div>
            <Label required>Nuevo Estado</Label>
            <select
              className={selectClassName}
              value={status}
              onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
              required
            >
              <option value="" disabled>Seleccione el nuevo estado</option>
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>{shipmentStatusLabel(s)}</option>
              ))}
            </select>
          </div>
        )}

        {mode === "observation" && (
          <div>
            <Label required>Observación</Label>
            <select
              className={selectClassName}
              value={observation}
              onChange={(e) => setObservation(e.target.value as ShipmentObservation)}
              required
            >
              <option value="" disabled>Seleccione la observación</option>
              {(Object.entries(SHIPMENT_OBSERVATION_LABELS) as [ShipmentObservation, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                )
              )}
            </select>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              {observation === "CustomerRefused"
                ? 'Con "No quiere" el envío pasa a estado Rechazado.'
                : "Al registrar una observación el envío pasa a estado Observado."}
            </p>
          </div>
        )}

        <div>
          <Label required={mode === "comment"}>
            Comentario del Delivery
            {mode !== "comment" && (
              <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
            )}
          </Label>
          <TextArea
            value={deliveryComment}
            onChange={(value) => value.length <= MAX_COMMENT_LENGTH && setDeliveryComment(value)}
            rows={3}
            placeholder="Ej. Llamé 3 veces y no contestó"
            hint={`${deliveryComment.length}/${MAX_COMMENT_LENGTH}`}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
