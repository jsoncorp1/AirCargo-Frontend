import { Envio, enviosIniciales } from "../data/mock/envios";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mantenemos una variable en memoria para que al crear un envío se agregue temporalmente en la sesión
let enviosDb = [...enviosIniciales];

export const envioService = {
  getEnvios: async (): Promise<Envio[]> => {
    await delay(400);
    return [...enviosDb].sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  },

  getEnvioById: async (id: string): Promise<Envio | undefined> => {
    await delay(300);
    return enviosDb.find(e => e.id === id);
  },

  createEnvio: async (envioData: Omit<Envio, "id" | "fechaCreacion" | "estado">): Promise<Envio> => {
    await delay(600); // Simulamos tiempo de guardado
    
    const nuevoEnvio: Envio = {
      ...envioData,
      id: `env-${Date.now()}`,
      fechaCreacion: new Date().toISOString(),
      estado: envioData.conductorId ? "Asignado" : "Pendiente"
    };

    enviosDb.push(nuevoEnvio);
    return nuevoEnvio;
  },

  updateEnvio: async (id: string, data: Partial<Omit<Envio, "id" | "fechaCreacion">>): Promise<Envio> => {
    await delay(500);
    const index = enviosDb.findIndex(e => e.id === id);
    if (index === -1) throw new Error("Envío no encontrado");
    
    enviosDb[index] = { ...enviosDb[index], ...data };
    return enviosDb[index];
  }
};
