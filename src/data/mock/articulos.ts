export type ArticuloEstado = "Activo" | "Inactivo";

export interface Articulo {
  id: string;
  nombre: string;
  sku: string;
  empresaId: string;
  precio: number;
  stock: number;
  estado: ArticuloEstado;
  imagenUrl?: string;
  fechaRegistro: string;
}

export const articulosIniciales: Articulo[] = [
  { id: "art-1", nombre: "Caja de cartón corrugado 40x30x30", sku: "CAJ-4030", empresaId: "emp-1", precio: 3.5, stock: 480, estado: "Activo", fechaRegistro: "2025-02-14" },
  { id: "art-2", nombre: "Cinta de embalaje transparente 48mm", sku: "CIN-048T", empresaId: "emp-1", precio: 4.2, stock: 220, estado: "Activo", fechaRegistro: "2025-02-14" },
  { id: "art-3", nombre: "Film stretch industrial 500mm", sku: "FIL-500I", empresaId: "emp-1", precio: 28.9, stock: 60, estado: "Activo", fechaRegistro: "2025-03-01" },
  { id: "art-4", nombre: "Guantes de nitrilo talla M (caja x100)", sku: "GNT-100M", empresaId: "emp-2", precio: 18.5, stock: 0, estado: "Inactivo", fechaRegistro: "2025-03-26" },
  { id: "art-5", nombre: "Casco de seguridad industrial", sku: "CAS-IND1", empresaId: "emp-2", precio: 32.0, stock: 75, estado: "Activo", fechaRegistro: "2025-04-05" },
  { id: "art-6", nombre: "Chaleco reflectivo naranja", sku: "CHA-REF1", empresaId: "emp-2", precio: 15.0, stock: 140, estado: "Activo", fechaRegistro: "2025-04-10" },
  { id: "art-7", nombre: "Pallet de madera 1.2x1.0m", sku: "PAL-1210", empresaId: "emp-3", precio: 45.0, stock: 30, estado: "Inactivo", fechaRegistro: "2024-11-12" },
  { id: "art-8", nombre: "Estante metálico 5 niveles", sku: "EST-5N01", empresaId: "emp-3", precio: 210.0, stock: 12, estado: "Inactivo", fechaRegistro: "2024-11-18" },
  { id: "art-9", nombre: "Carretilla hidráulica 2500kg", sku: "CAR-2500", empresaId: "emp-4", precio: 890.0, stock: 6, estado: "Activo", fechaRegistro: "2025-05-22" },
  { id: "art-10", nombre: "Faja transportadora modular 2m", sku: "FAJ-MOD2", empresaId: "emp-4", precio: 1450.0, stock: 3, estado: "Activo", fechaRegistro: "2025-05-28" },
  { id: "art-11", nombre: "Precinto de seguridad plástico", sku: "PRE-SEG1", empresaId: "emp-4", precio: 0.35, stock: 5000, estado: "Activo", fechaRegistro: "2025-06-04" },
  { id: "art-12", nombre: "Balanza electrónica 150kg", sku: "BAL-150E", empresaId: "emp-5", precio: 620.0, stock: 8, estado: "Activo", fechaRegistro: "2025-06-06" },
  { id: "art-13", nombre: "Caja plástica apilable 40L", sku: "CAJ-40PL", empresaId: "emp-5", precio: 22.0, stock: 95, estado: "Activo", fechaRegistro: "2025-06-12" },
  { id: "art-14", nombre: "Etiqueta térmica 10x15cm (rollo)", sku: "ETI-1015", empresaId: "emp-5", precio: 9.9, stock: 340, estado: "Activo", fechaRegistro: "2025-06-15" },
  { id: "art-15", nombre: "Lente de protección transparente", sku: "LEN-PROT", empresaId: "emp-6", precio: 7.5, stock: 200, estado: "Inactivo", fechaRegistro: "2024-09-18" },
  { id: "art-16", nombre: "Extintor PQS 6kg", sku: "EXT-PQS6", empresaId: "emp-6", precio: 85.0, stock: 18, estado: "Inactivo", fechaRegistro: "2024-09-20" },
  { id: "art-17", nombre: "Zuncho plástico 19mm (rollo)", sku: "ZUN-019P", empresaId: "emp-7", precio: 39.0, stock: 45, estado: "Activo", fechaRegistro: "2025-07-03" },
  { id: "art-18", nombre: "Caja de cartón para mudanza grande", sku: "CAJ-MUDG", empresaId: "emp-7", precio: 5.8, stock: 310, estado: "Activo", fechaRegistro: "2025-07-05" },
];
