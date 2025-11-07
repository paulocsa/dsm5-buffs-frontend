"use client";

import { useState, useEffect } from "react";
import bufaloService from "@/services/bufaloService";
import racaService from "@/services/racaService";
import grupoService from "@/services/grupoService";

export default function CriarBufaloModal({ open, onClose, propriedadeId, onSuccess }) {
  const [formData, setFormData] = useState({
    nome: "",
    brinco: "",
    microchip: "",
    dt_nascimento: "",
    nivel_maturidade: "",
    sexo: "",
    id_raca: "",
    id_grupo: "",
    id_pai: "",
    id_mae: "",
    status: true,
    categoria: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [racas, setRacas] = useState([]);
  const [loadingRacas, setLoadingRacas] = useState(false);
  const [grupos, setGrupos] = useState([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [touros, setTouros] = useState([]);
  const [loadingTouros, setLoadingTouros] = useState(false);
  const [femeas, setFemeas] = useState([]);
  const [loadingFemeas, setLoadingFemeas] = useState(false);

  // Carregar raças, grupos, touros e fêmeas quando o modal abrir
  useEffect(() => {
    if (open) {
      const fetchRacas = async () => {
        setLoadingRacas(true);
        try {
          const data = await racaService.listarRacas();
          setRacas(data || []);
        } catch (err) {
          console.error("Erro ao carregar raças:", err);
          setRacas([]);
        } finally {
          setLoadingRacas(false);
        }
      };

      const fetchGrupos = async () => {
        if (!propriedadeId) return;
        setLoadingGrupos(true);
        try {
          const response = await grupoService.listarGruposPorPropriedade(propriedadeId, 1, 100);
          setGrupos(response.data || []);
        } catch (err) {
          console.error("Erro ao carregar grupos:", err);
          setGrupos([]);
        } finally {
          setLoadingGrupos(false);
        }
      };

      const fetchTouros = async () => {
        if (!propriedadeId) return;
        setLoadingTouros(true);
        try {
          const response = await bufaloService.filtrarBufalosAvancado({
            idPropriedade: propriedadeId,
            sexo: "M",
            nivelMaturidade: "T",
            status: true,
            limit: 100,
          });
          setTouros(response.data || []);
        } catch (err) {
          console.error("Erro ao carregar touros:", err);
          setTouros([]);
        } finally {
          setLoadingTouros(false);
        }
      };

      const fetchFemeas = async () => {
        if (!propriedadeId) return;
        setLoadingFemeas(true);
        try {
          // Buscar vacas (V) e novilhas (N) ativas
          const [vacas, novilhas] = await Promise.all([
            bufaloService.filtrarBufalosAvancado({
              idPropriedade: propriedadeId,
              sexo: "F",
              nivelMaturidade: "V",
              status: true,
              limit: 100,
            }),
            bufaloService.filtrarBufalosAvancado({
              idPropriedade: propriedadeId,
              sexo: "F",
              nivelMaturidade: "N",
              status: true,
              limit: 100,
            }),
          ]);
          setFemeas([...(vacas.data || []), ...(novilhas.data || [])]);
        } catch (err) {
          console.error("Erro ao carregar fêmeas:", err);
          setFemeas([]);
        } finally {
          setLoadingFemeas(false);
        }
      };

      fetchRacas();
      fetchGrupos();
      fetchTouros();
      fetchFemeas();
    }
  }, [open, propriedadeId]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await bufaloService.criarBufalo({
        ...formData,
        id_propriedade: propriedadeId,
      });
      onSuccess();
      onClose();
      // Resetar formulário
      setFormData({
        nome: "",
        brinco: "",
        microchip: "",
        dt_nascimento: "",
        nivel_maturidade: "",
        sexo: "",
        id_raca: "",
        id_grupo: "",
        id_pai: "",
        id_mae: "",
        status: true,
        categoria: "",
      });
    } catch (err) {
      setError("Erro ao criar búfalo. Verifique os dados e tente novamente.");
      console.error("Erro ao criar búfalo:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1001] p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header do Modal */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Novo Búfalo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Formulário */}
        <form className="p-6" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Dados do Búfalo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  name="nome"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brinco
                </label>
                <input
                  name="brinco"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={formData.brinco}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Microchip
                </label>
                <input
                  name="microchip"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={formData.microchip}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Nascimento *
                </label>
                <input
                  name="dt_nascimento"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                  value={formData.dt_nascimento}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexo *
                </label>
                <select
                  name="sexo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                  value={formData.sexo}
                  onChange={handleChange}
                >
                  <option value="">Selecione o sexo</option>
                  <option value="M">Macho</option>
                  <option value="F">Fêmea</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível de Maturidade *
                </label>
                <select
                  name="nivel_maturidade"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                  value={formData.nivel_maturidade}
                  onChange={handleChange}
                >
                  <option value="">Selecione a maturidade</option>
                  <option value="B">Bezerro(a)</option>
                  <option value="N">Novilho(a)</option>
                  <option value="V">Vaca</option>
                  <option value="T">Touro</option>
                  <option value="A">Adulto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raça
                </label>
                <select
                  name="id_raca"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={formData.id_raca}
                  onChange={handleChange}
                  disabled={loadingRacas}
                >
                  <option value="">
                    {loadingRacas ? "Carregando raças..." : "Selecione uma raça"}
                  </option>
                  {racas.map((raca) => (
                    <option key={raca.id_raca} value={raca.id_raca}>
                      {raca.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grupo
                </label>
                <select
                  name="id_grupo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={formData.id_grupo}
                  onChange={handleChange}
                  disabled={loadingGrupos}
                >
                  <option value="">
                    {loadingGrupos ? "Carregando grupos..." : "Selecione um grupo"}
                  </option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id_grupo} value={grupo.id_grupo}>
                      {grupo.nome_grupo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pai (Touro)
                </label>
                <select
                  name="id_pai"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={formData.id_pai}
                  onChange={handleChange}
                  disabled={loadingTouros}
                >
                  <option value="">
                    {loadingTouros ? "Carregando touros..." : "Selecione o pai"}
                  </option>
                  {touros.map((touro) => (
                    <option key={touro.id_bufalo} value={touro.id_bufalo}>
                      {touro.nome} {touro.brinco ? `(${touro.brinco})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mãe (Vaca/Novilha)
                </label>
                <select
                  name="id_mae"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={formData.id_mae}
                  onChange={handleChange}
                  disabled={loadingFemeas}
                >
                  <option value="">
                    {loadingFemeas ? "Carregando fêmeas..." : "Selecione a mãe"}
                  </option>
                  {femeas.map((femea) => (
                    <option key={femea.id_bufalo} value={femea.id_bufalo}>
                      {femea.nome} {femea.brinco ? `(${femea.brinco})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  name="categoria"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={formData.categoria}
                  onChange={handleChange}
                >
                  <option value="">Selecione a categoria</option>
                  <option value="PO">PO </option>
                  <option value="PC">PC </option>
                  <option value="PA">PA </option>
                  <option value="CCG">CCG </option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center space-x-3">
                  <input
                    name="status"
                    type="checkbox"
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    checked={formData.status}
                    onChange={handleChange}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Búfalo Ativo
                    </span>
                    <p className="text-xs text-gray-500">
                      Marque se o búfalo está ativo no rebanho
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
          {error && <div className="text-red-500 mt-4">{error}</div>}
          {/* Botões */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#FFCF78] text-gray-800 rounded-lg hover:bg-[#F2B84D] transition-colors font-medium"
              disabled={loading}
            >
              {loading ? "Cadastrando..." : "Cadastrar Búfalo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}