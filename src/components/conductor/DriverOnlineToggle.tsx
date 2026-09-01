"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import {
  driverService,
  Driver,
  driverTypeUsesOnlineFlag,
  getDriverErrorMessage,
} from "@/services/driverService";
import { vehicleTypeLabel } from "@/services/logisticsEnums";
import { formatDateTime } from "@/utils/datetime";

/**
 * Interruptor "en línea" del conductor esporádico.
 *
 * No es una conexión: es un flag con marca de tiempo. Se manda cuando el
 * conductor lo toca, y nada más — no hay websockets ni presencia en tiempo real.
 *
 * Un conductor DE PLANTA está siempre disponible, así que para él este control
 * no significa nada y no se muestra. Uno SIN PERFIL tampoco puede recibir
 * tareas: en ese caso el aviso le dice a quién pedírselo, que es más útil que un
 * interruptor que no va a hacer nada.
 */
export default function DriverOnlineToggle() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { pending, run } = useSubmitLock();

  const [profile, setProfile] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  // `true` cuando el conductor todavía no tiene perfil cargado: sin él el
  // backend rechaza cualquier asignación con `drivertask.driver.noprofile`.
  const [missingProfile, setMissingProfile] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // No hay `GET /drivers/me`: el backend ya acota el listado al alcance
        // del rol, así que alcanza con buscarse a uno mismo en la primera página.
        const res = await driverService.getDrivers(1, 100);
        if (cancelled) return;
        const mine = res.data.find((d) => d.driverUserId === user?.id) ?? null;
        setProfile(mine);
        setMissingProfile(!mine);
      } catch {
        // Si el listado no está a su alcance, no se puede saber si tiene perfil:
        // callarse es mejor que afirmar que le falta uno.
        if (!cancelled) setMissingProfile(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleToggle = (next: boolean) => {
    run(async () => {
      try {
        const updated = await driverService.setOnline(next);
        setProfile(updated);
        showToast(
          "success",
          next ? "Estás en línea" : "Estás fuera de línea",
          next
            ? "Tu sucursal ya puede asignarte recojos y entregas."
            : "No vas a recibir tareas nuevas hasta que vuelvas a conectarte."
        );
      } catch (err) {
        showToast("error", "Error", getDriverErrorMessage(err, "No se pudo cambiar tu estado."));
      }
    });
  };

  if (loading) return null;

  if (missingProfile) {
    return (
      <div className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-900/40 dark:bg-warning-500/10 dark:text-warning-400">
        Todavía no tienes un perfil de conductor cargado (vehículo y modalidad), así que tu
        sucursal no puede asignarte tareas. Pídeselo al encargado de tu sucursal.
      </div>
    );
  }

  // Un conductor de planta está siempre disponible: el interruptor sobra.
  if (!profile || !driverTypeUsesOnlineFlag(profile.driverType)) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-white/[0.03]">
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
          {profile.isOnline ? "Estás en línea" : "Estás fuera de línea"}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {profile.isOnline
            ? `Tu sucursal puede asignarte tareas para ${vehicleTypeLabel(profile.vehicleType).toLowerCase()}.`
            : "No vas a recibir tareas nuevas hasta que te conectes."}
          {profile.lastOnlineAt && !profile.isOnline
            ? ` Última conexión: ${formatDateTime(profile.lastOnlineAt)}.`
            : ""}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={profile.isOnline}
        aria-label="Disponible para recibir tareas"
        disabled={pending}
        onClick={() => handleToggle(!profile.isOnline)}
        className={`relative h-7 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          profile.isOnline ? "bg-success-500" : "bg-gray-300 dark:bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-theme-sm transition-transform ${
            profile.isOnline ? "translate-x-7" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
