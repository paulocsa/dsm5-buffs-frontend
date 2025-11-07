import { get, patch, del } from "@/lib/apiClient";

/**
 * Lista coletas por propriedade com paginação.
 * GET /coletas/propriedade/{id_propriedade}?page={page}&limit={limit}
 *
 * @param {string} idPropriedade - ID da propriedade (obrigatório)
 * @param {number} [page=1] - Número da página (opcional, padrão 1)
 * @param {number} [limit=10] - Itens por página (opcional, padrão 10)
 * @returns {Promise<{ data: Array, meta: Object }>} Lista paginada de coletas
 */
const listarColetasPorPropriedade = async (idPropriedade, page = 1, limit = 10) => {
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");
  const safePage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  let safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
  if (safeLimit > 100) safeLimit = 100;
  const response = await get(`/coletas/propriedade/${idPropriedade}?page=${safePage}&limit=${safeLimit}`);
  return response.data;
};

/**
 * Busca uma coleta de leite pelo ID.
 * GET /coletas/{id}
 *
 * @param {string} id - ID da coleta (obrigatório)
 * @returns {Promise<Object>} Dados da coleta
 */
const buscarColetaPorId = async (id) => {
  if (!id) throw new Error("ID da coleta é obrigatório");
  const response = await get(`/coletas/${id}`);
  return response.data;
};

/**
 * Atualiza um registro de coleta pelo ID.
 * PATCH /coletas/{id}
 *
 * @param {string} id - ID da coleta (obrigatório)
 * @param {Object} dados - Dados para atualizar
 * @returns {Promise<Object>} Coleta atualizada
 */
const atualizarColetaPorId = async (id, dados) => {
  if (!id) throw new Error("ID da coleta é obrigatório");
  if (!dados || typeof dados !== "object") throw new Error("Dados para atualização são obrigatórios");
  const response = await patch(`/coletas/${id}`, dados);
  return response.data;
};

/**
 * Remove um registro de coleta pelo ID.
 * DELETE /coletas/{id}
 *
 * @param {string} id - ID da coleta (obrigatório)
 * @returns {Promise<Object>} Resultado da remoção
 */
const removerColetaPorId = async (id) => {
  if (!id) throw new Error("ID da coleta é obrigatório");
  const response = await del(`/coletas/${id}`);
  return response.data;
};

const coletaService = {
  listarColetasPorPropriedade,
  buscarColetaPorId,
  atualizarColetaPorId,
  removerColetaPorId,
};

export default coletaService;
