"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import { useToast } from "@/context/ToastContext";
import {
  shipmentService,
  CreateSporadicShipmentRequest,
  SporadicShipmentResponse,
  getShipmentErrorMessage,
} from "@/services/shipmentService";
import { branchOfficeService, BranchOffice } from "@/services/branchOfficeService";
import {
  BOLIVIAN_DEPARTMENT_LABELS,
  BolivianDepartment,
} from "@/services/supplierService";
import {
  PaymentType,
  ServicePointType,
  VehicleType,
  VEHICLE_TYPE_OPTIONS,
} from "@/services/logisticsEnums";
import type { QuoteRequest, QuoteResponse } from "@/services/pricingService";
import QuotePanel from "@/components/pricing/QuotePanel";
import PriceOverrideField, {
  PriceOverrideState,
  emptyPriceOverride,
  needsOverrideReason,
  priceOverridePayload,
} from "@/components/pricing/PriceOverrideField";
import { useAuth } from "@/context/AuthContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";

import SporadicShipmentSuccess from "./esporadico/SporadicShipmentSuccess";
import SenderSection from "./esporadico/SenderSection";
import DestinationSection from "./esporadico/DestinationSection";
import ArticlesSection, { SporadicLineFormState } from "./esporadico/ArticlesSection";

const DECIMAL_PATTERN = /^\d*\.?\d*$/;

const DEPARTAMENTOS = (
  Object.entries(BOLIVIAN_DEPARTMENT_LABELS) as [BolivianDepartment, string][]
).map(([value, label]) => ({ value, label }));

const DEFAULT_DEPARTMENT = DEPARTAMENTOS[0].value;

const emptyLine = (): SporadicLineFormState => ({
  articleName: "",
  quantity: 1,
  unitPrice: "0",
  weight: "0",
});

export default function SporadicShipmentForm() {
  const { showToast } = useToast();
  // El superadmin es global: elige desde qué sucursal atiende el mostrador.
  const { isSuperAdminUser, branchOfficeLabel } = useAuth();
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const [result, setResult] = useState<SporadicShipmentResponse | null>(null);
  const [branchOffices, setBranchOffices] = useState<BranchOffice[]>([]);

  // Sender State
  const [senderFullName, setSenderFullName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [originBranchOfficeId, setOriginBranchOfficeId] = useState("");

  // Destination State
  const [destinationBranchOfficeId, setDestinationBranchOfficeId] = useState("");
  const [destinationDepartment, setDestinationDepartment] =
    useState<string>(DEFAULT_DEPARTMENT);
  const [destinationPointType, setDestinationPointType] = useState<ServicePointType>("Door");
  const [clientFullName, setClientFullName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientPhoneAlt, setClientPhoneAlt] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [destinationLocationUrl, setDestinationLocationUrl] = useState("");
  const [destinationAddressReference, setDestinationAddressReference] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("Prepaid");
  const [isExpress, setIsExpress] = useState(false);
  const [packageCount, setPackageCount] = useState(1);
  const [packageDescription, setPackageDescription] = useState("");

  // Precio: sale de la tarifa vigente. Esto es solo el vehículo que define el
  // cargo de puerta y el ajuste manual con su motivo.
  const [deliveryVehicleType, setDeliveryVehicleType] = useState<VehicleType>("Motorcycle");
  const [priceOverride, setPriceOverride] = useState<PriceOverrideState>(emptyPriceOverride);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  // Articles State
  const [lines, setLines] = useState<SporadicLineFormState[]>([emptyLine()]);

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
    setOriginBranchOfficeId("");
    setSenderFullName("");
    setSenderPhone("");
    setDestinationDepartment(DEFAULT_DEPARTMENT);
    setDestinationPointType("Door");
    setClientFullName("");
    setClientPhone("");
    setClientPhoneAlt("");
    setClientAddress("");
    setDestinationLocationUrl("");
    setDestinationAddressReference("");
    setPaymentType("Prepaid");
    setIsExpress(false);
    setPackageCount(1);
    setPackageDescription("");
    setDeliveryVehicleType("Motorcycle");
    setPriceOverride(emptyPriceOverride);
    setLines([emptyLine()]);
  };

  const handleAddLine = () => setLines([...lines, emptyLine()]);
  const handleRemoveLine = (index: number) => setLines(lines.filter((_, i) => i !== index));
  const handleLineChange = (
    index: number,
    field: keyof SporadicLineFormState,
    value: string | number
  ) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value } as SporadicLineFormState;
    setLines(newLines);
  };
  const handleDecimalChange = (
    index: number,
    field: "unitPrice" | "weight",
    raw: string
  ) => {
    if (!DECIMAL_PATTERN.test(raw)) return;
    handleLineChange(index, field, raw);
  };

  const lineTotal = (line: SporadicLineFormState) =>
    line.quantity * (Number(line.unitPrice) || 0);
  const totalPrice = lines.reduce((acc, line) => acc + lineTotal(line), 0);
  const totalWeight = lines.reduce((acc, line) => acc + (Number(line.weight) || 0), 0);

  // El origen de un esporádico es SIEMPRE el mostrador: un origen a domicilio
  // es una solicitud de recojo, no un envío que se registra acá.
  const originDepartment = branchOffices.find(
    (b) => b.id === originBranchOfficeId
  )?.bolivianDepartment;

  const quoteRequest: QuoteRequest | null =
    !destinationDepartment || totalWeight <= 0 || (isSuperAdminUser && !originDepartment)
      ? null
      : {
          // Un esporádico no tiene empresa: cotiza con la tarifa pública.
          supplierId: null,
          originDepartment: (originDepartment ??
            destinationDepartment) as BolivianDepartment,
          destinationDepartment,
          originPointType: "Branch",
          destinationPointType,
          weight: totalWeight,
          isExpress,
          vehicleType: deliveryVehicleType,
        };

  const chargesDoorService = destinationPointType === "Door";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) return showToast("error", "Error", "Debe agregar al menos un artículo.");
    if (lines.some((l) => !l.articleName.trim())) return showToast("error", "Error", "Todos los artículos deben tener un nombre.");
    if (lines.some((l) => l.quantity <= 0)) return showToast("error", "Error", "La cantidad debe ser mayor a cero en todos los artículos.");
    if (lines.some((l) => (Number(l.weight) || 0) <= 0)) return showToast("error", "Error", "El peso debe ser mayor a cero.");
    if (!senderFullName.trim() || !senderPhone.trim()) return showToast("error", "Error", "Complete los datos del remitente.");
    if (packageCount <= 0) return showToast("error", "Error", "La cantidad de paquetes debe ser mayor a cero.");
    if (!packageDescription.trim()) return showToast("error", "Error", "Debe describir los paquetes del envío.");
    if (!destinationBranchOfficeId) return showToast("error", "Error", "Seleccione la sucursal de destino.");
    if (chargesDoorService && !clientAddress.trim())
      return showToast("error", "Error", "Si la entrega es a domicilio, indique la dirección.");
    if (isSuperAdminUser && !originBranchOfficeId)
      return showToast("error", "Error", "Seleccione la sucursal de origen.");
    // Sin el motivo el backend responde `shipment.priceoverride.reasonrequired`
    // y se pierde toda la carga del formulario.
    if (needsOverrideReason(priceOverride, quote?.total))
      return showToast(
        "error",
        "Falta el motivo",
        "Cambiaste el precio calculado: indica por qué antes de guardar."
      );

    runSubmit(async () => {
      try {
        const payload: CreateSporadicShipmentRequest = {
          // Se manda siempre: el backend lo ignora para admin/conductor.
          originBranchOfficeId: originBranchOfficeId || null,
          destinationBranchOfficeId,
          senderFullName: senderFullName.trim(),
          senderPhone: senderPhone.trim(),
          senderAddress: "",
          destinationDepartment,
          destinationPointType,
          clientPhone,
          clientPhoneAlt: clientPhoneAlt.trim() || null,
          clientFullName,
          clientAddress,
          destinationLocationUrl: destinationLocationUrl.trim() || null,
          destinationAddressReference: destinationAddressReference.trim() || null,
          paymentType,
          isExpress,
          packageCount,
          packageDescription: packageDescription.trim(),
          deliveryVehicleType,
          ...priceOverridePayload(priceOverride, quote?.total),
          lines: lines.map((l) => ({
            articleName: l.articleName.trim(),
            quantity: l.quantity,
            unitPrice: Number(l.unitPrice) || 0,
            weight: Number(l.weight) || 0,
          })),
        };
        const response = await shipmentService.createSporadicShipment(payload);
        setResult(response);
        showToast("success", "Envío registrado", `Guía generada: ${response.code}`);
      } catch (error: unknown) {
        showToast("error", "Error", getShipmentErrorMessage(error, "No se pudo registrar el envío."));
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
          originBranchLabel={branchOfficeLabel}
          canChooseOriginBranch={isSuperAdminUser}
          branchOffices={branchOffices}
          originBranchOfficeId={originBranchOfficeId}
          setOriginBranchOfficeId={setOriginBranchOfficeId}
        />

        <DestinationSection
          clientFullName={clientFullName}
          setClientFullName={setClientFullName}
          clientPhone={clientPhone}
          setClientPhone={setClientPhone}
          clientPhoneAlt={clientPhoneAlt}
          setClientPhoneAlt={setClientPhoneAlt}
          destinationDepartment={destinationDepartment}
          setDestinationDepartment={setDestinationDepartment}
          destinationBranchOfficeId={destinationBranchOfficeId}
          setDestinationBranchOfficeId={setDestinationBranchOfficeId}
          destinationPointType={destinationPointType}
          setDestinationPointType={setDestinationPointType}
          clientAddress={clientAddress}
          setClientAddress={setClientAddress}
          destinationLocationUrl={destinationLocationUrl}
          setDestinationLocationUrl={setDestinationLocationUrl}
          destinationAddressReference={destinationAddressReference}
          setDestinationAddressReference={setDestinationAddressReference}
          paymentType={paymentType}
          setPaymentType={setPaymentType}
          isExpress={isExpress}
          setIsExpress={setIsExpress}
          packageCount={packageCount}
          setPackageCount={setPackageCount}
          packageDescription={packageDescription}
          setPackageDescription={setPackageDescription}
          branchOffices={branchOffices}
          departamentos={DEPARTAMENTOS}
        />

        <ArticlesSection
          lines={lines}
          handleAddLine={handleAddLine}
          handleRemoveLine={handleRemoveLine}
          handleLineChange={handleLineChange}
          handleDecimalChange={handleDecimalChange}
          lineTotal={lineTotal}
          totalWeight={totalWeight}
          totalPrice={totalPrice}
        />

        {/* Precio: sale de la tarifa vigente, no se carga a mano. */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-bold">
              4
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Precio del Envío
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              {/* El vehículo define el cargo de puerta, así que solo se pregunta
                  cuando hay puerta que cobrar. */}
              {chargesDoorService ? (
                <div>
                  <Label required>Vehículo para la entrega</Label>
                  <select
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    value={deliveryVehicleType}
                    onChange={(e) => setDeliveryVehicleType(e.target.value as VehicleType)}
                  >
                    {VEHICLE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    El auto cuesta más que la moto: elegí el que realmente va a ir.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  El cliente retira en sucursal, así que no se cobra viaje a domicilio.
                </p>
              )}

              <PriceOverrideField
                value={priceOverride}
                onChange={setPriceOverride}
                calculatedPrice={quote?.total}
                disabled={submitting}
              />
            </div>

            <QuotePanel request={quoteRequest} onQuote={setQuote} />
          </div>
        </div>

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
