import { Conductor, conductoresIniciales } from "../data/mock/conductores";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let conductoresDb = [...conductoresIniciales];

export const conductorService = {
  getConductores: async (): Promise<Conductor[]> => {
    await delay(300);
    return [...conductoresDb].sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime());
  },

  getConductoresDisponibles: async (): Promise<Conductor[]> => {
    await delay(300);
    return conductoresDb.filter(c => c.estado === "Disponible");
  },

  getConductorById: async (id: string): Promise<Conductor | undefined> => {
    await delay(300);
    return conductoresDb.find(c => c.id === id);
  },

  createConductor: async (data: Omit<Conductor, "id" | "fechaRegistro" | "calificacion">): Promise<Conductor> => {
    await delay(500);
    const newConductor: Conductor = {
      ...data,
      id: `cond-${Date.now()}`,
      fechaRegistro: new Date().toISOString(),
      calificacion: 5.0, // Default rating for new drivers
    };
    conductoresDb.push(newConductor);
    return newConductor;
  },

  updateConductor: async (id: string, data: Partial<Omit<Conductor, "id" | "fechaRegistro">>): Promise<Conductor> => {
    await delay(500);
    const index = conductoresDb.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Conductor no encontrado");
    
    conductoresDb[index] = { ...conductoresDb[index], ...data };
    return conductoresDb[index];
  },

  deleteConductor: async (id: string): Promise<void> => {
    await delay(400);
    conductoresDb = conductoresDb.filter(c => c.id !== id);
  }
};
