import React from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import {
  PaymentType,
  PaymentMethod,
  PAYMENT_METHOD_OPTIONS,
  paymentTypeOptions,
} from "@/services/logisticsEnums";

interface GeneralInfoSectionProps {
  paymentType: PaymentType;
  setPaymentType: (val: PaymentType) => void;
  paymentMethod: PaymentMethod | "";
  setPaymentMethod: (val: PaymentMethod | "") => void;
  packageCount: number;
  setPackageCount: (val: number) => void;
  packageDescription: string;
  setPackageDescription: (val: string) => void;
  isExpress: boolean;
  setIsExpress: (val: boolean) => void;
  totalWeight: string;
  setTotalWeight: (val: string) => void;
  declaredValue: string;
  setDeclaredValue: (val: string) => void;
}

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const FORMAS_DE_PAGO = paymentTypeOptions(false);

export default function GeneralInfoSection({
  paymentType,
  setPaymentType,
  paymentMethod,
  setPaymentMethod,
  packageCount,
  setPackageCount,
  packageDescription,
  setPackageDescription,
  isExpress,
  setIsExpress,
  totalWeight,
  setTotalWeight,
  declaredValue,
  setDeclaredValue,
}: GeneralInfoSectionProps) {
  const handleDecimalChange = (setter: (val: string) => void, raw: string) => {
    // Solo permitir números y un punto decimal
    if (/^\d*\.?\d*$/.test(raw)) {
      setter(raw);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-bold">
          3
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Información General del Envío
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label required>Forma de Pago</Label>
          <select
            className={selectClassName}
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value as PaymentType)}
            required
          >
            {FORMAS_DE_PAGO.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {paymentType === "Prepaid" && (
          <div>
            <Label required>Medio de Cobro</Label>
            <select
              className={selectClassName}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              required
            >
              <option value="" disabled>Seleccione el medio de pago</option>
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className={paymentType !== "Prepaid" ? "sm:col-span-2 lg:col-span-2" : ""}>
          <Label required>Cantidad de Paquetes</Label>
          <Input
            type="number"
            min="1"
            value={packageCount}
            onChange={(e) => setPackageCount(parseInt(e.target.value) || 1)}
            required
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-2">
          <Label required>Descripción de Paquetes</Label>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                required
                placeholder="Ej. 3 cajas grandes con ropa"
              />
            </div>
            <div className="shrink-0 flex items-center h-11 px-3 rounded-lg border border-brand-200 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500/20">
              <Checkbox
                id="isExpress"
                label="Envío Expreso Prioritario"
                checked={isExpress}
                onChange={setIsExpress}
              />
            </div>
          </div>
        </div>

        <div className="sm:col-span-1 lg:col-span-1">
          <Label required>Peso Total (kg)</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={totalWeight}
            onChange={(e) => handleDecimalChange(setTotalWeight, e.target.value)}
            required
            placeholder="Ej. 15.5"
          />
        </div>

        <div className="sm:col-span-1 lg:col-span-1">
          <Label required={false}>
            Valor Declarado (Bs)
            <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
          </Label>
          <Input
            type="text"
            inputMode="decimal"
            value={declaredValue}
            onChange={(e) => handleDecimalChange(setDeclaredValue, e.target.value)}
            placeholder="Ej. 1500"
          />
        </div>
      </div>
    </div>
  );
}
