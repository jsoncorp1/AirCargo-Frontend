export type EnvioEstado = "Pendiente" | "Asignado" | "En Camino" | "Entregado" | "Cancelado";

export interface EnvioArticulo {
  articuloId: string;
  cantidad: number;
}

export interface Envio {
  id: string;
  empresaId: string;
  conductorId?: string; // Puede no estar asignado al inicio
  origen: string; // Ciudad/Departamento origen
  departamentoDestino: string; // Departamento destino en Bolivia
  direccionDestino: string;
  articulos: EnvioArticulo[];
  estado: EnvioEstado;
  fechaCreacion: string;
  fechaEstimadaEntrega?: string;
  costoTotal: number;
}

export const enviosIniciales: Envio[] = [
  {
    id: "env-1001",
    empresaId: "emp-1",
    conductorId: "cond-2", // Pedro Arce
    origen: "La Paz",
    departamentoDestino: "Santa Cruz",
    direccionDestino: "Parque Industrial, Manzano 5",
    articulos: [
      { articuloId: "art-1", cantidad: 50 },
      { articuloId: "art-2", cantidad: 100 },
    ],
    estado: "En Camino",
    fechaCreacion: "2025-07-14T10:00:00Z",
    fechaEstimadaEntrega: "2025-07-16T18:00:00Z",
    costoTotal: 1500,
  },
  {
    id: "env-1002",
    empresaId: "emp-2",
    conductorId: undefined, // Pendiente de asignación
    origen: "Santa Cruz",
    departamentoDestino: "Cochabamba",
    direccionDestino: "Av. Ayacucho Esq. Heroínas",
    articulos: [
      { articuloId: "art-5", cantidad: 20 },
      { articuloId: "art-6", cantidad: 30 },
    ],
    estado: "Pendiente",
    fechaCreacion: "2025-07-15T09:30:00Z",
    costoTotal: 800,
  },
  {
    id: "env-1003",
    empresaId: "emp-4",
    conductorId: "cond-1", // Juan Mamani
    origen: "Tarija",
    departamentoDestino: "La Paz",
    direccionDestino: "Zona Sur, Calacoto C. 21",
    articulos: [
      { articuloId: "art-9", cantidad: 1 },
      { articuloId: "art-11", cantidad: 500 },
    ],
    estado: "Asignado",
    fechaCreacion: "2025-07-15T14:15:00Z",
    fechaEstimadaEntrega: "2025-07-17T12:00:00Z",
    costoTotal: 2200,
  },
  {
    id: "env-1004",
    empresaId: "emp-5",
    conductorId: "cond-3",
    origen: "Oruro",
    departamentoDestino: "Potosí",
    direccionDestino: "Zona Central, Plaza Principal",
    articulos: [
      { articuloId: "art-12", cantidad: 2 },
      { articuloId: "art-13", cantidad: 40 },
    ],
    estado: "Entregado",
    fechaCreacion: "2025-07-10T08:00:00Z",
    fechaEstimadaEntrega: "2025-07-11T10:00:00Z",
    costoTotal: 500,
  },
];
