"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import TextArea from "@/components/form/input/TextArea";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import {
  leadService,
  LeadListItem,
  LeadStatus,
  LEAD_STATUS_TRANSITIONS,
  LEAD_MAX_LENGTHS,
  leadStatusLabel,
  leadStatusBadge,
  getLeadErrorMessage,
} from "@/services/leadService";

interface LeadStatusModalProps {
  lead: LeadListItem;
  onClose: () => void;
  onSaved: () => void;
}

export default function LeadStatusModal({ lead, onClose, onSaved }: LeadStatusModalProps) {
  const { showToast } = useToast();
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const transitions = LEAD_STATUS_TRANSITIONS[lead.status] ?? [];
  const [status, setStatus] = useState<LeadStatus | "">(
    transitions.length === 1 ? transitions[0] : ""
  );
  const [internalNote, setInternalNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      showToast("error", "Error", "Selecciona el nuevo estado.");
      return;
    }

    const note = internalNote.trim();

    runSubmit(async () => {
      try {
        const res = await leadService.changeLeadStatus(lead.id, {
          status,
          // Omitirla CONSERVA la anterior; no la borra.
          ...(note ? { internalNote: note } : {}),
        });
        showToast(
          "success",
          "Estado actualizado",
          `${lead.companyName} quedó en "${leadStatusLabel(res.status)}".` +
            (res.assignedToFullName ? ` Responsable: ${res.assignedToFullName}.` : "")
        );
        onSaved();
        onClose();
      } catch (err: unknown) {
        showToast("error", "Error", getLeadErrorMessage(err, "No se pudo cambiar el estado."));
      }
    });
  };

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Gestionar cliente potencial
        </h4>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">{lead.companyName}</span>
          <Badge size="sm" color={leadStatusBadge(lead.status)}>
            {leadStatusLabel(lead.status)}
          </Badge>
          {lead.assignedToFullName && <span className="text-xs">· {lead.assignedToFullName}</span>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
        {transitions.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300">
            Este cliente potencial ya está cerrado y no se puede reabrir.
          </div>
        ) : (
          <>
            <div>
              <Label required>Nuevo estado</Label>
              <div className="flex flex-wrap gap-2">
                {transitions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setStatus(t)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      status === t
                        ? "border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-400"
                        : "border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    {leadStatusLabel(t)}
                  </button>
                ))}
              </div>
              {(status === "Won" || status === "Lost") && (
                <p className="mt-2 text-xs text-warning-600 dark:text-orange-400">
                  Es un estado final: después de guardarlo no se puede volver atrás.
                </p>
              )}
            </div>

            <div>
              <Label>
                Nota interna
                <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
              </Label>
              <TextArea
                value={internalNote}
                onChange={(value) =>
                  value.length <= LEAD_MAX_LENGTHS.internalNote && setInternalNote(value)
                }
                rows={3}
                placeholder="Ej. Llamé, pidió cotización por escrito"
                hint={`${internalNote.length}/${LEAD_MAX_LENGTHS.internalNote}`}
              />
              <p className="mt-1 text-xs text-gray-400">
                Si la dejas vacía se conserva la nota anterior.
              </p>
            </div>

            {!lead.assignedToUserId && (
              <p className="text-xs text-gray-400">
                Al guardar, este cliente potencial queda a tu cargo.
              </p>
            )}
          </>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={submitting || !status}>
            {submitting ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
