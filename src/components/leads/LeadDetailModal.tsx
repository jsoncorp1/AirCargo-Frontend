"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  leadService,
  LeadDetail,
  leadStatusLabel,
  leadStatusBadge,
  getLeadErrorMessage,
} from "@/services/leadService";
import { BOLIVIAN_DEPARTMENT_LABELS } from "@/services/supplierService";
import { formatDateTime } from "@/utils/datetime";

interface LeadDetailModalProps {
  leadId: string;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-right text-sm font-medium text-gray-800 dark:text-gray-200">{value}</span>
    </div>
  );
}

export default function LeadDetailModal({ leadId, onClose }: LeadDetailModalProps) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await leadService.getLeadById(leadId);
        if (!cancelled) setLead(data);
      } catch (err) {
        if (!cancelled) {
          setError(getLeadErrorMessage(err, "No se pudo cargar el cliente potencial."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Cliente potencial
        </h4>
        {lead && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {lead.companyName}
            </span>
            <Badge size="sm" color={leadStatusBadge(lead.status)}>
              {leadStatusLabel(lead.status)}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && <p className="py-8 text-center text-sm text-gray-500">Cargando…</p>}
        {error && <p className="py-8 text-center text-sm text-error-500">{error}</p>}

        {lead && (
          <div className="space-y-6">
            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">Empresa</h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Compañía" value={lead.companyName} />
                <Row label="Dirección" value={lead.companyAddress} />
                <Row
                  label="Ciudad"
                  value={BOLIVIAN_DEPARTMENT_LABELS[lead.city] ?? lead.city}
                />
                <Row label="País" value={lead.country} />
              </div>
            </section>

            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">Contacto</h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Nombre" value={lead.contactFullName} />
                <Row
                  label="Correo"
                  value={
                    <a href={`mailto:${lead.contactEmail}`} className="text-brand-500 hover:underline">
                      {lead.contactEmail}
                    </a>
                  }
                />
                <Row
                  label="Teléfono"
                  value={
                    <a href={`tel:${lead.contactPhone}`} className="text-brand-500 hover:underline">
                      {lead.contactPhone}
                    </a>
                  }
                />
              </div>
            </section>

            {lead.comments && (
              <section>
                <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                  Lo que escribió
                </h5>
                <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm italic text-gray-600 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300">
                  {lead.comments}
                </p>
              </section>
            )}

            <section>
              <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">Gestión</h5>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label="Recibido" value={formatDateTime(lead.createdAt)} />
                <Row
                  label="Último cambio"
                  value={
                    lead.statusChangedAt
                      ? formatDateTime(lead.statusChangedAt)
                      : "—"
                  }
                />
                <Row label="Responsable" value={lead.assignedToFullName ?? "Sin asignar"} />
              </div>
              {lead.internalNote && (
                <p className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300">
                  <span className="font-semibold">Nota interna:</span> {lead.internalNote}
                </p>
              )}
            </section>
          </div>
        )}
      </div>

      <div className="flex justify-end border-t border-gray-100 px-6 py-4 dark:border-gray-800">
        <Button size="sm" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
