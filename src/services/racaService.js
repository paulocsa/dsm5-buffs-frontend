import { get } from "@/lib/apiClient";

/**
 * Lista todas as raças de búfalos cadastradas no sistema, ordenadas alfabeticamente.
 * GET /racas
 * @returns {Promise<Array>} Array de raças
 */
const listarRacas = async () => {
  const response = await get("/racas");
  return response.data;
};

const racaService = {
  listarRacas,
};

export default racaService;
