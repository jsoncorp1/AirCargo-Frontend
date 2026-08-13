import { isConcurrencyConflict } from './apiErrorMessages';

/**
 * Reintenta una operación que el backend rechazó con `409 concurrency.conflict`.
 *
 * El 409 no es un error del usuario: la operación era válida, solo chocó con
 * otra que tocaba el mismo artículo. El backend garantiza que **no se guardó
 * nada** (ni la orden, ni el detalle, ni el descuento de stock), así que
 * reenviar el mismo payload no duplica nada y casi siempre funciona a la
 * segunda. Reintentar acá evita molestar al usuario con un error que se resuelve
 * solo.
 *
 * Si se agotan los intentos, se relanza el 409 para que quien llama muestre el
 * mensaje de conflicto y refresque los datos.
 */
export async function withConcurrencyRetry<T>(
  operation: () => Promise<T>,
  { attempts = 3, delayMs = 250 }: { attempts?: number; delayMs?: number } = {}
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      if (!isConcurrencyConflict(err)) throw err;
      lastError = err;
      if (attempt < attempts) {
        // Pequeña espera creciente para no volver a chocar con la misma
        // operación rival.
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}
