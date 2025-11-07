import { get, post } from "@/lib/apiClient";
import { patch } from "@/lib/apiClient";

/**
 * Lista búfalos de uma propriedade com paginação.
 * GET /bufalos/propriedade/{id_propriedade}?page={page}&limit={limit}
 *
 * @param {string} idPropriedade - ID (UUID) da propriedade (obrigatório)
 * @param {number} [page=1] - Número da página (inicia em 1)
 * @param {number} [limit=10] - Itens por página (máximo 100)
 * @returns {Promise<{ data: Array, meta: Object }>} Retorna o payload completo do endpoint
 */
const listarBufalosPorPropriedade = async (idPropriedade, page = 1, limit = 10) => {
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");

  const safePage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  let safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
  if (safeLimit > 100) safeLimit = 100;

  const response = await get(`/bufalos/propriedade/${idPropriedade}?page=${safePage}&limit=${safeLimit}`);
  return response.data;
};

/**
 * Busca um búfalo específico pelo ID.
 * GET /bufalos/{id}
 *
 * @param {string} idBufalo - ID do búfalo (UUID)
 * @returns {Promise<Object>} Dados do búfalo
 */
const buscarBufaloPorId = async (idBufalo) => {
  if (!idBufalo) throw new Error("ID do búfalo é obrigatório");
  const response = await get(`/bufalos/${idBufalo}`);
  return response.data;
};

/**
 * Edita os dados de um búfalo.
 * PATCH /bufalos/{id}
 *
 * @param {string} idBufalo - ID do búfalo (UUID)
 * @param {Object} dadosAtualizados - Dados para atualizar
 * @returns {Promise<Object>} Dados do búfalo atualizado
 */
const editarBufalo = async (idBufalo, dadosAtualizados) => {
  if (!idBufalo) throw new Error("ID do búfalo é obrigatório");
  const response = await patch(`/bufalos/${idBufalo}`, dadosAtualizados);
  return response.data;
};

/**
 * Filtra búfalos por sexo, status e propriedade.
 * GET /bufalos/filtro/sexo/{sexo}/propriedade/{id_propriedade}/status/{status}?page={page}&limit={limit}
 *
 * @param {string} sexo - Sexo do búfalo ("M" ou "F")
 * @param {string} idPropriedade - ID da propriedade (UUID)
 * @param {string|boolean} status - Status do búfalo (true ou false)
 * @param {number} [page=1] - Número da página (inicia em 1)
 * @param {number} [limit=10] - Itens por página (máximo 100)
 * @returns {Promise<{ data: Array, meta: Object }>} Retorna o payload completo do endpoint
 */
const filtrarBufalosPorSexoStatusPropriedade = async (
  sexo,
  idPropriedade,
  status,
  page = 1,
  limit = 10
) => {
  if (!sexo) throw new Error("Sexo do búfalo é obrigatório");
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");
  if (typeof status === "undefined") throw new Error("Status do búfalo é obrigatório");

  const safePage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  let safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
  if (safeLimit > 100) safeLimit = 100;

  const response = await get(
    `/bufalos/filtro/sexo/${sexo}/propriedade/${idPropriedade}/status/${status}?page=${safePage}&limit=${safeLimit}`
  );
  return response.data;
};

/**
 * Filtragem avançada de búfalos por múltiplos critérios.
 * GET /bufalos/filtro/propriedade/{id_propriedade}/avancado
 *
 * @param {Object} params - Parâmetros de filtro
 * @param {string} params.idPropriedade - ID da propriedade (obrigatório)
 * @param {string} [params.idRaca] - ID da raça (opcional)
 * @param {string} [params.sexo] - Sexo do búfalo: "M" ou "F" (opcional)
 * @param {string} [params.nivelMaturidade] - Maturidade: "B", "N", "V", "T" (opcional)
 * @param {boolean} [params.status] - Status: true (ativo), false (inativo) (opcional)
 * @param {string} [params.brinco] - Início do brinco (opcional)
 * @param {number} [params.page=1] - Página (opcional)
 * @param {number} [params.limit=10] - Itens por página (opcional)
 * @returns {Promise<{ data: Array, meta: Object }>} Lista paginada de búfalos filtrados
 */
const filtrarBufalosAvancado = async ({
  idPropriedade,
  idRaca,
  sexo,
  nivelMaturidade,
  status,
  brinco,
  page = 1,
  limit = 10,
}) => {
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");
  const params = [];
  if (idRaca) params.push(`id_raca=${idRaca}`);
  if (sexo) params.push(`sexo=${sexo}`);
  if (nivelMaturidade) params.push(`nivel_maturidade=${nivelMaturidade}`);
  if (typeof status !== "undefined") params.push(`status=${status}`);
  if (brinco) params.push(`brinco=${encodeURIComponent(brinco)}`);
  if (page) params.push(`page=${page}`);
  if (limit) params.push(`limit=${limit}`);
  const queryString = params.length ? `?${params.join("&")}` : "";
  const response = await get(
    `/bufalos/filtro/propriedade/${idPropriedade}/avancado${queryString}`
  );
  return response.data;
};

/**
 * Cria um novo búfalo.
 * POST /bufalos
 *
 * @param {Object} bufaloData - Dados do búfalo a ser criado
 * @returns {Promise<Object>} Dados do búfalo criado
 */
const criarBufalo = async (bufaloData) => {
  if (!bufaloData) throw new Error("Dados do búfalo são obrigatórios");
  const response = await post("/bufalos", bufaloData);
  return response.data;
};

const bufaloService = {
  listarBufalosPorPropriedade,
  buscarBufaloPorId,
  editarBufalo,
  filtrarBufalosPorSexoStatusPropriedade,
  filtrarBufalosAvancado,
  criarBufalo,
};

export default bufaloService;
