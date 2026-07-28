"use client";

import React, { useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/context/ToastContext";
import { TrashBinIcon, PlusIcon, CheckCircleIcon } from "@/icons";
import {
  shipmentService,
  CreateSporadicShipmentRequest,
  SporadicShipmentResponse,
  SHIPMENT_ERROR_MESSAGES,
} from "@/services/shipmentService";
import { branchOfficeService, BranchOffice } from "@/services/branchOfficeService";
import { useAuth } from "@/context/AuthContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";

// unitPrice/weight/shippingCost se guardan como string mientras se editan para
// permitir decimales en progreso (ej. "12.") sin que React los normalice a 0.
interface SporadicLineFormState {
  articleName: string;
  quantity: number;
  unitPrice: string;
  weight: string;
  shippingCost: string;
}

const DECIMAL_PATTERN = /^\d*\.?\d*$/;

const DEPARTAMENTOS: { value: string; label: string }[] = [
  { value: "Beni", label: "Beni" },
  { value: "Chuquisaca", label: "Chuquisaca" },
  { value: "Cochabamba", label: "Cochabamba" },
  { value: "LaPaz", label: "La Paz" },
  { value: "Oruro", label: "Oruro" },
  { value: "Pando", label: "Pando" },
  { value: "Potosi", label: "Potosí" },
  { value: "SantaCruz", label: "Santa Cruz" },
  { value: "Tarija", label: "Tarija" },
];

const TIPOS_ENTREGA = [
  { value: "Prepaid", label: "Pagada" },
  { value: "CashOnDelivery", label: "Por Pagar" },
];

const emptyLine = (): SporadicLineFormState => ({
  articleName: "",
  quantity: 1,
  unitPrice: "0",
  weight: "0",
  shippingCost: "0",
});

// El backend devuelve el mensaje real en `message` (title/detail del ProblemDetails),
// pero como no es una instancia de Error hay que leerlo así en vez de `instanceof Error`.
function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim().length > 0) {
      return SHIPMENT_ERROR_MESSAGES[msg] ?? msg;
    }
  }
  return fallback;
}

export default function SporadicShipmentForm() {
  const { showToast } = useToast();
  // El origen del envío es la sucursal del usuario que lo registra; acá solo se
  // muestra como dato informativo.
  const { branchOfficeCode, branchOfficeCity } = useAuth();

  // Cerrojo: bloquea el botón mientras la petición está en curso (y corta el
  // segundo click del doble click, que registraría dos envíos).
  const { pending: submitting, run: runSubmit } = useSubmitLock();
  const [result, setResult] = useState<SporadicShipmentResponse | null>(null);

  const [branchOffices, setBranchOffices] = useState<BranchOffice[]>([]);
  const [destinationBranchOfficeId, setDestinationBranchOfficeId] = useState("");

  const [senderFullName, setSenderFullName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");

  const [destinationDepartment, setDestinationDepartment] = useState(DEPARTAMENTOS[0].value);
  const [clientFullName, setClientFullName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState(TIPOS_ENTREGA[0].value);
  const [isExpress, setIsExpress] = useState(false);

  const [packageCount, setPackageCount] = useState(1);
  const [packageDescription, setPackageDescription] = useState("");

  const [lines, setLines] = useState<SporadicLineFormState[]>([emptyLine()]);

  const originBranchLabel = [branchOfficeCode, branchOfficeCity].filter(Boolean).join(" — ");

  useEffect(() => {
    const fetchBranchOffices = async () => {
      try {
        const res = await branchOfficeService.getBranchOffices(1, 100);
        setBranchOffices(res.data);
      } catch (err) {
        console.error(err);
        showToast("error", "Error", "No se pudieron cargar las sucursales.");
      }
    };
    fetchBranchOffices();
  }, [showToast]);

  const resetForm = () => {
    setDestinationBranchOfficeId("");
    setSenderFullName("");
    setSenderPhone("");
    setDestinationDepartment(DEPARTAMENTOS[0].value);
    setClientFullName("");
    setClientPhone("");
    setClientAddress("");
    setDeliveryType(TIPOS_ENTREGA[0].value);
    setIsExpress(false);
    setPackageCount(1);
    setPackageDescription("");
    setLines([emptyLine()]);
  };

  const handleAddLine = () => setLines([...lines, emptyLine()]);

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (
    index: number,
    field: keyof SporadicLineFormState,
    value: string | number
  ) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value } as SporadicLineFormState;
    setLines(newLines);
  };

  const handleDecimalChange = (index: number, field: "unitPrice" | "weight" | "shippingCost", raw: string) => {
    if (!DECIMAL_PATTERN.test(raw)) return;
    handleLineChange(index, field, raw);
  };

  const lineTotal = (line: SporadicLineFormState) => line.quantity * (Number(line.unitPrice) || 0);

  const totalPrice = lines.reduce((acc, line) => acc + lineTotal(line), 0);
  const totalWeight = lines.reduce((acc, line) => acc + (Number(line.weight) || 0), 0);
  const totalShippingCost = lines.reduce((acc, line) => acc + (Number(line.shippingCost) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      showToast("error", "Error", "Debe agregar al menos un artículo.");
      return;
    }
    if (lines.some((l) => !l.articleName.trim())) {
      showToast("error", "Error", "Todos los artículos deben tener un nombre.");
      return;
    }
    if (lines.some((l) => l.quantity <= 0)) {
      showToast("error", "Error", "La cantidad debe ser mayor a cero en todos los artículos.");
      return;
    }
    if (lines.some((l) => (Number(l.weight) || 0) <= 0)) {
      showToast("error", "Error", "El peso debe ser mayor a cero en todos los artículos.");
      return;
    }
    if (lines.some((l) => (Number(l.shippingCost) || 0) < 0)) {
      showToast("error", "Error", "El costo de envío no puede ser negativo.");
      return;
    }
    if (!senderFullName.trim() || !senderPhone.trim()) {
      showToast("error", "Error", "Debe completar los datos del remitente.");
      return;
    }
    if (packageCount <= 0) {
      showToast("error", "Error", "La cantidad de paquetes debe ser mayor a cero.");
      return;
    }
    if (!packageDescription.trim()) {
      showToast("error", "Error", "Debe describir los paquetes del envío.");
      return;
    }
    if (!destinationBranchOfficeId) {
      showToast("error", "Error", "Debe seleccionar la sucursal de destino.");
      return;
    }

    runSubmit(async () => {
      try {
        const payload: CreateSporadicShipmentRequest = {
          destinationBranchOfficeId,
          senderFullName: senderFullName.trim(),
          senderPhone: senderPhone.trim(),
          senderAddress: "",
          destinationDepartment,
          clientPhone,
          clientFullName,
          clientAddress,
          deliveryType,
          isExpress,
          packageCount,
          packageDescription: packageDescription.trim(),
          lines: lines.map((l) => ({
            articleName: l.articleName.trim(),
            quantity: l.quantity,
            unitPrice: Number(l.unitPrice) || 0,
            weight: Number(l.weight) || 0,
            shippingCost: Number(l.shippingCost) || 0,
          })),
        };
        const response = await shipmentService.createSporadicShipment(payload);
        setResult(response);
        showToast("success", "Envío registrado", `Guía generada: ${response.code}`);
      } catch (error: unknown) {
        showToast("error", "Error", getErrorMessage(error, "No se pudo registrar el envío esporádico."));
      }
    });
  };

  if (result) {
    return (
      <ComponentCard title="Envío Esporádico Registrado">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-50 dark:bg-success-500/10">
            <CheckCircleIcon className="size-7 text-success-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Código de guía generado</p>
            <p className="text-2xl font-bold tracking-wide text-gray-800 dark:text-white/90">{result.code}</p>
            {result.isExpress && (
              <div className="mt-2">
                <Badge size="sm" color="warning">Expreso</Badge>
              </div>
            )}
          </div>

          <div className="grid w-full max-w-md grid-cols-3 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
            <div>
              <p className="text-xs text-gray-400">Total</p>
              <p className="font-semibold text-gray-800 dark:text-white/90">Bs {result.totalPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Peso</p>
              <p className="font-semibold text-gray-800 dark:text-white/90">{result.totalWeight.toFixed(2)} kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Envío</p>
              <p className="font-semibold text-gray-800 dark:text-white/90">Bs {result.shippingPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Paquetes</p>
              <p className="font-semibold text-gray-800 dark:text-white/90">{result.packageCount}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400">Descripción</p>
              <p className="font-semibold text-gray-800 dark:text-white/90">{result.packageDescription}</p>
            </div>
          </div>

          <Button
            onClick={() => {
              setResult(null);
              resetForm();
            }}
          >
            Registrar otro envío
          </Button>
        </div>
      </ComponentCard>
    );
  }

  return (
    <ComponentCard
      title="Registrar Envío Esporádico"
      desc="Para clientes de mostrador sin proveedor ni artículos de inventario asociados. Se crea la orden y la guía en un solo paso."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h5 className="mb-4 text-sm font-semibold text-brand-500 uppercase tracking-wider">Origen y Remitente</h5>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label required>Nombre del Remitente</Label>
              <Input
                value={senderFullName}
                onChange={(e) => setSenderFullName(e.target.value)}
                required
                placeholder="Ej. María Gómez"
              />
            </div>

            <div>
              <Label required>Teléfono del Remitente</Label>
              <Input
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                required
                placeholder="Ej. +591 7XXXXXXX"
              />
            </div>

            {/* El origen ya no se elige: el backend lo toma de la sucursal del
                usuario que registra el envío. */}
            <div>
              <Label>Sucursal de Origen</Label>
              <Input value={originBranchLabel || "Sin sucursal asignada"} disabled />
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Se toma de tu sucursal; no se puede cambiar.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800"></div>

        <div>
          <h5 className="mb-4 text-sm font-semibold text-brand-500 uppercase tracking-wider">Datos del Cliente y Destino</h5>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <Label required>Nombre del Cliente</Label>
              <Input
                value={clientFullName}
                onChange={(e) => setClientFullName(e.target.value)}
                required
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div>
              <Label required>Teléfono</Label>
              <Input
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                required
                placeholder="Ej. +591 7XXXXXXX"
              />
            </div>

            <div>
              <Label required>Departamento de Destino</Label>
              <select
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={destinationDepartment}
                onChange={(e) => setDestinationDepartment(e.target.value)}
                required
              >
                {DEPARTAMENTOS.map((dep) => (
                  <option key={dep.value} value={dep.value}>{dep.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label required>Sucursal de Destino</Label>
              <select
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={destinationBranchOfficeId}
                onChange={(e) => setDestinationBranchOfficeId(e.target.value)}
                required
              >
                <option value="" disabled>Seleccione la sucursal</option>
                {branchOffices.map((b) => (
                  <option key={b.id} value={b.id}>{b.code} — {b.city}</option>
                ))}
              </select>
            </div>

            <div>
              <Label required>Tipo de Entrega</Label>
              <select
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value)}
                required
              >
                {TIPOS_ENTREGA.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-2.5">
              <Checkbox
                id="isExpress"
                label="Envío Expreso"
                checked={isExpress}
                onChange={setIsExpress}
              />
            </div>

            <div className="sm:col-span-3">
              <Label required>Dirección Exacta</Label>
              <Input
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                required
                placeholder="Ej. Av. Principal #123, Zona Sur"
              />
            </div>

            <div>
              <Label required>Cantidad de Paquetes</Label>
              <Input
                type="number"
                min="1"
                value={packageCount}
                onChange={(e) => setPackageCount(parseInt(e.target.value) || 1)}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <Label required>Descripción de Paquetes</Label>
              <Input
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                required
                placeholder="Ej. 3 cajas"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800"></div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-sm font-semibold text-brand-500 uppercase tracking-wider">Artículos y Envío</h5>
            <button
              type="button"
              onClick={handleAddLine}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              <PlusIcon className="size-4" /> Agregar Artículo
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800/40">
                  <TableRow>
                    <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Artículo
                    </TableCell>
                    <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Cant.
                    </TableCell>
                    <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      P. Unit.
                    </TableCell>
                    <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Peso (kg)
                    </TableCell>
                    <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Costo Envío
                    </TableCell>
                    <TableCell isHeader className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Total
                    </TableCell>
                    <TableCell isHeader className="w-11 px-3 py-2">{null}</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {lines.map((line, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="min-w-[160px] px-3 py-2">
                        <Input
                          value={line.articleName}
                          onChange={(e) => handleLineChange(idx, "articleName", e.target.value)}
                          required
                          placeholder="Ej. Caja de zapatos"
                          className="!h-9"
                        />
                      </TableCell>
                      <TableCell className="w-20 px-3 py-2">
                        <Input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(idx, "quantity", parseInt(e.target.value) || 1)}
                          required
                          className="!h-9"
                        />
                      </TableCell>
                      <TableCell className="w-28 px-3 py-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={line.unitPrice}
                          onChange={(e) => handleDecimalChange(idx, "unitPrice", e.target.value)}
                          required
                          className="!h-9"
                        />
                      </TableCell>
                      <TableCell className="w-24 px-3 py-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={line.weight}
                          onChange={(e) => handleDecimalChange(idx, "weight", e.target.value)}
                          required
                          className="!h-9"
                        />
                      </TableCell>
                      <TableCell className="w-28 px-3 py-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={line.shippingCost}
                          onChange={(e) => handleDecimalChange(idx, "shippingCost", e.target.value)}
                          required
                          className="!h-9"
                        />
                      </TableCell>
                      <TableCell className="w-28 px-3 py-2 text-right text-sm font-medium text-gray-800 dark:text-white/90">
                        Bs {lineTotal(line).toFixed(2)}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right">
                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 transition-colors dark:hover:bg-error-500/10 dark:hover:text-error-400"
                          >
                            <TrashBinIcon className="size-4" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Peso Total</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{totalWeight.toFixed(2)} kg</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Costo Envío</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">Bs {totalShippingCost.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 dark:border-brand-800 dark:bg-brand-900/20">
              <p className="text-xs font-medium text-brand-600 uppercase tracking-wider dark:text-brand-400">Total (Cliente)</p>
              <p className="text-lg font-bold text-brand-800 dark:text-brand-200">Bs {(totalPrice + totalShippingCost).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Registrando..." : "Registrar Envío"}
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
