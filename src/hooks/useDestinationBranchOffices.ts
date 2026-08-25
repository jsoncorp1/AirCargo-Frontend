"use client";

import { useEffect, useState } from "react";
import { BranchOffice, branchOfficeService } from "@/services/branchOfficeService";
import { BolivianDepartment } from "@/services/supplierService";

const FAILED = "failed" as const;

type Resolved = Record<string, BranchOffice[] | typeof FAILED>;

/**
 * Sucursales del departamento de destino, para el segundo paso de la cascada.
 *
 * Pide `?department=` en vez de traer toda la red y filtrar en memoria, así no
 * hay que asumir que `perPage=100` alcanza. Guarda el resultado por
 * departamento para que volver a uno ya consultado no dispare otra request.
 *
 * `branches`, `loading` y `unavailable` se derivan en el render de ese mismo
 * mapa: el efecto solo escribe estado desde los callbacks del fetch, nunca de
 * forma síncrona, que es lo que dispara renders en cascada.
 */
export function useDestinationBranchOffices(
  department: BolivianDepartment | undefined
) {
  const [resolved, setResolved] = useState<Resolved>({});

  const entry = department ? resolved[department] : undefined;
  const branches = Array.isArray(entry) ? entry : [];
  // `/branch-offices` ya acepta al rol usuarioempresa, pero si alguna vez
  // vuelve a dar 403 el formulario tiene que seguir siendo usable sin selector.
  const unavailable = entry === FAILED;
  const loading = Boolean(department) && entry === undefined;

  useEffect(() => {
    if (!department || entry !== undefined) return;

    let cancelled = false;

    branchOfficeService
      .getBranchOffices(1, 100, department)
      .then((res) => {
        if (cancelled) return;
        setResolved((prev) => ({ ...prev, [department]: res.data }));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setResolved((prev) => ({ ...prev, [department]: FAILED }));
      });

    return () => {
      cancelled = true;
    };
  }, [department, entry]);

  return { branches, loading, unavailable };
}
