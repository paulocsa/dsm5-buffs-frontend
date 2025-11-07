import { get, patch, del, post } from "@/lib/apiClient";

/**
 * Lista as indústrias associadas a uma propriedade específica
 * @param {string} idPropriedade - ID da propriedade (UUID)
 * @returns {Promise<Array>} Array de indústrias
 */
const listarIndustriasPorPropriedade = async (idPropriedade) => {
  if (!idPropriedade) throw new Error("ID da propriedade é obrigatório");
  const response = await get(`/industrias/propriedade/${idPropriedade}`);
  return response.data;
};

/**
 * Busca uma indústria pelo ID
 * @param {string} idIndustria - ID da indústria (UUID)
 * @returns {Promise<Object>} Indústria encontrada
 */
const buscarIndustriaPorId = async (idIndustria) => {
  if (!idIndustria) throw new Error("ID da indústria é obrigatório");
  const response = await get(`/industrias/${idIndustria}`);
  return response.data;
};

/**
 * Atualiza os dados de uma indústria pelo ID
 * @param {string} idIndustria - ID da indústria (UUID)
 * @param {Object} data - Dados para atualização
 * @returns {Promise<Object>} Indústria atualizada
 */
const atualizarIndustriaPorId = async (idIndustria, data) => {
  if (!idIndustria) throw new Error("ID da indústria é obrigatório");
  const response = await patch(`/industrias/${idIndustria}`, data);
  return response.data;
};

/**
 * Remove uma indústria pelo ID
 * @param {string} idIndustria - ID da indústria (UUID)
 * @returns {Promise<Object>} Resultado da exclusão
 */
const removerIndustriaPorId = async (idIndustria) => {
  if (!idIndustria) throw new Error("ID da indústria é obrigatório");
  const response = await del(`/industrias/${idIndustria}`);
  return response.data;
};

/**
 * Cria uma nova indústria
 * @param {Object} data - Dados da indústria
 * @returns {Promise<Object>} Indústria criada
 */
const criarIndustria = async (data) => {
  if (!data || !data.id_propriedade || !data.nome) throw new Error("Dados obrigatórios ausentes");
  const response = await post("/industrias", data);
  return response.data;
};

const industriaService = {
  listarIndustriasPorPropriedade,
  buscarIndustriaPorId,
  atualizarIndustriaPorId,
  removerIndustriaPorId,
  criarIndustria,
};

export default industriaService;
