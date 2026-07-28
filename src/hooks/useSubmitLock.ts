"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Evita que una acción asíncrona (guardar, eliminar, confirmar) se dispare dos
 * veces por un doble click.
 *
 * El cerrojo es un ref y no el estado `pending`: `pending` recién bloquea el
 * botón en el siguiente render, así que dos clicks en el mismo tick alcanzan a
 * entrar los dos. El ref se marca de forma síncrona y corta el segundo.
 *
 * Uso:
 *   const { pending, run } = useSubmitLock();
 *   const handleSave = (e) => { e.preventDefault(); run(async () => { ... }); };
 *   <Button type="submit" disabled={pending}>…</Button>
 */
export function useSubmitLock() {
  const lockRef = useRef(false);
  const [pending, setPending] = useState(false);

  const run = useCallback(async (action: () => Promise<unknown> | unknown) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setPending(true);
    try {
      await action();
    } finally {
      lockRef.current = false;
      setPending(false);
    }
  }, []);

  return { pending, run };
}
