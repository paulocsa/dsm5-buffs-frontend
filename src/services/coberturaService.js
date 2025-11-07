import { get } from "@/lib/apiClient";

/**
 * Lista coberturas por propriedade com paginação.
 * GET /cobertura/propriedade/{id_propriedade}?page={page}&limit={limit}
 *
 * @param {string} idPropriedade - ID da propriedade (obrigatório)
 * @param {number} [page=1] - Número da página (opcional, padrão 1)
 * @param {number} [limit=10] - Itens por página (opcional, padrão 10)
 * @returns {Promise<{ data: Array, meta: Object }>} Lista paginada de coberturas
 */
const listarCoberturasPorPropriedade = async (idPropriedade, page = 1, limit = 10) => {
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");
  const safePage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  let safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
  if (safeLimit > 100) safeLimit = 100;
  const response = await get(`/cobertura/propriedade/${idPropriedade}?page=${safePage}&limit=${safeLimit}`);
  return response.data;
};

/**
 * Lista fêmeas disponíveis para reprodução.
 * GET /cobertura/femeas/disponiveis-reproducao/{id_propriedade}
 *
 * @param {string} idPropriedade - ID da propriedade (obrigatório)
 * @param {string} [filtro] - Filtro de disponibilidade (opcional)
 *   - 'todas' = todas fêmeas
 *   - 'solteiras' = sem cobertura
 *   - 'vazias' = cobertura falhou
 *   - 'aptas' = prontas para cobrir (padrão)
 * @returns {Promise<Array>} Lista de fêmeas disponíveis com informações reprodutivas
 * 
 * @example
 * // Buscar todas as fêmeas aptas para reprodução
 * const aptas = await listarFemeasDisponiveisReproducao('uuid-propriedade');
 * 
 * // Buscar apenas fêmeas sem cobertura
 * const solteiras = await listarFemeasDisponiveisReproducao('uuid-propriedade', 'solteiras');
 * 
 * // Buscar fêmeas com cobertura que falhou
 * const vazias = await listarFemeasDisponiveisReproducao('uuid-propriedade', 'vazias');
 */
const listarFemeasDisponiveisReproducao = async (idPropriedade, filtro = 'aptas') => {
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");
  
  const filtrosValidos = ['todas', 'solteiras', 'vazias', 'aptas'];
  const filtroSeguro = filtrosValidos.includes(filtro) ? filtro : 'aptas';
  
  const response = await get(
    `/cobertura/femeas/disponiveis-reproducao/${idPropriedade}?filtro=${filtroSeguro}`
  );
  return response.data;
};

const coberturaService = {
  listarCoberturasPorPropriedade,
  listarFemeasDisponiveisReproducao,
};

export default coberturaService;
