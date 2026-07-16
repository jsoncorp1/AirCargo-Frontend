import { Articulo, articulosIniciales } from "../data/mock/articulos";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let articulosDb: Articulo[] = [...articulosIniciales];

export const articuloService = {
  getArticulos: async (): Promise<Articulo[]> => {
    await delay(300);
    return [...articulosDb].sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime());
  },

  getArticulosByEmpresa: async (empresaId: string): Promise<Articulo[]> => {
    await delay(300);
    return articulosDb.filter(a => a.empresaId === empresaId);
  },

  getArticuloById: async (id: string): Promise<Articulo | undefined> => {
    await delay(300);
    return articulosDb.find(a => a.id === id);
  },

  createArticulo: async (data: Omit<Articulo, "id" | "fechaRegistro">): Promise<Articulo> => {
    await delay(500);
    const newArticulo: Articulo = {
      ...data,
      id: `art-${Date.now()}`,
      fechaRegistro: new Date().toISOString().split("T")[0],
    };
    articulosDb.push(newArticulo);
    return newArticulo;
  },

  updateArticulo: async (id: string, data: Partial<Omit<Articulo, "id" | "fechaRegistro">>): Promise<Articulo> => {
    await delay(500);
    const index = articulosDb.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Artículo no encontrado");

    articulosDb[index] = { ...articulosDb[index], ...data };
    return articulosDb[index];
  },

  deleteArticulo: async (id: string): Promise<void> => {
    await delay(400);
    articulosDb = articulosDb.filter(a => a.id !== id);
  }
};
