import React from "react";
import Button from "@/components/ui/button/Button";
import { TrashBinIcon } from "@/icons";

interface SucursalDeleteModalProps {
  branchCode: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SucursalDeleteModal({
  branchCode,
  isDeleting,
  onConfirm,
  onCancel,
}: SucursalDeleteModalProps) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/10">
          <TrashBinIcon className="size-5 text-error-500" />
        </div>
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Eliminar Sucursal
        </h4>
      </div>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        ¿Estás seguro de eliminar la sucursal{" "}
        <strong className="text-gray-800 dark:text-white/90">
          "{branchCode}"
        </strong>
        ? Esta acción no se puede deshacer.
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? "Eliminando..." : "Eliminar"}
        </Button>
      </div>
    </div>
  );
}
