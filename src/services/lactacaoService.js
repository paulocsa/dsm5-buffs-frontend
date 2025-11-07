import { get } from "@/lib/apiClient";

/**
 * Busca o resumo de produção de uma búfala específica (ciclo atual + histórico).
 * GET /lactacao/bufala/{id}/resumo-producao
 *
 * @param {string} idBufala - ID da búfala (UUID, obrigatório)
 * @returns {Promise<Object>} Resumo completo de produção contendo:
 *   - bufala: { id, nome, brinco }
 *   - ciclo_atual: dados do ciclo de lactação atual
 *   - comparativo_ciclos: histórico de ciclos anteriores
 *   - grafico_producao: dados para gráfico de produção diária
 */
const buscarResumoProducaoPorBufala = async (idBufala) => {
  if (!idBufala) throw new Error("ID da búfala é obrigatório");
  try {
    console.log(`[lactacaoService] Buscando resumo de produção para búfala: ${idBufala}`);
    const response = await get(`/lactacao/bufala/${idBufala}/resumo-producao`);
    console.log(`[lactacaoService] Resposta recebida:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[lactacaoService] Erro ao buscar resumo de produção:`, error);
    throw error;
  }
};

/**
 * Busca todas as ordenhas de um ciclo específico de lactação.
 * GET /lactacao/ciclo/{id_ciclo_lactacao}
 *
 * @param {string} idCicloLactacao - ID do ciclo de lactação (UUID, obrigatório)
 * @param {number} page - Número da página (default: 1)
 * @param {number} limit - Quantidade de registros por página (default: 20)
 * @returns {Promise<Object>} Objeto contendo:
 *   - data: Array de ordenhas do ciclo
 *   - pagination: { total, page, limit, totalPages }
 */
const buscarOrdenhasPorCiclo = async (idCicloLactacao, page = 1, limit = 20) => {
  if (!idCicloLactacao) throw new Error("ID do ciclo de lactação é obrigatório");
  try {
    console.log(`[lactacaoService] Buscando ordenhas do ciclo: ${idCicloLactacao} (página: ${page}, limite: ${limit})`);
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await get(`/lactacao/ciclo/${idCicloLactacao}?${queryParams}`);
    console.log(`[lactacaoService] Ordenhas do ciclo recebidas:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[lactacaoService] Erro ao buscar ordenhas do ciclo:`, error);
    throw error;
  }
};

/**
 * Busca as estatísticas dos ciclos de lactação de uma propriedade específica.
 * GET /ciclos-lactacao/propriedade/{id_propriedade}/estatisticas
 *
 * @param {string} idPropriedade - ID da propriedade (UUID, obrigatório)
 * @returns {Promise<Object>} Estatísticas dos ciclos contendo:
 *   - total_ciclos: Total de ciclos
 *   - ciclos_ativos: Total de ciclos ativos
 *   - ciclos_secos: Total de ciclos encerrados
 *   - media_dias_lactacao: Média de duração dos ciclos
 *   - ciclos_proximos_secagem: Ciclos próximos da secagem
 *   - ciclos_secagem_atrasada: Ciclos com secagem atrasada
 */
const buscarEstatisticasCiclosPorPropriedade = async (idPropriedade) => {
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");
  try {
    console.log(`[lactacaoService] Buscando estatísticas dos ciclos para propriedade: ${idPropriedade}`);
    const response = await get(`/ciclos-lactacao/propriedade/${idPropriedade}/estatisticas`);
    console.log(`[lactacaoService] Estatísticas recebidas:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[lactacaoService] Erro ao buscar estatísticas dos ciclos:`, error);
    throw error;
  }
};

const lactacaoService = {
  buscarResumoProducaoPorBufala,
  buscarOrdenhasPorCiclo,
  buscarEstatisticasCiclosPorPropriedade,
};

export default lactacaoService;
