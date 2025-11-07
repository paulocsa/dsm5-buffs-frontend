import { get, post, patch, del } from "@/lib/apiClient";

/**
 * Busca todos os lotes de uma propriedade específica
 * @param {string} idPropriedade - UUID da propriedade
 * @returns {Promise<Array>} Lista de lotes
 */
const listarLotesPorPropriedade = async (idPropriedade) => {
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");
  const response = await get(`/lotes/propriedade/${idPropriedade}`);
  return response.data;
};

/**
 * Atualiza um lote existente
 * @param {string} id - ID do lote (UUID)
 * @param {Object} loteDados - Dados para atualização
 * @returns {Promise<Object>} Lote atualizado (retorno do servidor)
 */
const atualizarLote = async (id, loteDados) => {
  if (!id) throw new Error("ID do lote é obrigatório");
  if (!loteDados || Object.keys(loteDados).length === 0) {
    throw new Error("Dados para atualização do lote são obrigatórios");
  }
  const response = await patch(`/lotes/${id}`, loteDados);
  return response.data;
};

/**
 * Cria um novo lote
 * @param {Object} loteDados - Payload do novo lote (veja API: nome_lote, id_propriedade, geo_mapa, etc.)
 * @returns {Promise<Object>} Lote criado (retorno do servidor)
 */
const criarLote = async (loteDados) => {
  if (!loteDados || Object.keys(loteDados).length === 0) {
    throw new Error('Dados do lote são obrigatórios');
  }
  const response = await post('/lotes', loteDados);
  return response.data;
};

/**
 * Remove um lote pelo ID
 * @param {string} id - ID do lote a ser removido
 * @returns {Promise<Object>} Resultado estruturado: { success: true } ou { success: false, error }
 */
const removerLote = async (id) => {
  if (!id) return { success: false, error: { message: 'ID do lote é obrigatório' } };
  try {
    const response = await del(`/lotes/${id}`);
    // Expecting 204 No Content on success — normalize as success
    return { success: true, data: response.data };
  } catch (err) {
    if (err && err.response) {
      const payload = err.response.data || {};
      const serverMsg = payload.message || payload.error || err.message || 'Erro no servidor';
      return { success: false, error: { message: serverMsg, statusCode: err.response.status, data: payload } };
    }
    return { success: false, error: { message: err?.message || 'Erro desconhecido' } };
  }
};

const loteService = {
  listarLotesPorPropriedade,
  atualizarLote,
  criarLote,
  removerLote,
};

export default loteService;
