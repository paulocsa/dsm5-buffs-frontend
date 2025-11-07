import { get, post, patch, del } from "@/lib/apiClient";

/**
 * Busca registros de alimentação por propriedade
 * @param {string} idPropriedade
 * @returns {Promise<Array>}
 */
const listarRegistrosPorPropriedade = async (idPropriedade) => {
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");
  const response = await get(`/alimentacao/registros/propriedade/${idPropriedade}`);
  return response.data;
};

/**
 * Cria um registro de alimentação
 * @param {Object} data {
 *   id_propriedade: string,
 *   id_grupo: string,
 *   id_aliment_def: string,
 *   id_usuario: string,
 *   quantidade: number,
 *   unidade_medida: string,
 *   freq_dia?: number,
 *   dt_registro?: string
 * }
 * @returns {Promise<Object>} Registro criado
 */
const criarRegistroAlimentacao = async (data) => {
  if (!data?.id_propriedade || !data?.id_grupo || !data?.id_aliment_def || !data?.id_usuario || !data?.quantidade || !data?.unidade_medida) {
    throw new Error("Campos obrigatórios ausentes");
  }
  const response = await post("/alimentacao/registros", data);
  return response.data;
};

/**
 * Atualiza parcialmente um registro de alimentação
 * @param {string} idRegistro - ID do registro
 * @param {Object} data - Campos a atualizar (todos opcionais)
 * @returns {Promise<Object>} Registro atualizado
 */
const atualizarRegistroAlimentacao = async (idRegistro, data) => {
  if (!idRegistro) throw new Error("ID do registro é obrigatório");
  const response = await patch(`/alimentacao/registros/${idRegistro}`, data);
  return response.data;
};

/**
 * Remove um registro de alimentação
 * @param {string} idRegistro - ID do registro
 * @returns {Promise<Object>} Resultado da remoção
 */
const removerRegistroAlimentacao = async (idRegistro) => {
  if (!idRegistro) throw new Error("ID do registro é obrigatório");
  const response = await del(`/alimentacao/registros/${idRegistro}`);
  return response.data;
};

const alimentacaoRegistroService = {
  listarRegistrosPorPropriedade,
  criarRegistroAlimentacao,
  atualizarRegistroAlimentacao,
  removerRegistroAlimentacao,
};

export default alimentacaoRegistroService;
