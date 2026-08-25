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
  shipmentAssignmentService,
  ShipmentAssignment,
  ShipmentAssignmentStatus,
  DRIVER_ASSIGNMENT_TRANSITIONS,
  assignmentStatusLabel,
  assignmentStatusBadge,
  shipmentStatusAfterFailure,
  getAssignmentErrorMessage,
  getPhotoErrorMessage,
  isStalePhotoState,
  MAX_ASSIGNMENT_PHOTOS,
} from "@/services/shipmentAssignmentService";
import {
  ShipmentObservation,
  SHIPMENT_OBSERVATION_LABELS,
  shipmentStatusLabel,
} from "@/services/shipmentService";

const MAX_COMMENT_LENGTH = 500;

interface AssignmentActionModalProps {
  assignment: ShipmentAssignment;
  onClose: () => void;
  onSaved: () => void;
}

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

// Lo que el conductor ve como botón, por transición.
const ACTION_LABELS: Partial<Record<ShipmentAssignmentStatus, string>> = {
  PickedUp: "Recogí el paquete",
  Delivered: "Entregué",
  Failed: "No pude entregar",
};

export default function AssignmentActionModal({
  assignment,
  onClose,
  onSaved,
}: AssignmentActionModalProps) {
  const { showToast } = useToast();
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const actions = DRIVER_ASSIGNMENT_TRANSITIONS[assignment.status] ?? [];
  const [action, setAction] = useState<ShipmentAssignmentStatus | "">(
    actions.length === 1 ? actions[0] : ""
  );
  const [observation, setObservation] = useState<ShipmentObservation | "">("");
  const [deliveryComment, setDeliveryComment] = useState("");
  // Las fotos ya viven en el servidor: pueden venir de una subida anterior que
  // quedó a medias (subió dos, se le cortó la señal y volvió a abrir la
  // pantalla). El tope de 3 es acumulado, así que arrancar en cero haría que el
  // conductor elija 3 nuevas y el backend le rebote el lote entero.
  const [photoUrls, setPhotoUrls] = useState<string[]>(assignment.photoUrls ?? []);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const needsPhotos = action === "Delivered";
  const needsObservation = action === "Failed";

  // La tarjeta del listado trae `photoCount` pero no las URLs, así que lo ya
  // subido solo se conoce pidiendo el reparto. Se pide al elegir "Entregué",
  // que es el único momento en que hace falta.
  const photosLoaded = useRef(Array.isArray(assignment.photoUrls));

  const loadExistingPhotos = useCallback(async () => {
    if (photosLoaded.current) return;
    photosLoaded.current = true;
    setLoadingPhotos(true);
    try {
      const detail = await shipmentAssignmentService.getAssignmentById(assignment.id);
      setPhotoUrls(detail.photoUrls ?? []);
    } catch {
      // Que vuelva a intentarlo en el próximo clic: si el contador se queda en
      // cero, el conductor elige tres fotos nuevas y el backend rebota el lote.
      photosLoaded.current = false;
    } finally {
      setLoadingPhotos(false);
    }
  }, [assignment.id]);

  const selectAction = (next: ShipmentAssignmentStatus) => {
    setAction(next);
    if (next === "Delivered") void loadExistingPhotos();
  };

  // Subir y cambiar el estado son dos llamadas separadas a propósito: subir por
  // red móvil es lo que más falla, y si la subida viviera dentro del cambio de
  // estado, un reintento arrastraría también la transición del envío.
  const handleUploadPhotos = async (files: File[]) => {
    setUploadingPhotos(true);
    try {
      const res = await shipmentAssignmentService.uploadPhotos(assignment.id, files);
      setPhotoUrls(res.photoUrls);
    } catch (err) {
      // Si el rechazo depende de cuántas fotos hay guardadas, lo que tenemos en
      // pantalla quedó viejo: se vuelve a leer el reparto para que el contador
      // diga la verdad y el reintento suba solo lo que falta.
      if (isStalePhotoState(err)) {
        try {
          const fresh = await shipmentAssignmentService.getAssignmentById(assignment.id);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!action) {
      showToast("error", "Error", "Selecciona qué pasó con la entrega.");
      return;
    }
    // Mismas reglas que el backend, para no gastar un viaje: `assignment.photos.required`
    // y `assignment.observation.required`.
    if (needsPhotos && photoUrls.length === 0) {
      showToast("error", "Falta la foto", "Para registrar la entrega debes adjuntar al menos una foto.");
      return;
    }
    if (needsObservation && !observation) {
      showToast("error", "Falta el motivo", "Indica por qué no se pudo entregar.");
      return;
    }

    const comment = deliveryComment.trim();

    runSubmit(async () => {
      try {
        const res = await shipmentAssignmentService.changeStatus(assignment.id, {
          status: action,
          ...(needsObservation && observation ? { observation } : {}),
          ...(comment ? { deliveryComment: comment } : {}),
        });
        showToast(
          "success",
          "Reparto actualizado",
          `La guía ${res.shipmentCode} quedó en "${shipmentStatusLabel(res.shipmentStatus)}".`
        );
        onSaved();
        onClose();
      } catch (err: unknown) {
        showToast(
          "error",
          "Error",
          getAssignmentErrorMessage(err, "No se pudo actualizar el reparto.")
        );
      }
    });
  };

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Registrar reparto</h4>
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {assignment.shipmentCode}
          </span>
          <Badge size="sm" color={assignmentStatusBadge(assignment.status)}>
            {assignmentStatusLabel(assignment.status)}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
        {actions.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300">
            Este intento de reparto ya está cerrado. Si el envío se reasignó, vas a verlo como
            una entrega nueva en tu lista.
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
                {ACTION_LABELS[a] ?? assignmentStatusLabel(a)}
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
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              El envío va a quedar en &quot;{shipmentStatusLabel(shipmentStatusAfterFailure(observation))}
              &quot;.
              {observation !== "CustomerRefused" && " Tu sucursal podrá reasignarlo para un nuevo intento."}
            </p>
          </div>
        )}

        {needsPhotos && (
          <PhotoUploader
            value={photoUrls}
            onUpload={handleUploadPhotos}
            maxPhotos={MAX_ASSIGNMENT_PHOTOS}
            disabled={submitting || loadingPhotos}
            label="Foto de la entrega (obligatoria)"
            hint={
              loadingPhotos
                ? "Buscando las fotos que ya subiste…"
                : "Al menos una foto del paquete entregado o de la firma de quien recibe."
            }
          />
        )}

        {action && (
          <div>
            <Label required={false}>
              Comentario
              <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
            </Label>
            <TextArea
              value={deliveryComment}
              onChange={(value) => value.length <= MAX_COMMENT_LENGTH && setDeliveryComment(value)}
              rows={3}
              placeholder="Ej. Entregado a la esposa"
              hint={`${deliveryComment.length}/${MAX_COMMENT_LENGTH}`}
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
