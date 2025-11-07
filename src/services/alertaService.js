import { post, get, patch } from "@/lib/apiClient";

/**
 * Verifica e cria alertas pendentes para uma propriedade específica.
 * POST /alertas/verificar/{id_propriedade}
 *
 * @param {string} idPropriedade - UUID da propriedade (obrigatório)
 * @param {Array<string>|string|undefined} nichos - Nichos a verificar. Pode ser um array de strings, uma string única, ou undefined para verificar todos.
 * @returns {Promise<Object>} Resultado do endpoint (payload do servidor)
 *
 * Exemplo de uso:
 * verificarAlertasPorPropriedade('uuid-da-propriedade')
 * verificarAlertasPorPropriedade('uuid-da-propriedade', ['REPRODUCAO','SANITARIO'])
 */
const verificarAlertasPorPropriedade = async (idPropriedade, nichos) => {
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");

  // Normaliza nichos para array, aceita string única ou undefined
  let params = "";
  if (nichos !== undefined && nichos !== null) {
    const arr = Array.isArray(nichos) ? nichos : [nichos];
    // filtra valores inválidos
    const safe = arr
      .filter((n) => n !== null && n !== undefined && String(n).trim() !== "")
      .map((n) => `nichos=${encodeURIComponent(String(n).trim())}`);
    if (safe.length > 0) params = `?${safe.join("&")}`;
  }

  const url = `/alertas/verificar/${idPropriedade}${params}`;
  const response = await post(url);
  return response.data;
};

/**
 * Lista alertas de uma propriedade com filtros avançados e paginação.
 * GET /alertas/propriedade/{id_propriedade}
 *
 * @param {string} idPropriedade - UUID da propriedade (obrigatório)
 * @param {Object} [filtros={}] - Filtros opcionais
 * @param {Array<string>|string} [filtros.nichos] - Filtra por nichos (CLINICO, SANITARIO, REPRODUCAO, MANEJO, PRODUCAO)
 * @param {boolean} [filtros.incluirVistos] - Se true, inclui alertas já visualizados (padrão: false)
 * @param {string} [filtros.prioridade] - Filtra por prioridade (BAIXA, MEDIA, ALTA)
 * @param {number} [filtros.page=1] - Número da página (mínimo: 1)
 * @param {number} [filtros.limit=10] - Itens por página (mínimo: 1)
 * @returns {Promise<Object>} { data: Array<Alerta>, meta: { page, limit, total, totalPages, hasNextPage, hasPrevPage } }
 *
 * Exemplos de uso:
 * 
 * // Listar todos os alertas não visualizados (padrão)
 * await listarAlertasPorPropriedade('uuid-propriedade');
 * 
 * // Filtrar por um único nicho
 * await listarAlertasPorPropriedade('uuid-propriedade', { nichos: 'CLINICO' });
 * 
 * // Filtrar por múltiplos nichos
 * await listarAlertasPorPropriedade('uuid-propriedade', { nichos: ['CLINICO', 'SANITARIO'] });
 * 
 * // Filtrar por prioridade específica
 * await listarAlertasPorPropriedade('uuid-propriedade', { prioridade: 'ALTA' });
 * 
 * // Incluir alertas já visualizados
 * await listarAlertasPorPropriedade('uuid-propriedade', { incluirVistos: true });
 * 
 * // Paginação customizada
 * await listarAlertasPorPropriedade('uuid-propriedade', { page: 2, limit: 20 });
 * 
 * // Combinar todos os filtros
 * await listarAlertasPorPropriedade('uuid-propriedade', {
 *   nichos: ['CLINICO', 'REPRODUCAO'],
 *   prioridade: 'ALTA',
 *   incluirVistos: false,
 *   page: 1,
 *   limit: 15
 * });
 */
const listarAlertasPorPropriedade = async (idPropriedade, filtros = {}) => {
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");
  
  const parts = [];

  // Filtro de nichos: CLINICO, SANITARIO, REPRODUCAO, MANEJO, PRODUCAO (aceita array ou string única)
  if (filtros.nichos !== undefined && filtros.nichos !== null) {
    const nichosArray = Array.isArray(filtros.nichos) ? filtros.nichos : [filtros.nichos];
    nichosArray
      .filter((n) => n !== null && n !== undefined && String(n).trim() !== "")
      .forEach((nicho) => {
        parts.push(`nichos=${encodeURIComponent(String(nicho).trim())}`);
      });
  }

  // Filtro incluirVistos: true/false
  if (filtros.incluirVistos !== undefined && filtros.incluirVistos !== null) {
    parts.push(`incluirVistos=${Boolean(filtros.incluirVistos)}`);
  }

  // Filtro de prioridade: BAIXA, MEDIA, ALTA
  if (filtros.prioridade && String(filtros.prioridade).trim() !== "") {
    parts.push(`prioridade=${encodeURIComponent(String(filtros.prioridade).trim())}`);
  }

  // Paginação
  const page = filtros.page || 1;
  const limit = filtros.limit || 10;
  if (Number.isInteger(Number(page)) && Number(page) > 0) {
    parts.push(`page=${Number(page)}`);
  }
  if (Number.isInteger(Number(limit)) && Number(limit) > 0) {
    parts.push(`limit=${Number(limit)}`);
  }

  const queryString = parts.length > 0 ? `?${parts.join("&")}` : "";
  const response = await get(`/alertas/propriedade/${idPropriedade}${queryString}`);
  return response.data;
};

/**
 * Busca um alerta específico por ID com detalhes completos.
 * GET /alertas/{id}
 *
 * @param {string} idAlerta - UUID do alerta (obrigatório)
 * @returns {Promise<Object>} Objeto completo do alerta com todas as informações detalhadas
 *
 * Exemplo de uso:
 * await buscarAlertaPorId('fca0965e-e5b4-4bb6-9346-6dec6034fd9c');
 * 
 * Retorna:
 * {
 *   id_alerta: string,
 *   animal_id: string,
 *   grupo: string,
 *   localizacao: string,
 *   motivo: string,
 *   nicho: string,
 *   data_alerta: string,
 *   prioridade: string,
 *   observacao: string,
 *   visto: boolean,
 *   id_evento_origem: string | null,
 *   tipo_evento_origem: string | null,
 *   id_propriedade: string,
 *   created_at: string,
 *   updated_at: string
 * }
 */
const buscarAlertaPorId = async (idAlerta) => {
  if (!idAlerta) throw new Error("ID do alerta é obrigatório");
  
  const response = await get(`/alertas/${idAlerta}`);
  return response.data;
};

/**
 * Marca um alerta como visto ou não visto para controle do usuário.
 * PATCH /alertas/{id}/visto
 *
 * @param {string} idAlerta - UUID do alerta (obrigatório)
 * @param {boolean} status - true = marcar como visto, false = marcar como não visto (obrigatório)
 * @returns {Promise<Object>} Objeto atualizado do alerta com o novo status de visualização
 *
 * **Funcionalidade:**
 * - Permite rastreamento de quais alertas já foram verificados
 * - Útil para filtrar apenas alertas pendentes de atenção
 * - Não afeta a prioridade ou outros dados do alerta
 *
 * Exemplos de uso:
 * 
 * // Marcar alerta como visto
 * await atualizarStatusVisto('fca0965e-e5b4-4bb6-9346-6dec6034fd9c', true);
 * 
 * // Marcar alerta como não visto
 * await atualizarStatusVisto('fca0965e-e5b4-4bb6-9346-6dec6034fd9c', false);
 * 
 * Retorna:
 * {
 *   id_alerta: string,
 *   animal_id: string,
 *   grupo: string,
 *   localizacao: string,
 *   motivo: string,
 *   nicho: string,
 *   data_alerta: string,
 *   prioridade: string,
 *   observacao: string,
 *   visto: boolean, // Atualizado com o novo status
 *   id_evento_origem: string | null,
 *   tipo_evento_origem: string | null,
 *   id_propriedade: string,
 *   created_at: string,
 *   updated_at: string
 * }
 */
const atualizarStatusVisto = async (idAlerta, status) => {
  if (!idAlerta) throw new Error("ID do alerta é obrigatório");
  if (typeof status !== "boolean") throw new Error("Status deve ser um valor booleano (true ou false)");
  
  const response = await patch(`/alertas/${idAlerta}/visto?status=${status}`);
  return response.data;
};

const alertaService = {
  verificarAlertasPorPropriedade,
  listarAlertasPorPropriedade,
  buscarAlertaPorId,
  atualizarStatusVisto,
};

export default alertaService;
