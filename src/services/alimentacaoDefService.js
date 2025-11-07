import { get, post, patch, del } from "@/lib/apiClient";

/**
 * Busca definições de alimentação por propriedade
 * @param {string} idPropriedade
 * @returns {Promise<Array>}
 */
const listarDefinicoesPorPropriedade = async (idPropriedade) => {
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");
  const response = await get(`/alimentacoes-def/propriedade/${idPropriedade}`);
  return response.data;
};

/**
 * Cria uma nova definição de alimentação
 * @param {Object} data { id_propriedade, tipo_alimentacao, descricao? }
 * @returns {Promise<Object>} Definição criada
 */
const criarDefinicaoAlimentacao = async (data) => {
  if (!data?.id_propriedade || !data?.tipo_alimentacao) {
    throw new Error("Campos obrigatórios: id_propriedade e tipo_alimentacao");
  }
  const response = await post("/alimentacoes-def", data);
  return response.data;
};

/**
 * Atualiza uma definição de alimentação
 * @param {string} idAlimentDef
 * @param {Object} data { id_propriedade, tipo_alimentacao, descricao? }
 * @returns {Promise<Object>} Definição atualizada
 */
const atualizarDefinicaoAlimentacao = async (idAlimentDef, data) => {
  if (!idAlimentDef) throw new Error("ID da definição é obrigatório");
  const response = await patch(`/alimentacoes-def/${idAlimentDef}`, data);
  return response.data;
};

/**
 * Remove uma definição de alimentação
 * @param {string} idAlimentDef
 * @returns {Promise<Object>} Resultado da remoção
 */
const removerDefinicaoAlimentacao = async (idAlimentDef) => {
  if (!idAlimentDef) throw new Error("ID da definição é obrigatório");
  const response = await del(`/alimentacoes-def/${idAlimentDef}`);
  return response.data;
};

const alimentacaoDefService = {
  listarDefinicoesPorPropriedade,
  criarDefinicaoAlimentacao,
  atualizarDefinicaoAlimentacao,
  removerDefinicaoAlimentacao,
};

export default alimentacaoDefService;
