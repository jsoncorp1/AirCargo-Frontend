"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import {
  shipmentService,
  getShipmentErrorMessage,
  shipmentStatusLabel,
} from "@/services/shipmentService";

interface ShipmentHandoverModalProps {
  shipmentId: string;
  shipmentCode: string;
  /** A quién esperaba el envío: se precarga el nombre para no tipearlo de cero. */
  clientFullName?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Registra el retiro en mostrador: `AwaitingCustomerPickup → Delivered`.
 *
 * Es la constancia de a quién se le entregó el paquete, y reemplaza al reparto
 * cuando el envío termina en sucursal: no hay conductor al que asignárselo.
 */
export default function ShipmentHandoverModal({
  shipmentId,
  shipmentCode,
  clientFullName,
  onClose,
  onSaved,
}: ShipmentHandoverModalProps) {
  const { showToast } = useToast();
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const [name, setName] = useState(clientFullName ?? "");
  const [documentId, setDocumentId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedDocument = documentId.trim();
    if (!trimmedName || !trimmedDocument) {
      showToast(
        "error",
        "Faltan datos",
        "El nombre y el documento de quien retira son la constancia de la entrega."
      );
      return;
    }

    runSubmit(async () => {
      try {
        const res = await shipmentService.registerHandover(shipmentId, {
          handoverToName: trimmedName,
          handoverToDocument: trimmedDocument,
        });
        showToast(
          "success",
          "Retiro registrado",
          `${res.code} quedó en "${shipmentStatusLabel(res.status)}".`
        );
        onSaved();
        onClose();
      } catch (err: unknown) {
        showToast(
          "error",
          "Error",
          getShipmentErrorMessage(err, "No se pudo registrar el retiro.")
        );
      }
    });
  };

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Registrar retiro en mostrador
        </h4>
        <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {shipmentCode}
          </span>
          Con esto el envío queda entregado.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
        <div>
          <Label required>Quién retira</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre completo"
          />
          {clientFullName && name.trim() !== clientFullName && (
            // No es un error: pasa seguido que retire un familiar. Pero conviene
            // que quede a la vista de quien atiende, que es el que decide.
            <p className="mt-1.5 text-xs text-warning-600 dark:text-warning-400">
              El envío estaba a nombre de {clientFullName}.
            </p>
          )}
        </div>

        <div>
          <Label required>Documento</Label>
          <Input
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            placeholder="Cédula de identidad"
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : "Registrar retiro"}
          </Button>
        </div>
      </form>
    </div>
  );
}
