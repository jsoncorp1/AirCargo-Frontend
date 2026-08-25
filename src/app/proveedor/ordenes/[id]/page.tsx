"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SupplierOrderDetailView from "@/components/proveedor/SupplierOrderDetailView";
import {
  OrderDelivery,
  orderDeliveryService,
} from "@/services/orderDeliveryService";
import { getApiErrorMessage } from "@/services/apiErrorMessages";
import { isOrderOwner } from "@/utils/orderOwnership";
import { useAuth } from "@/context/AuthContext";
import { ChevronLeftIcon, PencilIcon } from "@/icons";

const LIST_PATH = "/proveedor/ordenes";

export default function DetalleOrdenEntregaPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

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

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={LIST_PATH}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand-500 dark:text-gray-400"
        >
          <ChevronLeftIcon className="size-4" />
          Volver a Órdenes de Entrega
        </Link>

        {/* No se ofrece editar si la orden ya se convirtió en envío, ni si la
            creó otro usuario del proveedor: el backend rechaza las dos cosas. */}
        {order && !order.isAttended && isOrderOwner(order, user?.email) && (
          <Link
            href={`${LIST_PATH}/${order.id}/editar`}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
          >
            <PencilIcon className="size-4" />
            Editar
          </Link>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03]">
          Cargando datos de la orden…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-error-200 bg-error-50 p-10 text-center text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      ) : (
        order && <SupplierOrderDetailView order={order} />
      )}
    </div>
  );
}
