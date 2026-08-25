"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SupplierOrderDeliveryForm from "@/components/proveedor/SupplierOrderDeliveryForm";
import {
  OrderDelivery,
  orderDeliveryService,
} from "@/services/orderDeliveryService";
import { getApiErrorMessage } from "@/services/apiErrorMessages";
import { isOrderOwner } from "@/utils/orderOwnership";
import { useAuth } from "@/context/AuthContext";
import { ChevronLeftIcon } from "@/icons";

const LIST_PATH = "/proveedor/ordenes";

export default function EditarOrdenEntregaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // La orden se pide acá sólo para decidir si se puede editar: ocultar el botón
  // en la tabla y en el detalle no alcanza, porque a esta URL se puede llegar
  // escribiéndola. El formulario vuelve a pedirla para llenarse; son dos
  // llamadas en una pantalla que se abre de a una, y prefiero eso a que el
  // usuario complete un formulario para comerse un 403 al guardar.
  const [order, setOrder] = useState<OrderDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    try {
      setOrder(await orderDeliveryService.getDeliveryById(id));
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo cargar la orden."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Cancelar y guardar vuelven al detalle: es de donde se entra a editar, y al
  // volver se ven los cambios recién guardados.
  const goToDetail = () => router.push(`${LIST_PATH}/${id}`);

  const blockedReason = !order
    ? null
    : order.isAttended
    ? "Esta orden ya se convirtió en envío y no se puede modificar."
    : !isOrderOwner(order, user?.email)
    ? "Solo quien creó esta orden puede modificarla."
    : null;

  return (
    <div>
      <div className="mb-5">
        <Link
          href={`${LIST_PATH}/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand-500 dark:text-gray-400"
        >
          <ChevronLeftIcon className="size-4" />
          Volver al detalle de la orden
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03]">
          Cargando datos de la orden…
        </div>
      ) : error || blockedReason ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-gray-600 dark:text-gray-300">
            {error ?? blockedReason}
          </p>
          <Link
            href={`${LIST_PATH}/${id}`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Ver el detalle de la orden
          </Link>
        </div>
      ) : (
        <SupplierOrderDeliveryForm
          mode="edit"
          orderId={id}
          layout="page"
          onClose={goToDetail}
          onSaved={() => {
            /* La navegación al detalle ya vuelve a pedir la orden. */
          }}
        />
      )}
    </div>
  );
}
