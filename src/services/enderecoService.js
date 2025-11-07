import { get, post, patch, del } from "@/lib/apiClient";
// Edita um endereço existente
const editarEndereco = async (id, dadosEndereco) => {
  if (!id) throw new Error("ID do endereço é obrigatório");
  if (!dadosEndereco || typeof dadosEndereco !== "object") {
    throw new Error("Dados do endereço são obrigatórios e devem ser um objeto");
  }
  const response = await patch(`/enderecos/${id}`, dadosEndereco);
  return response.data;
};

// Alias para compatibilidade com EditModal
const atualizarEndereco = editarEndereco;

// Busca um endereço específico pelo ID
const buscarEnderecoPorId = async (id) => {
  if (!id) throw new Error("ID do endereço é obrigatório");
  const response = await get(`/enderecos/${id}`);
  return response.data;
};

// Cadastra um novo endereço
const cadastrarEndereco = async (dadosEndereco) => {
  if (!dadosEndereco || typeof dadosEndereco !== "object") {
    throw new Error("Dados do endereço são obrigatórios e devem ser um objeto");
  }
  const response = await post("/enderecos", dadosEndereco);
  return response.data;
};

// Deleta um endereço
const deletarEndereco = async (id) => {
  const response = await del(`/enderecos/${id}`);
  return response.data;
};

const enderecoService = {
  buscarEnderecoPorId,
  cadastrarEndereco,
  editarEndereco,
  atualizarEndereco,
  deletarEndereco,
};

export default enderecoService;
