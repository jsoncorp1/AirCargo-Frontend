"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useAuth } from "@/context/AuthContext";
import { PlusIcon, TrashBinIcon, EyeIcon } from "@/icons";
import {
  manifestService,
  ManifestDetail,
  isManifestEditable,
  availableManifestTransitions,
  manifestStatusLabel,
  manifestStatusBadge,
  getManifestErrorMessage,
} from "@/services/manifestService";
import { shipmentStatusLabel, shipmentStatusBadge } from "@/services/shipmentService";
import ShipmentForm from "@/components/envios/ShipmentForm";
import AddShipmentsModal from "./AddShipmentsModal";
import ManifestStatusModal from "./ManifestStatusModal";
import { formatDateTime } from "@/utils/datetime";

interface ManifestDetailViewProps {
  manifestId: string;
  basePath: string;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{value}</p>
    </div>
  );
}

export default function ManifestDetailView({ manifestId, basePath }: ManifestDetailViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { isSuperAdminUser, branchOfficeId } = useAuth();
  const addModal = useModal();
  const statusModal = useModal();
  const viewModal = useModal();
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);

  const openView = useCallback((id: string) => {
    setSelectedShipmentId(id);
    viewModal.openModal();
  }, [viewModal]);

  const { pending: removing, run: runRemove } = useSubmitLock();
  const { pending: deleting, run: runDelete } = useSubmitLock();

  const [manifest, setManifest] = useState<ManifestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManifest = useCallback(async () => {
    setLoading(true);
    try {
      const data = await manifestService.getManifestById(manifestId);
      setManifest(data);
      setError(null);
    } catch (err) {
      setError(getManifestErrorMessage(err, "No se pudo cargar el manifiesto."));
    } finally {
      setLoading(false);
    }
  }, [manifestId]);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  const handleRemoveShipment = (shipmentId: string, shipmentCode: string) => {
    runRemove(async () => {
      try {
        await manifestService.removeShipment(manifestId, shipmentId);
        showToast(
          "success",
          "Envío retirado",
          `${shipmentCode} volvió a esperar en la sucursal de origen.`
        );
        fetchManifest();
      } catch (err: unknown) {
        showToast("error", "Error", getManifestErrorMessage(err, "No se pudo quitar el envío."));
      }
    });
  };

  const handleDeleteManifest = () => {
    if (!manifest) return;
    runDelete(async () => {
      try {
        await manifestService.deleteManifest(manifest.id);
        showToast("success", "Manifiesto eliminado", `${manifest.code} se eliminó.`);
        router.push(basePath);
      } catch (err: unknown) {
        showToast(
          "error",
          "Error",
          getManifestErrorMessage(err, "No se pudo eliminar el manifiesto.")
        );
      }
    });
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Manifiesto" />
        <p className="py-16 text-center text-sm text-gray-500">Cargando manifiesto…</p>
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Manifiesto" />
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-500">{error ?? "Manifiesto no encontrado."}</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => router.push(basePath)}>
            Volver a manifiestos
          </Button>
        </div>
      </div>
    );
  }

  const editable = isManifestEditable(manifest.status);
  const transitions = availableManifestTransitions(manifest, {
    isSuperAdmin: isSuperAdminUser,
    branchOfficeId,
  });

  return (
    <div>
      <PageBreadcrumb pageTitle={`Manifiesto ${manifest.code}`} />

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">{manifest.code}</h3>
              <Badge size="sm" color={manifestStatusBadge(manifest.status)}>
                {manifestStatusLabel(manifest.status)}
              </Badge>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              {manifest.originBranchOfficeCode} &rarr; {manifest.destinationBranchOfficeCode}
            </p>
            <div className="mt-2 space-y-0.5 text-xs text-gray-500">
              <p>Creado el {formatDateTime(manifest.createdAt)}</p>
              {manifest.departureAt && (
                <p>Despachado el {formatDateTime(manifest.departureAt)}</p>
              )}
              {manifest.receivedAt && (
                <p>Recibido el {formatDateTime(manifest.receivedAt)}</p>
              )}
              {manifest.transportReference && <p>Transporte: {manifest.transportReference}</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => router.push(basePath)}>
              Volver
            </Button>
            {editable && (
              <Button size="sm" variant="outline" startIcon={<PlusIcon />} onClick={addModal.openModal}>
                Agregar envíos
              </Button>
            )}
            {transitions.length > 0 && (
              <Button size="sm" onClick={statusModal.openModal}>
                {manifest.status === "Open" ? "Despachar / Anular" : "Recibir lote"}
              </Button>
            )}
            {editable && manifest.shipmentCount === 0 && (
              <Button
                size="sm"
                variant="outline"
                disabled={deleting}
                onClick={handleDeleteManifest}
                startIcon={<TrashBinIcon />}
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Envíos" value={manifest.shipmentCount} />
        <Stat label="Peso total" value={`${(manifest.totalWeight ?? 0).toFixed(2)} kg`} />
        <Stat label="Bultos" value={manifest.totalPackageCount ?? 0} />
      </div>

      <ComponentCard
        title="Envíos del lote"
        desc={
          editable
            ? "Mientras el manifiesto esté abierto puedes agregar y quitar envíos. Al despacharlo, todos pasan a tránsito juntos."
            : "El manifiesto ya salió: su carga está cerrada."
        }
      >
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                <TableRow>
                  {["Guía", "Cliente", "Dirección", "Bultos", "Peso", "Estado", ""].map((h, i) => (
                    <TableCell
                      key={`${h}-${i}`}
                      isHeader
                      className="px-5 py-3 text-start text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {manifest.shipments.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-5 py-10 text-center text-sm text-gray-500">
                      El manifiesto está vacío. Agrégale los envíos que salen en este viaje.
                    </TableCell>
                  </TableRow>
                ) : (
                  manifest.shipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="px-5 py-3">
                        <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {shipment.code}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                        {shipment.clientFullName}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {shipment.clientAddress}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {shipment.packageCount}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {shipment.totalWeight} kg
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <Badge size="sm" color={shipmentStatusBadge(shipment.status)}>
                          {shipmentStatusLabel(shipment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openView(shipment.id)}
                            title="Ver detalle"
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300"
                          >
                            <EyeIcon className="size-4" />
                          </button>
                          {editable && (
                            <button
                              type="button"
                              disabled={removing}
                              onClick={() => handleRemoveShipment(shipment.id, shipment.code)}
                              title="Quitar del manifiesto"
                              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:hover:bg-error-500/10"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </ComponentCard>

      <Modal isOpen={addModal.isOpen} onClose={addModal.closeModal} className="m-4 max-w-[640px] z-50">
        {addModal.isOpen && (
          <AddShipmentsModal
            manifest={manifest}
            onClose={addModal.closeModal}
            onSaved={fetchManifest}
          />
        )}
      </Modal>

      <Modal isOpen={statusModal.isOpen} onClose={statusModal.closeModal} className="m-4 max-w-[520px] z-50">
        {statusModal.isOpen && (
          <ManifestStatusModal
            manifest={manifest}
            onClose={statusModal.closeModal}
            onSaved={fetchManifest}
          />
        )}
      </Modal>

      <Modal
        isOpen={viewModal.isOpen}
        onClose={viewModal.closeModal}
        className="max-w-[700px] m-4 z-50"
      >
        {viewModal.isOpen && (
          <ShipmentForm
            key={selectedShipmentId ?? "view"}
            mode="view"
            shipmentId={selectedShipmentId}
            onClose={viewModal.closeModal}
            onSaved={() => {}}
          />
        )}
      </Modal>
    </div>
  );
}
