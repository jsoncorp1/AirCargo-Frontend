"use client";

import React from "react";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderDelivery } from "@/services/orderDeliveryService";
import { BoxCubeIcon, CheckLineIcon } from "@/icons";
import { formatDate, formatTime } from "@/utils/datetime";

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  Prepaid: "Pagada",
  CashOnDelivery: "Por Pagar",
};

/**
 * Una fila etiqueta/valor. El valor cae a "—" cuando no hay dato para que las
 * columnas no se desalineen entre tarjetas.
 */
function Field({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | null;
  href?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      {value ? (
        href ? (
          <a
            href={href}
            className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {value}
          </p>
        )
      ) : (
        <p className="text-sm text-gray-400">—</p>
      )}
    </div>
  );
}

type LifecycleStep = {
  label: string;
  at?: string | null;
  done: boolean;
  /** Qué decir cuando el hito todavía no ocurrió. */
  pendingHint: string;
  /** Línea extra bajo la fecha: quién lo hizo. */
  by?: string | null;
};

/**
 * Ciclo de vida de la orden: Creada → Atendida. Verde con tilde lo que ya pasó,
 * gris lo que falta, y la línea entre hitos se pinta según el hito siguiente.
 * Horizontal en desktop y vertical en mobile, con el mismo markup.
 */
function LifecycleFlow({ steps }: { steps: LifecycleStep[] }) {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.label}>
          <div className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ${
                step.done
                  ? "bg-success-500 text-white ring-success-50 dark:ring-success-500/15"
                  : "bg-gray-200 text-gray-400 ring-gray-50 dark:bg-gray-700 dark:text-gray-500 dark:ring-gray-800/60"
              }`}
            >
              {step.done ? (
                <CheckLineIcon className="size-4" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-current" />
              )}
            </span>

            <div className="min-w-0">
              <p
                className={`text-sm font-semibold ${
                  step.done
                    ? "text-gray-800 dark:text-white/90"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {step.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {step.done
                  ? step.at
                    ? `${formatDate(step.at)} · ${formatTime(step.at)}`
                    : "Sin fecha registrada"
                  : step.pendingHint}
              </p>
              {step.done && step.by && (
                <p
                  className="truncate text-xs text-gray-400 dark:text-gray-500"
                  title={step.by}
                >
                  por {step.by}
                </p>
              )}
            </div>
          </div>

          {index < steps.length - 1 && (
            <span
              className={`ml-[15px] h-6 w-0.5 rounded-full sm:ml-0 sm:h-0.5 sm:w-auto sm:flex-1 ${
                steps[index + 1].done
                  ? "bg-success-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      <h5 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-500">
        {title}
      </h5>
      {children}
    </div>
  );
}

export default function SupplierOrderDetailView({
  order,
}: {
  order: OrderDelivery;
}) {
  const branchLabel = order.destinationBranchOfficeCity
    ? [order.destinationBranchOfficeCity, order.destinationBranchOfficeCode]
        .filter(Boolean)
        .join(" — ")
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Encabezado: lo que se mira primero — estado, total y cuándo. */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {/* Sin badge de estado: el flujo de abajo ya lo dice, y con más
                detalle (cuándo pasó cada hito). */}
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                Orden de Entrega
              </h2>
              {order.isExpress && (
                <Badge size="sm" color="error">
                  Expreso
                </Badge>
              )}
              <Badge
                size="sm"
                color={order.deliveryType === "Prepaid" ? "success" : "warning"}
              >
                {DELIVERY_TYPE_LABELS[order.deliveryType] ?? order.deliveryType}
              </Badge>
            </div>
            {/* Sin línea de "registrada por": quién la creó ya lo dice el hito
                "Creada" de abajo, y el proveedor aparece como Remitente en
                Origen / Emisor. */}
          </div>

          <div className="shrink-0 rounded-xl border border-brand-200 bg-brand-50 px-5 py-3 dark:border-brand-800 dark:bg-brand-900/20">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Total de la Orden
            </p>
            <p className="text-2xl font-bold text-brand-800 dark:text-brand-200">
              Bs {order.totalPrice.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-5 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
          <LifecycleFlow
            steps={[
              {
                label: "Creada",
                at: order.createdAt,
                done: true,
                pendingHint: "",
                by: order.createdBy,
              },
              {
                label: "Atendida",
                at: order.attendedAt,
                done: order.isAttended,
                pendingHint: "Todavía no se convirtió en envío",
                by: order.attendedByEmail,
              },
            ]}
          />

          {/* El paso siguiente natural después de "¿ya la atendieron?".
              Abre el envío en el listado del proveedor. */}
          {order.shipmentId && (
            <a
              href={`/proveedor/envios?envio=${order.shipmentId}`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              <BoxCubeIcon className="size-4" />
              Ver envío {order.shipmentCode ?? order.shipmentWaybillNumber}
            </a>
          )}
        </div>
      </div>

      {/* Origen y destino en paralelo: se leen comparando, no en secuencia. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Origen / Emisor">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Departamento" value={order.originDepartment} />
            <Field label="Remitente" value={order.senderFullName} />
            <Field
              label="Teléfono"
              value={order.senderPhone}
              href={order.senderPhone ? `tel:${order.senderPhone}` : undefined}
            />
            <Field label="Dirección" value={order.senderAddress} />
          </div>
        </Card>

        <Card title="Destino / Cliente">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Cliente" value={order.clientFullName} />
            <Field
              label="Teléfono"
              value={order.clientPhone}
              href={order.clientPhone ? `tel:${order.clientPhone}` : undefined}
            />
            <Field label="Departamento" value={order.destinationDepartment} />
            <Field label="Sucursal de destino" value={branchLabel} />
            <div className="sm:col-span-2">
              <Field label="Dirección exacta" value={order.clientAddress} />
            </div>
          </div>
        </Card>
      </div>

      {/* Artículos: tabla real en vez de la lista de inputs del formulario. */}
      <Card title={`Artículos (${order.details.length})`}>
        <div className="custom-scrollbar -mx-5 overflow-x-auto">
          <div className="min-w-[520px] px-5">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell
                    isHeader
                    className="w-12 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    Nro
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 pl-5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    Artículo
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    Cantidad
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    P. Unitario
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    Subtotal
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {order.details.map((detail, index) => (
                  <TableRow key={detail.id}>
                    <TableCell className="w-12 py-3.5 text-right align-middle text-theme-sm tabular-nums text-gray-400">
                      {index + 1}
                    </TableCell>
                    <TableCell className="py-3.5 pl-5 align-middle text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {detail.articleName}
                    </TableCell>
                    <TableCell className="py-3.5 text-right align-middle text-theme-sm tabular-nums text-gray-600 dark:text-gray-300">
                      {detail.quantity}
                    </TableCell>
                    <TableCell className="py-3.5 text-right align-middle text-theme-sm tabular-nums text-gray-600 dark:text-gray-300">
                      Bs {detail.unitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-3.5 text-right align-middle text-theme-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">
                      Bs {detail.lineTotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
}
