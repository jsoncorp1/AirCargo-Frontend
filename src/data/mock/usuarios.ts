export type UsuarioEstado = "Activo" | "Inactivo";
export type UsuarioRol = "Administrador" | "Operador" | "Despachador";

export interface UsuarioProveedor {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  empresaId: string;
  rol: UsuarioRol;
  estado: UsuarioEstado;
  fechaRegistro: string;
  avatarUrl?: string;
}

export const usuariosIniciales: UsuarioProveedor[] = [
  { id: "usr-1", nombre: "Luis Fernández", email: "luis.fernandez@distandina.com.bo", telefono: "+591 71234500", empresaId: "emp-1", rol: "Administrador", estado: "Activo", fechaRegistro: "2025-02-12" },
  { id: "usr-2", nombre: "Karen Sánchez", email: "karen.sanchez@distandina.com.bo", telefono: "+591 71234501", empresaId: "emp-1", rol: "Operador", estado: "Activo", fechaRegistro: "2025-02-15" },
  { id: "usr-3", nombre: "Diego Ramos", email: "diego.ramos@distandina.com.bo", telefono: "+591 71234502", empresaId: "emp-1", rol: "Despachador", estado: "Inactivo", fechaRegistro: "2025-03-01" },
  { id: "usr-4", nombre: "María Gutiérrez", email: "maria.gutierrez@imporiente.com.bo", telefono: "+591 76543200", empresaId: "emp-2", rol: "Administrador", estado: "Activo", fechaRegistro: "2025-03-25" },
  { id: "usr-5", nombre: "Andrés Quispe", email: "andres.quispe@imporiente.com.bo", telefono: "+591 76543201", empresaId: "emp-2", rol: "Operador", estado: "Activo", fechaRegistro: "2025-04-02" },
  { id: "usr-6", nombre: "Fiorella Campos", email: "fiorella.campos@comercialvalle.com.bo", telefono: "+591 70011200", empresaId: "emp-3", rol: "Administrador", estado: "Inactivo", fechaRegistro: "2024-11-10" },
  { id: "usr-7", nombre: "Hugo Delgado", email: "hugo.delgado@comercialvalle.com.bo", telefono: "+591 70011201", empresaId: "emp-3", rol: "Despachador", estado: "Inactivo", fechaRegistro: "2024-11-20" },
  { id: "usr-8", nombre: "Vanessa Rojas", email: "vanessa.rojas@logdelsur.com.bo", telefono: "+591 69988700", empresaId: "emp-4", rol: "Administrador", estado: "Activo", fechaRegistro: "2025-05-20" },
  { id: "usr-9", nombre: "Bruno Castañeda", email: "bruno.castaneda@logdelsur.com.bo", telefono: "+591 69988701", empresaId: "emp-4", rol: "Operador", estado: "Activo", fechaRegistro: "2025-05-25" },
  { id: "usr-10", nombre: "Claudia Espinoza", email: "claudia.espinoza@logdelsur.com.bo", telefono: "+591 69988702", empresaId: "emp-4", rol: "Despachador", estado: "Activo", fechaRegistro: "2025-06-03" },
  { id: "usr-11", nombre: "Ricardo Paredes", email: "ricardo.paredes@almacenesmineros.com.bo", telefono: "+591 72233400", empresaId: "emp-5", rol: "Administrador", estado: "Activo", fechaRegistro: "2025-06-05" },
  { id: "usr-12", nombre: "Gabriela Núñez", email: "gabriela.nunez@almacenesmineros.com.bo", telefono: "+591 72233401", empresaId: "emp-5", rol: "Operador", estado: "Activo", fechaRegistro: "2025-06-10" },
  { id: "usr-13", nombre: "Franco Alvarado", email: "franco.alvarado@amazonia.com.bo", telefono: "+591 73344500", empresaId: "emp-6", rol: "Administrador", estado: "Inactivo", fechaRegistro: "2024-09-16" },
  { id: "usr-14", nombre: "Sofía Herrera", email: "sofia.herrera@elcerro.com.bo", telefono: "+591 74455600", empresaId: "emp-7", rol: "Administrador", estado: "Activo", fechaRegistro: "2025-07-02" },
];
