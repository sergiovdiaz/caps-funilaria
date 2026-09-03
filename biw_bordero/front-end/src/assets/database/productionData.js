import { create } from "zustand";

const useProductionStore = create((set) => ({
  producaoData: [],

  // Função para atualizar os dados de produção
  updateProducaoData: (newData) =>
    set(() => ({
      producaoData: [...newData], // Garante um novo array (força re-render)
    })),
}));

export default useProductionStore;
