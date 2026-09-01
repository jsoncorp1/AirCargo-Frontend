"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useDestinationBranchOffices } from "@/hooks/useDestinationBranchOffices";
import {
  pickupOrderService,
  PickupOrder,
  getPickupOrderErrorMessage,
} from "@/services/pickupOrderService";
import { formatBs } from "@/services/logisticsEnums";
import type { QuoteRequest, QuoteResponse } from "@/services/pricingService";
import QuotePanel from "@/components/pricing/QuotePanel";
import PriceOverrideField, {
  PriceOverrideState,
  emptyPriceOverride,
  needsOverrideReason,
  priceOverridePayload,
} from "@/components/pricing/PriceOverrideField";

interface RecibirRecojoModalProps {
  pickupOrder: PickupOrder;
  onClose: () => void;
  onSaved: () => void;
}

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const DECIMAL_PATTERN = /^\d*\.?\d*$/;

/**
 * Recepción en mostrador: el paso que CREA el envío.
 *
 * Lo que se cobra es el peso de BALANZA, no el declarado. La pantalla pone los
 * dos al lado para que el operador vea la diferencia antes de confirmar: es el
 * momento en el que el estimado que se le prometió al cliente puede cambiar.
 */
export default function RecibirRecojoModal({
  pickupOrder,
  onClose,
  onSaved,
}: RecibirRecojoModalProps) {
  const { showToast } = useToast();
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const [totalWeight, setTotalWeight] = useState(String(pickupOrder.estimatedWeight));
  const [packageCount, setPackageCount] = useState(pickupOrder.packageCount);
  const [packageDescription, setPackageDescription] = useState(pickupOrder.packageDescription);
  const [destinationBranchOfficeId, setDestinationBranchOfficeId] = useState(
    pickupOrder.destinationBranchOfficeId ?? ""
  );
  const [priceOverride, setPriceOverride] = useState<PriceOverrideState>(emptyPriceOverride);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  const { branches } = useDestinationBranchOffices(pickupOrder.destinationDepartment);

  const parsedWeight = Number(totalWeight);
  const weightDiff = parsedWeight - pickupOrder.estimatedWeight;

  // Se recotiza con el peso de balanza: es el precio definitivo, no el estimado
  // que se le dio al cliente cuando pidió el recojo.
  const quoteRequest: QuoteRequest | null =
    !Number.isFinite(parsedWeight) || parsedWeight <= 0
      ? null
      : {
          supplierId: pickupOrder.supplierId ?? null,
          originDepartment: pickupOrder.originDepartment,
          destinationDepartment: pickupOrder.destinationDepartment,
          originPointType: "Door",
          destinationPointType: pickupOrder.destinationPointType,
          weight: parsedWeight,
          isExpress: pickupOrder.isExpress,
          vehicleType: pickupOrder.requestedVehicleType,
        };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      showToast("error", "Falta el peso", "Cargá el peso de balanza: es lo que se cobra.");
      return;
    }
    if (!packageDescription.trim()) {
      showToast("error", "Faltan datos", "Describí los bultos que estás recibiendo.");
      return;
    }
    // Sin el motivo el backend responde `shipment.priceoverride.reasonrequired`
    // y se pierde toda la carga.
    if (needsOverrideReason(priceOverride, quote?.total)) {
      showToast(
        "error",
        "Falta el motivo",
        "Cambiaste el precio calculado: indicá por qué antes de guardar."
      );
      return;
    }

    runSubmit(async () => {
      try {
        const res = await pickupOrderService.receive(pickupOrder.id, {
          totalWeight: parsedWeight,
          packageCount,
          packageDescription: packageDescription.trim(),
          destinationBranchOfficeId: destinationBranchOfficeId || null,
          ...priceOverridePayload(priceOverride, quote?.total),
        });
        showToast(
          "success",
          "Recojo recibido",
          `Se generó el envío ${res.shipmentCode} por ${formatBs(res.shippingPrice)}.`
        );
        onSaved();
        onClose();
      } catch (err: unknown) {
        showToast(
          "error",
          "Error",
          getPickupOrderErrorMessage(err, "No se pudo recibir el recojo.")
        );
      }
    });
  };

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="shrink-0 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Recibir y pesar
        </h4>
        <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {pickupOrder.code}
          </span>
          Con esto nace el envío y la solicitud queda cerrada.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
        {/* Lo declarado, para tenerlo al lado de lo real. */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-3 dark:border-gray-800 dark:bg-gray-800/40">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Peso declarado</p>
            <p className="text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">
              {pickupOrder.estimatedWeight} kg
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Bultos declarados</p>
            <p className="text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">
              {pickupOrder.packageCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Estimado prometido</p>
            <p className="text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">
              {formatBs(pickupOrder.estimatedPrice)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label required>Peso de balanza (kg)</Label>
            <Input
              value={totalWeight}
              onChange={(e) =>
                DECIMAL_PATTERN.test(e.target.value) && setTotalWeight(e.target.value)
              }
              inputMode="decimal"
            />
            {Number.isFinite(weightDiff) && Math.abs(weightDiff) > 0.001 && (
              <p
                className={`mt-1.5 text-xs ${
                  weightDiff > 0
                    ? "text-warning-600 dark:text-warning-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {weightDiff > 0 ? "+" : ""}
                {weightDiff.toFixed(2)} kg respecto de lo declarado.
              </p>
            )}
          </div>

          <div>
            <Label required>Bultos recibidos</Label>
            <Input
              type="number"
              min="1"
              value={packageCount}
              onChange={(e) => setPackageCount(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="sm:col-span-2">
            <Label required>Descripción de los bultos</Label>
            <Input
              value={packageDescription}
              onChange={(e) => setPackageDescription(e.target.value)}
            />
          </div>

          {/* Solo para CORREGIR la que declaró la solicitud. */}
          <div className="sm:col-span-2">
            <Label required={false}>
              Sucursal de destino
              <span className="ml-1 text-xs font-normal text-gray-400">
                (solo si hay que corregirla)
              </span>
            </Label>
            <select
              className={selectClassName}
              value={destinationBranchOfficeId}
              onChange={(e) => setDestinationBranchOfficeId(e.target.value)}
            >
              <option value="">La que declaró la solicitud</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.city}
                  {b.code ? ` — ${b.code}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PriceOverrideField
            value={priceOverride}
            onChange={setPriceOverride}
            calculatedPrice={quote?.total}
            disabled={submitting}
          />
          <QuotePanel request={quoteRequest} onQuote={setQuote} />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : "Recibir y generar guía"}
          </Button>
        </div>
      </form>
    </div>
  );
}
