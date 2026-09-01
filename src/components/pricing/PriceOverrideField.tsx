"use client";

import React from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { formatBs } from "@/services/logisticsEnums";

export interface PriceOverrideState {
  /** Vacío = se cobra la tarifa calculada. */
  price: string;
  reason: string;
}

export const emptyPriceOverride: PriceOverrideState = { price: "", reason: "" };

const PRICE_PATTERN = /^\d*\.?\d*$/;

/**
 * `true` cuando lo tipeado difiere de la tarifa calculada.
 *
 * Se compara con tolerancia porque el importe se tipea como texto: "94" y
 * "94.00" son el mismo precio y no deberían pedir un motivo.
 */
export function isOverridden(
  state: PriceOverrideState,
  calculatedPrice?: number | null
): boolean {
  const typed = state.price.trim();
  if (!typed) return false;
  const value = Number(typed);
  if (!Number.isFinite(value)) return false;
  if (typeof calculatedPrice !== "number") return true;
  return Math.abs(value - calculatedPrice) > 0.001;
}

/**
 * Los campos de precio listos para mandar.
 *
 * Cuando no hay ajuste, `shippingPrice` va en `null`: es la forma de decirle al
 * backend "manda la tarifa", en vez de repetirle un número que él ya calculó y
 * que podría haber cambiado entre que se cotizó y se guardó.
 */
export function priceOverridePayload(
  state: PriceOverrideState,
  calculatedPrice?: number | null
): { shippingPrice: number | null; priceOverrideReason: string | null } {
  if (!isOverridden(state, calculatedPrice)) {
    return { shippingPrice: null, priceOverrideReason: null };
  }
  return {
    shippingPrice: Number(state.price),
    priceOverrideReason: state.reason.trim() || null,
  };
}

/**
 * `true` cuando falta el motivo de un ajuste. Sin él el backend responde
 * `shipment.priceoverride.reasonrequired` y se pierde toda la carga, así que
 * conviene cortarlo antes de mandar.
 */
export function needsOverrideReason(
  state: PriceOverrideState,
  calculatedPrice?: number | null
): boolean {
  return isOverridden(state, calculatedPrice) && !state.reason.trim();
}

interface PriceOverrideFieldProps {
  value: PriceOverrideState;
  onChange: (next: PriceOverrideState) => void;
  /** Lo que dijo la tarifa. `null` mientras no se pudo cotizar. */
  calculatedPrice?: number | null;
  disabled?: boolean;
}

/**
 * Ajuste manual del precio, con el motivo en el MISMO formulario.
 *
 * El campo de motivo aparece recién cuando el importe difiere del calculado:
 * pedirlo siempre sería ruido en el 95% de las cargas, y no pedirlo nunca
 * termina en un 400 con el formulario entero completo.
 */
export default function PriceOverrideField({
  value,
  onChange,
  calculatedPrice,
  disabled = false,
}: PriceOverrideFieldProps) {
  const overridden = isOverridden(value, calculatedPrice);
  const missingReason = needsOverrideReason(value, calculatedPrice);

  const handlePriceChange = (raw: string) => {
    if (!PRICE_PATTERN.test(raw)) return;
    onChange({ ...value, price: raw });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label required={false}>
          Precio a cobrar
          <span className="ml-1 text-xs font-normal text-gray-400">
            (vacío = tarifa {formatBs(calculatedPrice)})
          </span>
        </Label>
        <Input
          value={value.price}
          onChange={(e) => handlePriceChange(e.target.value)}
          disabled={disabled}
          inputMode="decimal"
          placeholder={
            typeof calculatedPrice === "number" ? calculatedPrice.toFixed(2) : "0.00"
          }
        />
        {overridden && typeof calculatedPrice === "number" && (
          <p className="mt-1.5 text-xs text-warning-600 dark:text-warning-400">
            Tarifa {formatBs(calculatedPrice)} → se va a cobrar {formatBs(Number(value.price))}.
          </p>
        )}
      </div>

      {overridden && (
        <div>
          <Label required>Motivo del ajuste</Label>
          <Input
            value={value.reason}
            onChange={(e) => onChange({ ...value, reason: e.target.value })}
            disabled={disabled}
            error={missingReason}
            placeholder="Ej. Cliente frecuente, descuento autorizado"
            hint={
              missingReason
                ? "Sin el motivo no se puede guardar: queda registrado con tu correo."
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
