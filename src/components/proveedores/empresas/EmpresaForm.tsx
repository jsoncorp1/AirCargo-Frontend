"use client";

import React, { useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import SelectField from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import AvatarText from "@/components/ui/avatar/AvatarText";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { UserIcon, BoxCubeIcon } from "@/icons";
import {
  BOLIVIAN_DEPARTMENT_LABELS,
  BolivianDepartment,
  Supplier,
  SupplierKind,
  SUPPLIER_KIND_OPTIONS,
  supplierKindLabel,
  MIN_PAYMENT_DUE_DAY,
  MAX_PAYMENT_DUE_DAY,
} from "@/services/supplierService";

export type EmpresaFormData = Omit<Supplier, "id">;

/** `08:30:00` ⇄ `08:30`: el input de hora no quiere los segundos del `TimeOnly`. */
const toInputTime = (value?: string | null): string => (value ? value.slice(0, 5) : "");
const toApiTime = (value: string): string | null =>
  value ? (value.length === 5 ? `${value}:00` : value) : null;

interface EmpresaFormProps {
  mode: "create" | "edit" | "view";
  initialData: Supplier | null;
  onSubmit: (data: EmpresaFormData) => void | Promise<void>;
  onCancel: () => void;
}

const emptyData: EmpresaFormData = {
  name: "",
  description: "",
  kind: "WithCatalog",
  hasCreditAccount: false,
};

const DEPARTMENT_OPTIONS = (Object.keys(BOLIVIAN_DEPARTMENT_LABELS) as BolivianDepartment[]).map(
  (value) => ({ value, label: BOLIVIAN_DEPARTMENT_LABELS[value] })
);

export default function EmpresaForm({ mode, initialData, onSubmit, onCancel }: EmpresaFormProps) {
  const [data, setData] = useState<EmpresaFormData>(initialData ?? emptyData);
  // Cerrojo: evita que un doble click cree la empresa dos veces.
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof EmpresaFormData>(key: K, value: EmpresaFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  /**
   * Las reglas que el backend valida, chequeadas antes de mandar para no perder
   * el formulario en un 400: `supplier.businesshours.incomplete`, `.invalid` y
   * `supplier.paymentdueday.invalid`.
   */
  const handleSave = () => {
    const start = toInputTime(data.businessHoursStart);
    const end = toInputTime(data.businessHoursEnd);

    if (!!start !== !!end) {
      setFormError("El horario de atención va completo: las dos horas o ninguna.");
      return;
    }
    if (start && end && start >= end) {
      setFormError("La hora de apertura tiene que ser anterior a la de cierre.");
      return;
    }
    if (data.hasCreditAccount) {
      const day = data.paymentDueDay;
      if (!day || day < MIN_PAYMENT_DUE_DAY || day > MAX_PAYMENT_DUE_DAY) {
        setFormError(
          `El día de vencimiento tiene que estar entre ${MIN_PAYMENT_DUE_DAY} y ${MAX_PAYMENT_DUE_DAY}.`
        );
        return;
      }
    }

    setFormError(null);
    return runSubmit(() =>
      onSubmit({
        ...data,
        // Las horas viajan como `TimeOnly` con segundos.
        businessHoursStart: toApiTime(start),
        businessHoursEnd: toApiTime(end),
        // Sin crédito el día de vencimiento no significa nada: mandarlo cargado
        // dejaría un dato que contradice al interruptor.
        paymentDueDay: data.hasCreditAccount ? data.paymentDueDay : null,
      })
    );
  };

  const titles: Record<typeof mode, string> = {
    create: "Nueva empresa proveedora",
    edit: "Editar empresa proveedora",
    view: "Detalle de empresa proveedora",
  };

  if (mode === "view" && initialData) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-4">
          <AvatarText name={initialData.name} />
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {initialData.name}
            </h4>
            {initialData.department ? (
              <Badge size="sm" color="light">{BOLIVIAN_DEPARTMENT_LABELS[initialData.department]}</Badge>
            ) : (
              <span className="text-theme-xs text-gray-400">Sin departamento asignado</span>
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
              <UserIcon className="size-5" />
            </div>
            <div>
              <p className="text-theme-xs text-gray-400">Usuarios</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {initialData.userQuantity ?? 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
              <BoxCubeIcon className="size-5" />
            </div>
            <div>
              <p className="text-theme-xs text-gray-400">Artículos</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {initialData.articleQuantity ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Label>Descripción</Label>
          <p className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-theme-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
            {initialData.description?.trim() || "Sin descripción"}
          </p>
        </div>

        {/* Configuración: es lo que decide qué puede hacer la empresa —fiar,
            pedir recojos con su horario precargado— así que va a la vista. */}
        <div className="mb-6 space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-theme-sm text-gray-500 dark:text-gray-400">Tipo</span>
            <Badge size="sm" color="light">
              {supplierKindLabel(initialData.kind ?? "WithCatalog")}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-theme-sm text-gray-500 dark:text-gray-400">Cuenta corriente</span>
            <Badge size="sm" color={initialData.hasCreditAccount ? "success" : "light"}>
              {initialData.hasCreditAccount
                ? `Habilitada · vence el ${initialData.paymentDueDay ?? "—"}`
                : "No habilitada"}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-theme-sm text-gray-500 dark:text-gray-400">Horario</span>
            <span className="text-theme-sm text-gray-700 dark:text-gray-300">
              {initialData.businessHoursStart && initialData.businessHoursEnd
                ? `${toInputTime(initialData.businessHoursStart)} – ${toInputTime(initialData.businessHoursEnd)}`
                : "Sin cargar"}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-theme-sm text-gray-500 dark:text-gray-400">
              Punto de recojo
            </span>
            <span className="text-right text-theme-sm text-gray-700 dark:text-gray-300">
              {initialData.address?.trim() || "Sin cargar"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
          <Button variant="outline" onClick={onCancel}>Cerrar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
        {titles[mode]}
      </h4>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <Label required>Nombre de la empresa</Label>
            <Input
              defaultValue={data.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej. Acme Corp"
            />
          </div>
          <div>
            <Label>Departamento</Label>
            <SelectField
              placeholder="Selecciona un departamento"
              options={DEPARTMENT_OPTIONS}
              defaultValue={data.department ?? ""}
              onChange={(value) => set("department", (value || undefined) as BolivianDepartment | undefined)}
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <TextArea
              placeholder="Descripción o información adicional"
              value={data.description ?? ""}
              onChange={(value) => set("description", value)}
              rows={4}
            />
          </div>

          <div>
            <Label>Tipo de empresa</Label>
            <SelectField
              placeholder="Selecciona el tipo"
              options={SUPPLIER_KIND_OPTIONS}
              defaultValue={data.kind ?? "WithCatalog"}
              onChange={(value) => set("kind", value as SupplierKind)}
            />
            <p className="mt-1.5 text-theme-xs text-gray-400 dark:text-gray-500">
              {data.kind === "PickupOnly"
                ? "Sin catálogo: sus envíos se piden como solicitud de recojo."
                : "Con catálogo de artículos y órdenes de entrega."}
              {" "}Para pasarla a &quot;solo recojos&quot; hay que dar de baja su catálogo primero.
            </p>
          </div>
        </div>

        {/* ── Punto de recojo por defecto ─────────────────────────────────
            Precarga el alta de una solicitud de recojo, que si no hay que
            completar a mano cada vez. */}
        <div className="space-y-5 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
          <h5 className="text-xs font-bold uppercase tracking-wider text-brand-500">
            Punto de recojo por defecto
          </h5>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Dirección</Label>
              <Input
                value={data.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Ej. Av. Busch #123"
              />
            </div>
            <div>
              <Label>Enlace de mapa</Label>
              <Input
                value={data.locationUrl ?? ""}
                onChange={(e) => set("locationUrl", e.target.value)}
                placeholder="https://maps.app.goo.gl/…"
              />
            </div>
            <div>
              <Label>Teléfono de contacto</Label>
              <Input
                value={data.contactPhone ?? ""}
                onChange={(e) => set("contactPhone", e.target.value)}
                placeholder="Ej. +591 7XXXXXXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label>Atiende desde</Label>
              <Input
                type="time"
                value={toInputTime(data.businessHoursStart)}
                onChange={(e) => set("businessHoursStart", e.target.value || null)}
              />
            </div>
            <div>
              <Label>Atiende hasta</Label>
              <Input
                type="time"
                value={toInputTime(data.businessHoursEnd)}
                onChange={(e) => set("businessHoursEnd", e.target.value || null)}
              />
            </div>
          </div>
          {/* Van las dos horas o ninguna: media configuración la rechaza el
              backend con `supplier.businesshours.incomplete`. */}
          <p className="text-theme-xs text-gray-400 dark:text-gray-500">
            Precarga la ventana horaria al pedir un recojo. Cargá las dos horas o ninguna.
          </p>
        </div>

        {/* ── Cuenta corriente ────────────────────────────────────────── */}
        <div className="space-y-5 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
          <h5 className="text-xs font-bold uppercase tracking-wider text-brand-500">
            Cuenta corriente
          </h5>

          <Switch
            label="Puede fiar (habilita la forma de pago a cuenta)"
            defaultChecked={!!data.hasCreditAccount}
            onChange={(checked) => set("hasCreditAccount", checked)}
          />

          {data.hasCreditAccount && (
            <div className="sm:max-w-xs">
              <Label required>Día de vencimiento</Label>
              <Input
                type="number"
                min={String(MIN_PAYMENT_DUE_DAY)}
                max={String(MAX_PAYMENT_DUE_DAY)}
                value={data.paymentDueDay ?? ""}
                onChange={(e) =>
                  set("paymentDueDay", e.target.value ? Number(e.target.value) : null)
                }
                placeholder="5"
              />
              <p className="mt-1.5 text-theme-xs text-gray-400 dark:text-gray-500">
                Entre {MIN_PAYMENT_DUE_DAY} y {MAX_PAYMENT_DUE_DAY}: ningún mes tiene menos de 28
                días.
              </p>
            </div>
          )}

          <p className="text-theme-xs text-gray-400 dark:text-gray-500">
            Quitar el crédito no borra lo ya fiado: impide fiar de ahí en adelante y los períodos
            abiertos se siguen cobrando igual.
          </p>
        </div>

        {formError && (
          <p className="rounded-lg border border-error-100 bg-error-50 p-3 text-theme-sm text-error-600 dark:border-error-900/30 dark:bg-error-500/10 dark:text-error-400">
            {formError}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting ? "Guardando…" : mode === "create" ? "Crear empresa" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}
