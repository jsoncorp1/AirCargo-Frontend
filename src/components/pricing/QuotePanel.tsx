"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  pricingService,
  QuoteRequest,
  QuoteResponse,
  isMissingRateError,
  getPricingErrorMessage,
} from "@/services/pricingService";
import { formatBs } from "@/services/logisticsEnums";

interface QuotePanelProps {
  /**
   * Los datos de la cotización. `null` mientras el formulario todavía no tiene
   * lo mínimo (ruta y peso): el panel muestra qué falta en vez de cotizar mal.
   */
  request: QuoteRequest | null;
  /** Se llama con la cotización vigente, o `null` si no hay una válida. */
  onQuote?: (quote: QuoteResponse | null) => void;
  className?: string;
}

/** Espera antes de cotizar: el peso se tipea dígito a dígito. */
const DEBOUNCE_MS = 450;

function Line({
  label,
  value,
  strong = false,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span
        className={
          strong
            ? "text-sm font-semibold text-gray-800 dark:text-white/90"
            : "text-sm text-gray-500 dark:text-gray-400"
        }
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${
          strong
            ? "text-lg font-bold text-gray-900 dark:text-white"
            : "text-sm font-medium text-gray-700 dark:text-gray-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Desglose de la tarifa vigente para una ruta.
 *
 * Muestra el DESGLOSE, no solo el total: el mostrador tiene que poder explicar
 * de dónde sale cada boliviano, y `chargeableKg` justifica el salto de precio
 * ("3.2 kg se cobran como 4").
 *
 * Cotizar no guarda nada, así que se puede llamar mientras el usuario completa
 * el formulario.
 */
export default function QuotePanel({ request, onQuote, className = "" }: QuotePanelProps) {
  const { isSuperAdminUser } = useAuth();

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingRate, setMissingRate] = useState(false);

  // `onQuote` suele ser una función nueva en cada render del padre; guardarla en
  // un ref evita re-cotizar solo porque el padre volvió a renderizar.
  const onQuoteRef = useRef(onQuote);
  onQuoteRef.current = onQuote;

  // La clave serializada es lo que dispara la cotización: así el efecto no
  // depende de la identidad del objeto `request`, que cambia en cada render.
  const requestKey = request ? JSON.stringify(request) : null;

  useEffect(() => {
    if (!requestKey) {
      setQuote(null);
      setError(null);
      setMissingRate(false);
      onQuoteRef.current?.(null);
      return;
    }

    const payload = JSON.parse(requestKey) as QuoteRequest;
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setMissingRate(false);
      try {
        const res = await pricingService.quote(payload);
        if (cancelled) return;
        setQuote(res);
        onQuoteRef.current?.(res);
      } catch (err) {
        if (cancelled) return;
        setQuote(null);
        onQuoteRef.current?.(null);
        setMissingRate(isMissingRateError(err));
        setError(getPricingErrorMessage(err, "No se pudo calcular el precio."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [requestKey]);

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40 ${className}`}
    >
      <h5 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-500">
        Precio según tarifa
      </h5>

      {!requestKey && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Completa la ruta y el peso para ver el precio.
        </p>
      )}

      {requestKey && loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Calculando…</p>
      )}

      {requestKey && !loading && error && (
        <div>
          <p className="text-sm text-error-500">{error}</p>
          {/* Que falte la tarifa no es un error del usuario: es un dato que
              nadie cargó. Solo el superadmin puede resolverlo. */}
          {missingRate && isSuperAdminUser && (
            <Link
              href="/tarifas"
              className="mt-2 inline-block text-sm font-medium text-brand-500 hover:underline"
            >
              Cargar la tarifa de esta ruta →
            </Link>
          )}
          {missingRate && !isSuperAdminUser && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Pídele al administrador que cargue la tarifa de esta ruta.
            </p>
          )}
        </div>
      )}

      {requestKey && !loading && !error && quote && (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <div className="pb-2">
            <Line
              label={
                <>
                  Flete
                  <span className="ml-1 text-xs text-gray-400">
                    ({quote.chargeableKg} kg facturables)
                  </span>
                </>
              }
              value={formatBs(quote.freight)}
            />
            {quote.pickupCharge > 0 && (
              <Line label="Recojo a domicilio" value={formatBs(quote.pickupCharge)} />
            )}
            {quote.deliveryCharge > 0 && (
              <Line label="Entrega a domicilio" value={formatBs(quote.deliveryCharge)} />
            )}
          </div>
          <div className="pt-2">
            <Line label="Total" value={formatBs(quote.total)} strong />
          </div>
        </div>
      )}
    </div>
  );
}
