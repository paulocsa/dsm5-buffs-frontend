import apiClient from "@/lib/apiClient";

const dashboardService = {
  async getDashboardStatsByPropriedadeId(idPropriedade) {
    try {
      const response = await apiClient.get(`/dashboard/${idPropriedade}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getLactacaoStatsByPropriedadeId(idPropriedade, ano) {
    try {
      const response = await apiClient.get(
        `/dashboard/lactacao/${idPropriedade}?ano=${ano}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getProducaoMensalByPropriedadeId(idPropriedade, ano) {
    try {
      const response = await apiClient.get(
        `/dashboard/producao-mensal/${idPropriedade}?ano=${ano}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default dashboardService;
