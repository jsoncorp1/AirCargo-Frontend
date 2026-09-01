"use client";

import React, { useCallback, useRef, useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import TextArea from "@/components/form/input/TextArea";
import PhotoUploader from "@/components/common/PhotoUploader";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import {
  driverTaskService,
  DriverTask,
  DriverTaskStatus,
  DRIVER_TASK_TRANSITIONS,
  driverTaskStatusLabel,
  driverTaskStatusBadge,
  driverTaskKindLabel,
  driverTaskKindBadge,
  driverTaskActionLabel,
  driverTaskRequiresObservation,
  driverTaskRequiresPhotos,
  shipmentStatusAfterFailure,
  getDriverTaskErrorMessage,
  getPhotoErrorMessage,
  isStalePhotoState,
  MAX_TASK_PHOTOS,
} from "@/services/driverTaskService";
import {
  ShipmentObservation,
  SHIPMENT_OBSERVATION_LABELS,
  shipmentStatusLabel,
} from "@/services/shipmentService";
import { pickupOrderStatusLabel } from "@/services/pickupOrderService";
import { formatBs } from "@/services/logisticsEnums";

const MAX_COMMENT_LENGTH = 500;

interface DriverTaskActionModalProps {
  task: DriverTask;
  onClose: () => void;
  onSaved: () => void;
}

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function DriverTaskActionModal({
  task,
  onClose,
  onSaved,
}: DriverTaskActionModalProps) {
  const { showToast } = useToast();
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const isPickup = task.kind === "Pickup";
  const actions = DRIVER_TASK_TRANSITIONS[task.status] ?? [];
  const [action, setAction] = useState<DriverTaskStatus | "">(
    actions.length === 1 ? actions[0] : ""
  );
  const [observation, setObservation] = useState<ShipmentObservation | "">("");
  const [comment, setComment] = useState("");
  // Las fotos ya viven en el servidor: pueden venir de una subida anterior que
  // quedó a medias (subió dos, se le cortó la señal y volvió a abrir la
  // pantalla). El tope de 3 es acumulado, así que arrancar en cero haría que el
  // conductor elija 3 nuevas y el backend le rebote el lote entero.
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const needsPhotos = !!action && driverTaskRequiresPhotos(action);
  const needsObservation = !!action && driverTaskRequiresObservation(action);

  // La tarjeta del listado trae `photoCount` pero no las URLs, así que lo ya
  // subido solo se conoce pidiendo la tarea. Se pide al elegir cerrarla, que es
  // el único momento en que hace falta.
  const photosLoaded = useRef(false);

  const loadExistingPhotos = useCallback(async () => {
    if (photosLoaded.current) return;
    photosLoaded.current = true;
    setLoadingPhotos(true);
    try {
      const detail = await driverTaskService.getTaskById(task.id);
      setPhotoUrls(detail.photoUrls ?? []);
    } catch {
      // Que vuelva a intentarlo en el próximo clic: si el contador se queda en
      // cero, el conductor elige tres fotos nuevas y el backend rebota el lote.
      photosLoaded.current = false;
    } finally {
      setLoadingPhotos(false);
    }
  }, [task.id]);

  const selectAction = (next: DriverTaskStatus) => {
    setAction(next);
    if (driverTaskRequiresPhotos(next)) void loadExistingPhotos();
  };

  // Subir y cambiar el estado son dos llamadas separadas a propósito: subir por
  // red móvil es lo que más falla, y si la subida viviera dentro del cambio de
  // estado, un reintento arrastraría también la transición del envío.
  const handleUploadPhotos = async (files: File[]) => {
    setUploadingPhotos(true);
    try {
      const res = await driverTaskService.uploadPhotos(task.id, files);
      setPhotoUrls(res.photoUrls);
    } catch (err) {
      // Si el rechazo depende de cuántas fotos hay guardadas, lo que tenemos en
      // pantalla quedó viejo: se vuelve a leer la tarea para que el contador
      // diga la verdad y el reintento suba solo lo que falta.
      if (isStalePhotoState(err)) {
        try {
          const fresh = await driverTaskService.getTaskById(task.id);
          setPhotoUrls(fresh.photoUrls ?? []);
        } catch {
          // Si tampoco se puede leer, queda el mensaje del error original.
        }
      }
      throw new Error(getPhotoErrorMessage(err, "No se pudieron subir las fotos."));
    } finally {
      setUploadingPhotos(false);
    }
  };

  /** Qué le va a pasar al envío o a la solicitud, para decirlo antes de guardar. */
  const outcomeHint = (): string => {
    if (!action) return "";
    if (isPickup) {
      if (action === "Completed") {
        return "La solicitud queda lista para que el mostrador la reciba y la pese.";
      }
      if (action === "Failed") {
        return "La solicitud vuelve a quedar confirmada para reasignarse a otro conductor.";
      }
      return `La solicitud queda en "${pickupOrderStatusLabel("InTransit")}".`;
    }
    if (action === "Failed") {
      return `El envío va a quedar en "${shipmentStatusLabel(
        shipmentStatusAfterFailure(observation)
      )}".${observation !== "CustomerRefused" ? " Tu sucursal podrá reasignarlo para un nuevo intento." : ""}`;
    }
    if (action === "Completed") return "El envío queda entregado.";
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!action) {
      showToast("error", "Error", "Selecciona qué pasó con la tarea.");
      return;
    }
    // Mismas reglas que el backend, para no gastar un viaje:
    // `assignment.photos.required` y `assignment.observation.required`.
    if (needsPhotos && photoUrls.length === 0) {
      showToast(
        "error",
        "Falta la foto",
        isPickup
          ? "Saca al menos una foto del paquete que estás recogiendo."
          : "Para registrar la entrega debes adjuntar al menos una foto."
      );
      return;
    }
    if (needsObservation && !observation) {
      showToast("error", "Falta el motivo", "Indica por qué no se pudo completar.");
      return;
    }

    const trimmed = comment.trim();

    runSubmit(async () => {
      try {
        const res = await driverTaskService.changeStatus(task.id, {
          status: action,
          ...(needsObservation && observation ? { observation } : {}),
          ...(trimmed ? { comment: trimmed } : {}),
        });
        showToast(
          "success",
          "Tarea actualizada",
          `${driverTaskKindLabel(res.kind)} en "${driverTaskStatusLabel(res.status)}".`
        );
        onSaved();
        onClose();
      } catch (err: unknown) {
        showToast(
          "error",
          "Error",
          getDriverTaskErrorMessage(err, "No se pudo actualizar la tarea.")
        );
      }
    });
  };

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {isPickup ? "Registrar recojo" : "Registrar entrega"}
        </h4>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Badge size="sm" color={driverTaskKindBadge(task.kind)}>
            {driverTaskKindLabel(task.kind)}
          </Badge>
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {(isPickup ? task.pickupOrderCode : task.shipmentCode) ?? "—"}
          </span>
          <Badge size="sm" color={driverTaskStatusBadge(task.status)}>
            {driverTaskStatusLabel(task.status)}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
        {task.amountToCollect > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 dark:border-warning-900/40 dark:bg-warning-500/10">
            <span className="text-sm font-semibold text-warning-700 dark:text-warning-400">
              Tienes que cobrar
            </span>
            <span className="text-xl font-bold tabular-nums text-warning-700 dark:text-warning-400">
              {formatBs(task.amountToCollect)}
            </span>
          </div>
        )}

        {actions.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300">
            Esta tarea ya está cerrada. Si se reasignó, vas a verla como una tarea nueva en tu
            lista.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => selectAction(a)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  action === a
                    ? "border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-400"
                    : "border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                }`}
              >
                {driverTaskActionLabel(task.kind, a)}
              </button>
            ))}
          </div>
        )}

        {needsObservation && (
          <div>
            <Label required>¿Qué pasó?</Label>
            <select
              className={selectClassName}
              value={observation}
              onChange={(e) => setObservation(e.target.value as ShipmentObservation)}
              required
            >
              <option value="" disabled>
                Selecciona el motivo
              </option>
              {(Object.entries(SHIPMENT_OBSERVATION_LABELS) as [ShipmentObservation, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{outcomeHint()}</p>
          </div>
        )}

        {needsPhotos && (
          <PhotoUploader
            value={photoUrls}
            onUpload={handleUploadPhotos}
            maxPhotos={MAX_TASK_PHOTOS}
            disabled={submitting || loadingPhotos}
            label={isPickup ? "Foto del paquete (obligatoria)" : "Foto de la entrega (obligatoria)"}
            hint={
              loadingPhotos
                ? "Buscando las fotos que ya subiste…"
                : isPickup
                ? "La foto es la constancia de qué recogiste y en qué estado."
                : "Al menos una foto del paquete entregado o de la firma de quien recibe."
            }
          />
        )}

        {action && !needsObservation && outcomeHint() && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{outcomeHint()}</p>
        )}

        {action && (
          <div>
            <Label required={false}>
              Comentario
              <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
            </Label>
            <TextArea
              value={comment}
              onChange={(value) => value.length <= MAX_COMMENT_LENGTH && setComment(value)}
              rows={3}
              placeholder={isPickup ? "Ej. Dos cajas más de lo declarado" : "Ej. Entregado a la esposa"}
              hint={`${comment.length}/${MAX_COMMENT_LENGTH}`}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            size="sm"
            type="submit"
            disabled={submitting || !action || uploadingPhotos || loadingPhotos}
          >
            {submitting ? "Guardando…" : uploadingPhotos ? "Subiendo fotos…" : "Confirmar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
