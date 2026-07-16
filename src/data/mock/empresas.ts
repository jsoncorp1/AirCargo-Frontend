export type EmpresaEstado = "Activo" | "Inactivo";

export interface Empresa {
  id: string;
  nombre: string;
  nit: string; // Changed from ruc to nit
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
    nit: "1028394021",
    contacto: "Rosa Medina",
    telefono: "+591 71234567",
    email: "contacto@distandina.com.bo",
    ciudad: "La Paz",
    direccion: "Av. Buenos Aires 1450",
    estado: "Activo",
    fechaRegistro: "2025-02-10",
  },
  {
    id: "emp-2",
    nombre: "Importadora del Oriente E.I.R.L.",
    nit: "4920381928",
    contacto: "Jorge Salcedo",
    telefono: "+591 76543210",
    email: "ventas@imporiente.com.bo",
    ciudad: "Santa Cruz",
    direccion: "Av. Banzer Km 2",
    estado: "Activo",
    fechaRegistro: "2025-03-22",
  },
  {
    id: "emp-3",
    nombre: "Comercial Valle SAC",
    nit: "8392018392",
    contacto: "Milagros Torres",
    telefono: "+591 70011223",
    email: "info@comercialvalle.com.bo",
    ciudad: "Cochabamba",
    direccion: "Av. Blanco Galindo Km 4",
    estado: "Inactivo",
    fechaRegistro: "2024-11-05",
  },
  {
    id: "emp-4",
    nombre: "Grupo Logístico del Sur",
    nit: "2938471029",
    contacto: "Carlos Peña",
    telefono: "+591 69988776",
    email: "operaciones@logdelsur.com.bo",
    ciudad: "Tarija",
    direccion: "Av. Panamericana 890",
    estado: "Activo",
    fechaRegistro: "2025-05-18",
  },
  {
    id: "emp-5",
    nombre: "Almacenes Mineros S.A.C.",
    nit: "5029384710",
    contacto: "Elena Vargas",
    telefono: "+591 72233445",
    email: "contacto@almacenesmineros.com.bo",
    ciudad: "Oruro",
    direccion: "Av. 6 de Agosto 1120",
    estado: "Activo",
    fechaRegistro: "2025-06-01",
  },
  {
    id: "emp-6",
    nombre: "Suministros Amazonía",
    nit: "6129384750",
    contacto: "Renzo Ibáñez",
    telefono: "+591 73344556",
    email: "renzo.ibanez@amazonia.com.bo",
    ciudad: "Beni",
    direccion: "Av. 6 de Agosto 455",
    estado: "Inactivo",
    fechaRegistro: "2024-09-14",
  },
  {
    id: "emp-7",
    nombre: "Distribuciones El Cerro",
    nit: "7239485012",
    contacto: "Patricia Chávez",
    telefono: "+591 74455667",
    email: "pchavez@elcerro.com.bo",
    ciudad: "Potosí",
    direccion: "Av. Murillo 780",
    estado: "Activo",
    fechaRegistro: "2025-07-01",
  },
];
