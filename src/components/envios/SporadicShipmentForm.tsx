"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/context/ToastContext";
import {
  shipmentService,
  CreateSporadicShipmentRequest,
  SporadicShipmentResponse,
  SHIPMENT_ERROR_MESSAGES,
} from "@/services/shipmentService";
import { branchOfficeService, BranchOffice } from "@/services/branchOfficeService";
import { useAuth } from "@/context/AuthContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";

import SporadicShipmentSuccess from "./esporadico/SporadicShipmentSuccess";
import SenderSection from "./esporadico/SenderSection";
import DestinationSection from "./esporadico/DestinationSection";
import ArticlesSection, { SporadicLineFormState } from "./esporadico/ArticlesSection";

const DECIMAL_PATTERN = /^\d*\.?\d*$/;

const DEPARTAMENTOS = [
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
  const { branchOfficeCode, branchOfficeCity } = useAuth();
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const [result, setResult] = useState<SporadicShipmentResponse | null>(null);
  const [branchOffices, setBranchOffices] = useState<BranchOffice[]>([]);

  // Sender State
  const [senderFullName, setSenderFullName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");

  // Destination State
  const [destinationBranchOfficeId, setDestinationBranchOfficeId] = useState("");
  const [destinationDepartment, setDestinationDepartment] = useState(DEPARTAMENTOS[0].value);
  const [clientFullName, setClientFullName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState(TIPOS_ENTREGA[0].value);
  const [isExpress, setIsExpress] = useState(false);
  const [packageCount, setPackageCount] = useState(1);
  const [packageDescription, setPackageDescription] = useState("");

  // Articles State
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
  const handleRemoveLine = (index: number) => setLines(lines.filter((_, i) => i !== index));
  const handleLineChange = (index: number, field: keyof SporadicLineFormState, value: string | number) => {
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
    if (lines.length === 0) return showToast("error", "Error", "Debe agregar al menos un artículo.");
    if (lines.some((l) => !l.articleName.trim())) return showToast("error", "Error", "Todos los artículos deben tener un nombre.");
    if (lines.some((l) => l.quantity <= 0)) return showToast("error", "Error", "La cantidad debe ser mayor a cero en todos los artículos.");
    if (lines.some((l) => (Number(l.weight) || 0) <= 0)) return showToast("error", "Error", "El peso debe ser mayor a cero.");
    if (lines.some((l) => (Number(l.shippingCost) || 0) < 0)) return showToast("error", "Error", "El costo de envío no puede ser negativo.");
    if (!senderFullName.trim() || !senderPhone.trim()) return showToast("error", "Error", "Complete los datos del remitente.");
    if (packageCount <= 0) return showToast("error", "Error", "La cantidad de paquetes debe ser mayor a cero.");
    if (!packageDescription.trim()) return showToast("error", "Error", "Debe describir los paquetes del envío.");
    if (!destinationBranchOfficeId) return showToast("error", "Error", "Seleccione la sucursal de destino.");

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
        showToast("error", "Error", getErrorMessage(error, "No se pudo registrar el envío."));
      }
    });
  };

  if (result) {
    return (
      <SporadicShipmentSuccess
        result={result}
        onReset={() => {
          setResult(null);
          resetForm();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Registrar Envío de Mostrador</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Crea un envío rápido para clientes eventuales, sin necesidad de registrarlos como proveedores.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SenderSection
          senderFullName={senderFullName}
          setSenderFullName={setSenderFullName}
          senderPhone={senderPhone}
          setSenderPhone={setSenderPhone}
          originBranchLabel={originBranchLabel}
        />

        <DestinationSection
          clientFullName={clientFullName}
          setClientFullName={setClientFullName}
          clientPhone={clientPhone}
          setClientPhone={setClientPhone}
          destinationDepartment={destinationDepartment}
          setDestinationDepartment={setDestinationDepartment}
          destinationBranchOfficeId={destinationBranchOfficeId}
          setDestinationBranchOfficeId={setDestinationBranchOfficeId}
          clientAddress={clientAddress}
          setClientAddress={setClientAddress}
          deliveryType={deliveryType}
          setDeliveryType={setDeliveryType}
          isExpress={isExpress}
          setIsExpress={setIsExpress}
          packageCount={packageCount}
          setPackageCount={setPackageCount}
          packageDescription={packageDescription}
          setPackageDescription={setPackageDescription}
          branchOffices={branchOffices}
          departamentos={DEPARTAMENTOS}
          tiposEntrega={TIPOS_ENTREGA}
        />

        <ArticlesSection
          lines={lines}
          handleAddLine={handleAddLine}
          handleRemoveLine={handleRemoveLine}
          handleLineChange={handleLineChange}
          handleDecimalChange={handleDecimalChange}
          lineTotal={lineTotal}
          totalWeight={totalWeight}
          totalShippingCost={totalShippingCost}
          totalPrice={totalPrice}
        />

        <div className="flex items-center justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
            Limpiar Formulario
          </Button>
          <Button type="submit" disabled={submitting} className="bg-brand-500 text-white hover:bg-brand-600 px-8">
            {submitting ? "Procesando Envío..." : "Confirmar y Generar Guía"}
          </Button>
        </div>
      </form>
    </div>
  );
}
