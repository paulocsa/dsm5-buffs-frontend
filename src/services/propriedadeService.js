import { get, post, patch, del } from "@/lib/apiClient";
// Edita uma propriedade existente
const editarPropriedade = async (id, propriedadeData) => {
  const response = await patch(`/propriedades/${id}`, propriedadeData);
  return response.data;
};

// Busca propriedades do endpoint /propriedades
const listarPropriedades = async () => {
  const response = await get("/propriedades");
  // Retorna apenas o array de propriedades
  return response.data.propriedades;
};

const buscarPropriedadePorId = async (id) => {
  const response = await get(`/propriedades/${id}`);
  return response.data;
};

/**
 * Obtém estatísticas do dashboard para uma propriedade
 * @param {string|number} idPropriedade
 * @returns {Promise<any>} Estatísticas do dashboard
 */
async function getDashboardStatsByPropriedadeId(idPropriedade) {
  const response = await get(`/dashboard/${idPropriedade}`);
  return response.data;
}

// Cria uma nova propriedade
const criarPropriedade = async (propriedadeData) => {
  const response = await post("/propriedades", propriedadeData);
  return response.data;
};

// Deleta uma propriedade
const deletarPropriedade = async (id) => {
  const response = await del(`/propriedades/${id}`);
  return response.data;
};

const propriedadeService = {
  listarPropriedades,
  buscarPropriedadePorId,
  getDashboardStatsByPropriedadeId,
  criarPropriedade,
  editarPropriedade,
  deletarPropriedade,
};

export default propriedadeService;
