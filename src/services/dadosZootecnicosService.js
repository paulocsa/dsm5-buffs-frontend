import { get, patch, del } from "@/lib/apiClient";

/**
 * Lista todos os registros zootécnicos de um búfalo com paginação.
 * GET /dados-zootecnicos/bufalo/{id_bufalo}?page={page}&limit={limit}
 *
 * @param {string} idBufalo - ID do búfalo (obrigatório)
 * @param {number} [page=1] - Número da página (opcional, padrão 1)
 * @param {number} [limit=10] - Itens por página (opcional, padrão 10)
 * @returns {Promise<{ data: Array, meta: Object }>} Lista paginada de registros zootécnicos
 */
const listarDadosZootecnicosPorBufalo = async (idBufalo, page = 1, limit = 10) => {
  if (!idBufalo) throw new Error("ID do búfalo é obrigatório");
  const safePage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  let safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
  if (safeLimit > 100) safeLimit = 100;
  const response = await get(`/dados-zootecnicos/bufalo/${idBufalo}?page=${safePage}&limit=${safeLimit}`);
  return response.data;
};

/**
 * Atualiza um registro zootécnico.
 * PATCH /dados-zootecnicos/{id_zootec}
 *
 * @param {string} idZootec - ID do registro zootécnico a ser atualizado (obrigatório)
 * @param {Object} payload - Dados a serem atualizados no registro zootécnico
 * @returns {Promise<Object>} Registro atualizado
 */
const atualizarRegistroZootecnico = async (idZootec, payload) => {
  if (!idZootec) throw new Error("ID do registro zootécnico é obrigatório");
  if (!payload || typeof payload !== "object") throw new Error("Payload inválido para atualização");
  const response = await patch(`/dados-zootecnicos/${idZootec}`, payload);
  return response.data;
};

/**
 * Remove um registro zootécnico.
 * DELETE /dados-zootecnicos/{id_zootec}
 *
 * @param {string} idZootec - ID do registro zootécnico a ser removido (obrigatório)
 * @returns {Promise<void>} Confirmação da remoção
 */
const removerRegistroZootecnico = async (idZootec) => {
  if (!idZootec) throw new Error("ID do registro zootécnico é obrigatório");
  await del(`/dados-zootecnicos/${idZootec}`);
};

const dadosZootecnicosService = {
  listarDadosZootecnicosPorBufalo,
  atualizarRegistroZootecnico,
  removerRegistroZootecnico,
};

export default dadosZootecnicosService;
