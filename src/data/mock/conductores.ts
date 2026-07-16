export type ConductorEstado = "Disponible" | "En Ruta" | "Inactivo";

export interface Conductor {
  id: string;
  nombre: string;
  telefono: string;
  licencia: string;
  placaVehiculo: string;
  tipoVehiculo: string; // Ej: Camión 10T, Furgoneta, Camioneta
  estado: ConductorEstado;
  calificacion: number;
  fechaRegistro: string;
  fotoUrl?: string;
}

export const conductoresIniciales: Conductor[] = [
  {
    id: "cond-1",
    nombre: "Juan Mamani",
    telefono: "+591 71122334",
    licencia: "C-1029384",
    placaVehiculo: "1234-ABC",
    tipoVehiculo: "Camión 10T",
    estado: "Disponible",
    calificacion: 4.8,
    fechaRegistro: "2024-10-15",
    fotoUrl: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    id: "cond-2",
    nombre: "Pedro Arce",
    telefono: "+591 72233445",
    licencia: "B-2938471",
    placaVehiculo: "5678-DEF",
    tipoVehiculo: "Furgoneta 3T",
    estado: "En Ruta",
    calificacion: 4.5,
    fechaRegistro: "2024-11-02",
    fotoUrl: "https://randomuser.me/api/portraits/men/44.jpg"
  },
  {
    id: "cond-3",
    nombre: "Carlos Choque",
    telefono: "+591 73344556",
    licencia: "C-3847102",
    placaVehiculo: "9012-GHI",
    tipoVehiculo: "Camión 20T",
    estado: "Inactivo",
    calificacion: 4.9,
    fechaRegistro: "2025-01-10",
    fotoUrl: "https://randomuser.me/api/portraits/men/67.jpg"
  },
  {
    id: "cond-4",
    nombre: "Mario López",
    telefono: "+591 74455667",
    licencia: "B-4710293",
    placaVehiculo: "3456-JKL",
    tipoVehiculo: "Camioneta 1.5T",
    estado: "Disponible",
    calificacion: 4.2,
    fechaRegistro: "2025-02-20",
    fotoUrl: "https://randomuser.me/api/portraits/men/22.jpg"
  },
  {
    id: "cond-5",
    nombre: "Roberto Siles",
    telefono: "+591 75566778",
    licencia: "C-5829103",
    placaVehiculo: "7890-MNO",
    tipoVehiculo: "Camión 15T",
    estado: "Disponible",
    calificacion: 4.7,
    fechaRegistro: "2025-03-05",
    fotoUrl: "https://randomuser.me/api/portraits/men/85.jpg"
  },
];
