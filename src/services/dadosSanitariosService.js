import { get } from "@/lib/apiClient";

/**
 * Lista todos os registros sanitários de um búfalo com paginação.
 * GET /dados-sanitarios/bufalo/{id_bufalo}?page={page}&limit={limit}
 *
 * @param {string} idBufalo - ID do búfalo (obrigatório)
 * @param {number} [page=1] - Número da página (opcional, padrão 1)
 * @param {number} [limit=10] - Itens por página (opcional, padrão 10)
 * @returns {Promise<{ data: Array, meta: Object }>} Lista paginada de registros sanitários
 */
const listarDadosSanitariosPorBufalo = async (idBufalo, page = 1, limit = 10) => {
  if (!idBufalo) throw new Error("ID do búfalo é obrigatório");
  const safePage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  let safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
  if (safeLimit > 100) safeLimit = 100;
  const response = await get(`/dados-sanitarios/bufalo/${idBufalo}?page=${safePage}&limit=${safeLimit}`);
  return response.data;
};

/**
 * Retorna a frequência de doenças registradas em uma propriedade.
 * GET /dados-sanitarios/propriedade/{id_propriedade}/frequencia-doencas
 *
 * @param {string} idPropriedade - ID da propriedade (obrigatório)
 * @param {boolean} [agruparSimilares=false] - Agrupa doenças com nomes similares (opcional, padrão false)
 * @param {number} [limiarSimilaridade=0.8] - Limiar de similaridade para agrupamento (opcional, padrão 0.8)
 * @returns {Promise<{ dados: Array<{ doenca: string, frequencia: number }>, total_registros: number, total_doencas_distintas: number }>} Frequência de doenças
 */
const obterFrequenciaDoencasPorPropriedade = async (idPropriedade, agruparSimilares = false, limiarSimilaridade = 0.8) => {
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");
  const params = new URLSearchParams();
  if (agruparSimilares) params.append("agruparSimilares", "true");
  if (limiarSimilaridade) params.append("limiarSimilaridade", limiarSimilaridade);

  const response = await get(`/dados-sanitarios/propriedade/${idPropriedade}/frequencia-doencas?${params.toString()}`);
  return response.data;
};

const dadosSanitariosService = {
  listarDadosSanitariosPorBufalo,
  obterFrequenciaDoencasPorPropriedade,
};

export default dadosSanitariosService;