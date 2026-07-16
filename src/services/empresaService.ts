import { Empresa, empresasIniciales } from "../data/mock/empresas";

// Simulando retardo de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const empresaService = {
  getEmpresas: async (): Promise<Empresa[]> => {
    await delay(300); // 300ms de latencia simulada
    return [...empresasIniciales];
  },
  
  getEmpresaById: async (id: string): Promise<Empresa | undefined> => {
    await delay(300);
    return empresasIniciales.find(e => e.id === id);
  }
};
