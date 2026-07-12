export type EmpresaEstado = "Activo" | "Inactivo";

export interface Empresa {
  id: string;
  nombre: string;
  ruc: string;
  contacto: string;
  telefono: string;
  email: string;
  ciudad: string;
  direccion: string;
  estado: EmpresaEstado;
  fechaRegistro: string;
  logoUrl?: string;
}

export const empresasIniciales: Empresa[] = [
  {
    id: "emp-1",
    nombre: "Distribuidora Andina S.A.",
    ruc: "20481029384",
    contacto: "Rosa Medina",
    telefono: "+51 987 111 222",
    email: "contacto@distandina.com",
    ciudad: "Lima",
    direccion: "Av. Argentina 1450, Callao",
    estado: "Activo",
    fechaRegistro: "2025-02-10",
  },
  {
    id: "emp-2",
    nombre: "Importadora del Pacífico E.I.R.L.",
    ruc: "20558471023",
    contacto: "Jorge Salcedo",
    telefono: "+51 987 333 444",
    email: "ventas@impacifico.pe",
    ciudad: "Lima",
    direccion: "Jr. Los Sauces 220, San Isidro",
    estado: "Activo",
    fechaRegistro: "2025-03-22",
  },
  {
    id: "emp-3",
    nombre: "Comercial Rimac SAC",
    ruc: "20609981234",
    contacto: "Milagros Torres",
    telefono: "+51 987 555 666",
    email: "info@comercialrimac.com",
    ciudad: "Arequipa",
    direccion: "Calle Mercaderes 305",
    estado: "Inactivo",
    fechaRegistro: "2024-11-05",
  },
  {
    id: "emp-4",
    nombre: "Grupo Logístico Trujillo",
    ruc: "20337712045",
    contacto: "Carlos Peña",
    telefono: "+51 987 777 888",
    email: "operaciones@logtrujillo.com",
    ciudad: "Trujillo",
    direccion: "Av. España 890",
    estado: "Activo",
    fechaRegistro: "2025-05-18",
  },
  {
    id: "emp-5",
    nombre: "Almacenes del Sur S.A.C.",
    ruc: "20445561789",
    contacto: "Elena Vargas",
    telefono: "+51 987 999 000",
    email: "contacto@almacenessur.pe",
    ciudad: "Cusco",
    direccion: "Av. de la Cultura 1120",
    estado: "Activo",
    fechaRegistro: "2025-06-01",
  },
  {
    id: "emp-6",
    nombre: "Suministros Costa Verde",
    ruc: "20512348890",
    contacto: "Renzo Ibáñez",
    telefono: "+51 987 222 111",
    email: "renzo.ibanez@costaverde.com",
    ciudad: "Piura",
    direccion: "Calle Libertad 455",
    estado: "Inactivo",
    fechaRegistro: "2024-09-14",
  },
  {
    id: "emp-7",
    nombre: "Distribuciones El Roble",
    ruc: "20601123456",
    contacto: "Patricia Chávez",
    telefono: "+51 987 444 333",
    email: "pchavez@elroble.pe",
    ciudad: "Chiclayo",
    direccion: "Av. Bolognesi 780",
    estado: "Activo",
    fechaRegistro: "2025-07-01",
  },
];
