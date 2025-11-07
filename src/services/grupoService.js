import { get, post, patch, del } from "@/lib/apiClient";

/**
 * Lista grupos por propriedade com paginação
 * @param {string} idPropriedade - ID da propriedade
 * @param {number} [page=1] - Número da página
 * @param {number} [limit=10] - Itens por página
 * @returns {Promise<{ grupos: Array, total: number, page: number, limit: number }>} Resultado da busca
 */
const listarGruposPorPropriedade = async (idPropriedade, page = 1, limit = 10) => {
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");
  const response = await get(`/grupos/propriedade/${idPropriedade}?page=${page}&limit=${limit}`);
  return response.data;
};

/**
 * Cria um novo grupo
 * @param {{ nome_grupo: string, id_propriedade: string, color?: string, nivel_maturidade?: string }} grupoDados
 * @returns {Promise<Object>} Grupo criado (retorno do servidor)
 */
const criarGrupo = async (grupoDados) => {
  if (!grupoDados || !grupoDados.nome_grupo || !grupoDados.id_propriedade) {
    throw new Error("nome_grupo e id_propriedade são obrigatórios");
  }
  const response = await post('/grupos', grupoDados);
  return response.data;
};

/**
 * Atualiza um grupo existente
 * @param {string} id - ID do grupo a ser atualizado
 * @param {{ nome_grupo?: string, id_propriedade?: string, color?: string, nivel_maturidade?: string }} grupoDados
 * @returns {Promise<Object>} Grupo atualizado (retorno do servidor)
 */
const atualizarGrupo = async (id, grupoDados) => {
  if (!id) throw new Error('ID do grupo é obrigatório');
  if (!grupoDados || Object.keys(grupoDados).length === 0) {
    throw new Error('Dados para atualização são obrigatórios');
  }
  const response = await patch(`/grupos/${id}`, grupoDados);
  return response.data;
};

/**
 * Remove um grupo pelo ID
 * @param {string} id - ID do grupo a ser removido
 * @returns {Promise<Object>} Resultado da remoção (retorno do servidor)
 */
const removerGrupo = async (id) => {
  if (!id) return { success: false, error: { message: 'ID do grupo é obrigatório' } };
  try {
    const response = await del(`/grupos/${id}`);
    return { success: true, data: response.data };
  } catch (err) {
    // Normalize the error into a structured object so callers can handle failures without throwing
    if (err && err.response) {
      const payload = err.response.data || {};
      const serverMsg = payload.message || payload.error || err.message || 'Erro no servidor';
      return { success: false, error: { message: serverMsg, statusCode: err.response.status, data: payload } };
    }
    return { success: false, error: { message: err?.message || 'Erro desconhecido' } };
  }
};

const grupoService = {
  listarGruposPorPropriedade,
  criarGrupo,
  atualizarGrupo,
  removerGrupo,
};

export default grupoService;
