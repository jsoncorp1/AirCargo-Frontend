"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { driverService, Driver, driverTypeLabel } from "@/services/driverService";
import { vehicleTypeLabel, VehicleType } from "@/services/logisticsEnums";
import {
  pickupOrderService,
  getPickupOrderErrorMessage,
} from "@/services/pickupOrderService";
import { formatDate } from "@/utils/datetime";

interface AsignarConductorModalProps {
  pickupOrderId: string;
  pickupOrderCode: string;
  /** El vehículo que pidió el cliente: el backend exige que coincida. */
  requestedVehicleType: VehicleType;
  pickupDate: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  onClose: () => void;
  onSaved: () => void;
}

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/**
 * Asigna el recojo a un conductor. Solo desde `Confirmed`.
 *
 * El selector se alimenta de los conductores DISPONIBLES y del vehículo pedido:
 * el backend valida las tres cosas (`drivertask.vehicle.mismatch`,
 * `.driver.noprofile`, `.driver.offline`), así que ofrecer a los demás sería
 * ofrecer un error.
 */
export default function AsignarConductorModal({
  pickupOrderId,
  pickupOrderCode,
  requestedVehicleType,
  pickupDate,
  pickupWindowStart,
  pickupWindowEnd,
  onClose,
  onSaved,
}: AsignarConductorModalProps) {
  const { showToast } = useToast();
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverUserId, setDriverUserId] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await driverService.getAvailableDrivers(requestedVehicleType);
        if (!cancelled) setDrivers(list);
      } catch (err) {
        console.error("Error fetching available drivers", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestedVehicleType]);

  const selected = drivers.find((d) => d.driverUserId === driverUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverUserId) {
      showToast("error", "Error", "Selecciona el conductor que va a buscar el paquete.");
      return;
    }

    runSubmit(async () => {
      try {
        const res = await pickupOrderService.assignDriver(pickupOrderId, { driverUserId });
        showToast(
          "success",
          "Recojo asignado",
          `${pickupOrderCode} quedó a cargo de ${res.driverFullName}.`
        );
        onSaved();
        onClose();
      } catch (err: unknown) {
        showToast(
          "error",
          "Error",
          getPickupOrderErrorMessage(err, "No se pudo asignar el recojo.")
        );
      }
    });
  };

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Asignar el recojo
        </h4>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {pickupOrderCode}
          </span>
          <span>
            {formatDate(pickupDate)} · {pickupWindowStart.slice(0, 5)} –{" "}
            {pickupWindowEnd.slice(0, 5)}
          </span>
          <Badge size="sm" color="light">
            {vehicleTypeLabel(requestedVehicleType)}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
        <div>
          <Label required>Conductor</Label>
          <select
            className={selectClassName}
            value={driverUserId}
            onChange={(e) => setDriverUserId(e.target.value)}
            disabled={loading || drivers.length === 0}
            required
          >
            <option value="" disabled>
              {loading ? "Buscando conductores disponibles…" : "Selecciona el conductor"}
            </option>
            {drivers.map((d) => (
              <option key={d.driverUserId} value={d.driverUserId}>
                {d.fullName} — {d.plateNumber}
              </option>
            ))}
          </select>

          {selected && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge size="sm" color="light">{driverTypeLabel(selected.driverType)}</Badge>
              <Badge size="sm" color="light">{vehicleTypeLabel(selected.vehicleType)}</Badge>
              {selected.phoneNumber && (
                <a
                  href={`tel:${selected.phoneNumber}`}
                  className="font-mono text-xs text-brand-500 hover:underline"
                >
                  {selected.phoneNumber}
                </a>
              )}
            </div>
          )}

          {!loading && drivers.length === 0 && (
            <p className="mt-2 text-xs text-error-500">
              No hay conductores disponibles con {vehicleTypeLabel(requestedVehicleType).toLowerCase()}.
              Revisá que tengan perfil cargado y, si son esporádicos, que estén en línea.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={submitting || !driverUserId}>
            {submitting ? "Asignando…" : "Asignar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
