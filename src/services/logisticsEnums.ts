// Enums de la Fase 2 que cruzan más de un módulo.
//
// Viven acá y no dentro de un service porque los comparten varios: la modalidad
// del punto de servicio la usan la solicitud de recojo, la orden y el envío; la
// forma de pago la usan esos tres más la cuenta corriente; el vehículo lo usan
// el perfil del conductor, la tarifa de puerta y el cotizador.
//
// Como en el resto de la API, los enums VIAJAN COMO STRING ("Prepaid", no 0).

import type { BadgeColor } from './shipmentService';

// ─── Modalidad del punto de servicio ─────────────────────────────────────────
//
// De qué lado del mostrador ocurre cada punta del envío:
//   Branch → el cliente va a la sucursal (despacha o retira).
//   Door   → hay un conductor que va al domicilio.
//
// El ORIGEN no se elige en la orden ni en el esporádico: esos despachan siempre
// desde el mostrador. Un origen a domicilio es una solicitud de recojo.
export type ServicePointType = 'Branch' | 'Door';

export const SERVICE_POINT_TYPE_LABELS: Record<ServicePointType, string> = {
  Branch: 'En sucursal',
  Door: 'A domicilio',
};

export const servicePointTypeLabel = (value: ServicePointType | string): string =>
  SERVICE_POINT_TYPE_LABELS[value as ServicePointType] ?? value;

export const SERVICE_POINT_TYPE_OPTIONS: { value: ServicePointType; label: string }[] = [
  { value: 'Door', label: SERVICE_POINT_TYPE_LABELS.Door },
  { value: 'Branch', label: SERVICE_POINT_TYPE_LABELS.Branch },
];

// ─── Forma de pago ───────────────────────────────────────────────────────────
//
// Reemplaza al viejo `deliveryType`, con `OnAccount` como valor nuevo.
//   Prepaid        → ya está pagado.
//   CashOnDelivery → lo cobra el conductor en la puerta.
//   OnAccount      → va a la cuenta corriente de la empresa; solo si tiene
//                    `hasCreditAccount` y solo si hay empresa (un esporádico no
//                    tiene a quién fiarle: `billing.supplier.required`).
export type PaymentType = 'Prepaid' | 'CashOnDelivery' | 'OnAccount';

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  Prepaid: 'Pagado',
  CashOnDelivery: 'Por pagar',
  OnAccount: 'A cuenta',
};

export const paymentTypeLabel = (value: PaymentType | string): string =>
  PAYMENT_TYPE_LABELS[value as PaymentType] ?? value;

export const paymentTypeBadge = (value: PaymentType | string): BadgeColor => {
  switch (value) {
    case 'Prepaid':
      return 'success';
    case 'CashOnDelivery':
      return 'warning';
    case 'OnAccount':
      return 'info';
    default:
      return 'light';
  }
};

/**
 * Opciones para el selector de forma de pago.
 *
 * `OnAccount` solo se ofrece cuando hay una empresa con cuenta corriente
 * habilitada. Sin eso el backend rechaza con
 * `pickuporder.payment.creditnotallowed` / `orderdelivery.payment.creditnotallowed`
 * (empresa sin crédito) o `billing.supplier.required` (envío esporádico, que no
 * tiene empresa a la que cargarle el fiado).
 */
export function paymentTypeOptions(
  allowOnAccount: boolean
): { value: PaymentType; label: string }[] {
  const options: { value: PaymentType; label: string }[] = [
    { value: 'Prepaid', label: PAYMENT_TYPE_LABELS.Prepaid },
    { value: 'CashOnDelivery', label: PAYMENT_TYPE_LABELS.CashOnDelivery },
  ];
  if (allowOnAccount) {
    options.push({ value: 'OnAccount', label: PAYMENT_TYPE_LABELS.OnAccount });
  }
  return options;
}

// ─── Medio de pago ───────────────────────────────────────────────────────────
//
// Con qué se pagó el envío cuando es Prepaid (entró a la caja).
// Para los demás envíos no viaja o se manda en null.
export type PaymentMethod = 'Cash' | 'Qr';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash: 'Efectivo',
  Qr: 'QR',
};

export const paymentMethodLabel = (value: PaymentMethod | string): string =>
  PAYMENT_METHOD_LABELS[value as PaymentMethod] ?? value;

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'Cash', label: PAYMENT_METHOD_LABELS.Cash },
  { value: 'Qr', label: PAYMENT_METHOD_LABELS.Qr },
];

// ─── Vehículo ────────────────────────────────────────────────────────────────
//
// Define el cargo de puerta (una tarifa por departamento y por vehículo) y con
// qué conductores se puede cubrir un recojo: el backend valida que el vehículo
// del perfil coincida con el pedido (`drivertask.vehicle.mismatch`).
export type VehicleType = 'Motorcycle' | 'Car';

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  Motorcycle: 'Moto',
  Car: 'Auto',
};

export const vehicleTypeLabel = (value: VehicleType | string): string =>
  VEHICLE_TYPE_LABELS[value as VehicleType] ?? value;

export const VEHICLE_TYPE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: 'Motorcycle', label: VEHICLE_TYPE_LABELS.Motorcycle },
  { value: 'Car', label: VEHICLE_TYPE_LABELS.Car },
];

// ─── Formato de importes ─────────────────────────────────────────────────────

/** `Bs 124.00`. Un solo lugar para que ninguna pantalla invente su formato. */
export const formatBs = (value?: number | null): string =>
  typeof value === 'number' ? `Bs ${value.toFixed(2)}` : '—';
