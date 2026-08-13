"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useAuth } from "@/context/AuthContext";
import { branchOfficeService, BranchOffice } from "@/services/branchOfficeService";
import { manifestService, Manifest, getManifestErrorMessage } from "@/services/manifestService";

interface CreateManifestModalProps {
  onClose: () => void;
  onCreated: (manifest: Manifest) => void;
}

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function CreateManifestModal({ onClose, onCreated }: CreateManifestModalProps) {
  const { showToast } = useToast();
  const { isSuperAdminUser, branchOfficeId } = useAuth();
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const [branches, setBranches] = useState<BranchOffice[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  // El superadmin es global y no tiene sucursal propia: tiene que decir desde
  // cuál sale el lote. Para el admin el backend ignora este campo y usa la suya.
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await branchOfficeService.getBranchOffices(1, 100);
        if (!cancelled) setBranches(res.data);
      } catch (err) {
        console.error("Error fetching branch offices", err);
      } finally {
        if (!cancelled) setLoadingBranches(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveOrigin = isSuperAdminUser ? originId : branchOfficeId ?? "";
  const sameBranch = Boolean(effectiveOrigin) && effectiveOrigin === destinationId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSuperAdminUser && !originId) {
      showToast("error", "Error", "Indica desde qué sucursal sale el manifiesto.");
      return;
    }
    if (!destinationId) {
      showToast("error", "Error", "Indica a qué sucursal va el manifiesto.");
      return;
    }
    if (sameBranch) {
      showToast(
        "error",
        "Error",
        "El origen y el destino no pueden ser la misma sucursal: un envío local no viaja en manifiesto."
      );
      return;
    }

    runSubmit(async () => {
      try {
        const manifest = await manifestService.createManifest({
          // Mandarlo siempre es seguro: para el admin el backend lo ignora.
          originBranchOfficeId: isSuperAdminUser ? originId : null,
          destinationBranchOfficeId: destinationId,
        });
        showToast(
          "success",
          "Manifiesto creado",
          `${manifest.code} quedó abierto. Ahora agrégale los envíos que salen en este viaje.`
        );
        onCreated(manifest);
        onClose();
      } catch (err: unknown) {
        showToast("error", "Error", getManifestErrorMessage(err, "No se pudo crear el manifiesto."));
      }
    });
  };

  const branchOptions = branches.map((b) => (
    <option key={b.id} value={b.id}>
      {b.code} — {b.city}
    </option>
  ));

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Nuevo manifiesto</h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          El lote de transporte de un viaje entre dos sucursales. Nace vacío: después le agregas
          los envíos que salen juntos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
        {isSuperAdminUser ? (
          <div>
            <Label required>Sucursal de origen</Label>
            <select
              className={selectClassName}
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              disabled={loadingBranches}
              required
            >
              <option value="" disabled>
                {loadingBranches ? "Cargando…" : "Selecciona la sucursal de salida"}
              </option>
              {branchOptions}
            </select>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300">
            El manifiesto sale de tu sucursal.
          </div>
        )}

        <div>
          <Label required>Sucursal de destino</Label>
          <select
            className={selectClassName}
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            disabled={loadingBranches}
            required
          >
            <option value="" disabled>
              {loadingBranches ? "Cargando…" : "Selecciona la sucursal de llegada"}
            </option>
            {branchOptions}
          </select>
          {sameBranch && (
            <p className="mt-2 text-xs text-error-500">
              El origen y el destino no pueden ser la misma sucursal.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={submitting || sameBranch}>
            {submitting ? "Creando…" : "Crear manifiesto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
