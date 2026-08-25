"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SupplierOrderDeliveryForm from "@/components/proveedor/SupplierOrderDeliveryForm";
import { ChevronLeftIcon } from "@/icons";

const LIST_PATH = "/proveedor/ordenes";

export default function NuevaOrdenEntregaPage() {
  const router = useRouter();

  // Cancelar y guardar terminan en el mismo lugar: el listado. Al volver, la
  // lista pide sus datos de nuevo, así que la orden recién creada ya aparece.
  const goToList = () => router.push(LIST_PATH);

  return (
    <div>
      <div className="mb-5">
        <Link
          href={LIST_PATH}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand-500 dark:text-gray-400"
        >
          <ChevronLeftIcon className="size-4" />
          Volver a Órdenes de Entrega
        </Link>
      </div>

      <SupplierOrderDeliveryForm
        mode="create"
        orderId={null}
        layout="page"
        onClose={goToList}
        onSaved={() => {
          /* La navegación de vuelta al listado ya fuerza la recarga. */
        }}
      />
    </div>
  );
}
