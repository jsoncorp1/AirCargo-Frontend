"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import InputField from "@/components/form/input/InputField";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useAuth } from "@/context/AuthContext";
import {
  manifestService,
  ManifestDetail,
  ManifestStatus,
  MANIFEST_CASCADE,
  availableManifestTransitions,
  manifestStatusLabel,
  manifestStatusBadge,
  getManifestErrorMessage,
} from "@/services/manifestService";
import { shipmentStatusLabel } from "@/services/shipmentService";

interface ManifestStatusModalProps {
  manifest: ManifestDetail;
  onClose: () => void;
  onSaved: () => void;
}

// Cómo se le presenta cada transición al usuario.
const ACTION_COPY: Record<string, { action: string; help: string }> = {
  InTransit: {
    action: "Despachar",
    help: "El lote sale de la sucursal. Todos sus envíos pasan a tránsito.",
  },
  Received: {
    action: "Recibir",
    help: "El lote llegó. Todos sus envíos quedan listos para asignarse a un conductor.",
  },
  Cancelled: {
    action: "Anular",
    help: "El lote se deshace antes de salir. Los envíos vuelven al pool de la sucursal de origen.",
  },
};

export default function ManifestStatusModal({
  manifest,
  onClose,
  onSaved,
}: ManifestStatusModalProps) {
  const { showToast } = useToast();
  const { isSuperAdminUser, branchOfficeId } = useAuth();
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const transitions = availableManifestTransitions(manifest, {
    isSuperAdmin: isSuperAdminUser,
    branchOfficeId,
  });

  const [status, setStatus] = useState<ManifestStatus | "">(
    transitions.length === 1 ? transitions[0] : ""
  );
  const [transportReference, setTransportReference] = useState("");

  const isDispatch = status === "InTransit";
  const isEmpty = manifest.shipmentCount === 0;
  // El backend rechaza despachar un lote vacío (`manifest.dispatch.empty`).
  const blockedByEmpty = isDispatch && isEmpty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      showToast("error", "Error", "Selecciona qué hacer con el manifiesto.");
      return;
    }
    if (blockedByEmpty) {
      showToast("error", "Error", "No se puede despachar un manifiesto sin envíos.");
      return;
    }

    runSubmit(async () => {
      try {
        const res = await manifestService.changeStatus(manifest.id, {
          status,
          // `transportReference` solo se toma al despachar.
          ...(isDispatch && transportReference.trim()
            ? { transportReference: transportReference.trim() }
            : {}),
        });
        const cascade = MANIFEST_CASCADE[status];
        showToast(
          "success",
          `Manifiesto ${manifestStatusLabel(res.status).toLowerCase()}`,
          cascade
            ? `${res.shipmentCount} envío(s) de ${res.code} pasaron a "${shipmentStatusLabel(cascade)}".`
            : `${res.code} quedó en "${manifestStatusLabel(res.status)}".`
        );
        onSaved();
        onClose();
      } catch (err: unknown) {
        showToast(
          "error",
          "Error",
          getManifestErrorMessage(err, "No se pudo cambiar el estado del manifiesto.")
        );
      }
    });
  };

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Mover el manifiesto</h4>
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {manifest.code}
          </span>
          <Badge size="sm" color={manifestStatusBadge(manifest.status)}>
            {manifestStatusLabel(manifest.status)}
          </Badge>
          <span>
            {manifest.shipmentCount} envío(s) · {manifest.totalWeight?.toFixed(2) ?? "0.00"} kg
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
        {transitions.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300">
            {manifest.status === "Received" || manifest.status === "Cancelled"
              ? "Este manifiesto ya está cerrado."
              : "Este manifiesto lo opera la otra sucursal del viaje."}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transitions.map((t) => {
              const copy = ACTION_COPY[t];
              const cascade = MANIFEST_CASCADE[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setStatus(t)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    status === t
                      ? "border-brand-300 bg-brand-50 dark:border-brand-800 dark:bg-brand-500/10"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {copy?.action ?? manifestStatusLabel(t)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {copy?.help ??
                      (cascade ? `Los envíos pasan a "${shipmentStatusLabel(cascade)}".` : "")}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {isDispatch && (
          <div>
            <Label>
              Referencia de transporte
              <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
            </Label>
            <InputField
              value={transportReference}
              onChange={(e) => setTransportReference(e.target.value)}
              placeholder="Ej. BoA 742 / 13-08"
            />
            <p className="mt-2 text-xs text-gray-400">
              El vuelo, la flota o la guía del transportista con el que sale el lote.
            </p>
          </div>
        )}

        {blockedByEmpty && (
          <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-500">
            El manifiesto está vacío. Agrégale envíos antes de despacharlo.
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={submitting || !status || blockedByEmpty}>
            {submitting ? "Guardando…" : "Confirmar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
