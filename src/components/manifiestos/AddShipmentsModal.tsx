"use client";

import React, { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { shipmentService, ShipmentPaginatedItem } from "@/services/shipmentService";
import { manifestService, ManifestDetail, getManifestErrorMessage } from "@/services/manifestService";

interface AddShipmentsModalProps {
  manifest: ManifestDetail;
  onClose: () => void;
  onSaved: () => void;
}

// Candidatos: los que esperan en la sucursal de origen del lote, todavía sin
// manifiesto, y que hacen exactamente el mismo trayecto. Son las mismas tres
// condiciones que valida el backend, así que la lista no ofrece nada que después
// vaya a rebotar.
const CANDIDATES_PER_PAGE = 100;

export default function AddShipmentsModal({ manifest, onClose, onSaved }: AddShipmentsModalProps) {
  const { showToast } = useToast();
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const [candidates, setCandidates] = useState<ShipmentPaginatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await shipmentService.getShipments(1, CANDIDATES_PER_PAGE, {
          unmanifested: true,
          status: "AtOriginBranch",
          originBranchOfficeId: manifest.originBranchOfficeId,
          destinationBranchOfficeId: manifest.destinationBranchOfficeId,
        });
        if (!cancelled) setCandidates(res.data);
      } catch (err) {
        if (!cancelled) {
          showToast(
            "error",
            "Error",
            getManifestErrorMessage(err, "No se pudieron cargar los envíos disponibles.")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [manifest.originBranchOfficeId, manifest.destinationBranchOfficeId, showToast]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSelected = candidates.length > 0 && selected.size === candidates.length;
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(candidates.map((c) => c.id)));
  };

  const selectedWeight = candidates
    .filter((c) => selected.has(c.id))
    .reduce((sum, c) => sum + c.totalWeight, 0);

  const handleSubmit = () => {
    if (selected.size === 0) {
      showToast("error", "Error", "Selecciona al menos un envío.");
      return;
    }
    runSubmit(async () => {
      try {
        const res = await manifestService.addShipments(manifest.id, {
          shipmentIds: Array.from(selected),
        });
        showToast(
          "success",
          "Envíos agregados",
          `${res.addedShipments.length} envío(s) cargados. El lote ${res.code} lleva ${res.shipmentCount} en total.`
        );
        onSaved();
        onClose();
      } catch (err: unknown) {
        // El backend es todo-o-nada: si uno falla, no se agregó ninguno.
        showToast(
          "error",
          "No se agregó ninguno",
          getManifestErrorMessage(err, "No se pudieron agregar los envíos.")
        );
      }
    });
  };

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Agregar envíos al lote</h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Envíos esperando en {manifest.originBranchOfficeCode} con destino{" "}
          {manifest.destinationBranchOfficeCode}, todavía sin manifiesto.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Cargando envíos…</p>
        ) : candidates.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 py-10 text-center dark:border-gray-700 dark:bg-gray-800/40">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No hay envíos esperando para este trayecto.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Solo entran los que están en la sucursal de origen y hacen exactamente esta ruta.
            </p>
          </div>
        ) : (
          <>
            <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
              />
              Seleccionar todos ({candidates.length})
            </label>

            <div className="space-y-2">
              {candidates.map((shipment) => {
                const isSelected = selected.has(shipment.id);
                return (
                  <label
                    key={shipment.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                      isSelected
                        ? "border-brand-300 bg-brand-50 dark:border-brand-800 dark:bg-brand-500/10"
                        : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(shipment.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {shipment.code}
                        </span>
                        <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                          {shipment.clientFullName}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {shipment.packageCount} bulto(s) · {shipment.totalWeight} kg
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selected.size} seleccionado(s) · {selectedWeight.toFixed(2)} kg
        </p>
        <div className="flex gap-3">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting || selected.size === 0}>
            {submitting ? "Agregando…" : "Agregar al lote"}
          </Button>
        </div>
      </div>
    </div>
  );
}
