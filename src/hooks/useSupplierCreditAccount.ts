"use client";

import { useEffect, useState } from "react";
import { supplierService } from "@/services/supplierService";

interface CreditAccountState {
  /** `true` solo cuando se confirmó que la empresa tiene cuenta corriente. */
  hasCreditAccount: boolean;
  loading: boolean;
}

/**
 * Si una empresa puede fiar, para decidir si el selector de forma de pago
 * ofrece `OnAccount`.
 *
 * Arranca en `false` y se queda en `false` ante cualquier duda —sin empresa, o
 * si la consulta falla—. Es a propósito: ofrecer "a cuenta" cuando no
 * corresponde termina en un `*.payment.creditnotallowed` con el formulario ya
 * completo, mientras que no ofrecerlo solo obliga a elegir otra forma de pago.
 *
 * Un envío ESPORÁDICO nunca puede fiar (no tiene empresa a la que cargarle el
 * saldo): ahí ni siquiera hace falta preguntar.
 */
export function useSupplierCreditAccount(
  supplierId?: string | null
): CreditAccountState {
  const [hasCreditAccount, setHasCreditAccount] = useState(false);
  const [loading, setLoading] = useState(!!supplierId);

  useEffect(() => {
    if (!supplierId) {
      setHasCreditAccount(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const supplier = await supplierService.getSupplierById(supplierId);
        if (!cancelled) setHasCreditAccount(!!supplier.hasCreditAccount);
      } catch {
        if (!cancelled) setHasCreditAccount(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supplierId]);

  return { hasCreditAccount, loading };
}
