import React, { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { usePropriedade } from "@/contexts/propriedadeContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import dashboardService from "@/services/dashboardService";
import alertaService from "@/services/alertaService";
import bufaloService from "@/services/bufaloService";
import ProducaoModal from "@/components/proprietario/lactacao/ProducaoModal";
import AlertaDetalhesModal from "@/components/proprietario/lactacao/AlertaDetalhesModal";
import lactacaoService from "@/services/lactacaoService";

export default function Lactacao() {
  // obter id da propriedade via context
  const { propriedadeId } = usePropriedade();

  // Estado para búfalas lactando
  const [bufalasLactando, setBufalasLactando] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertasLactacao, setAlertasLactacao] = useState([]);
  const [alertasLoading, setAlertasLoading] = useState(false);
  const [alertasError, setAlertasError] = useState(null);
  const [alertasSummary, setAlertasSummary] = useState(null); // quando backend retorna apenas o resumo da verificação
  // paginação
  const [alertasPage, setAlertasPage] = useState(1);
  const [alertasLimit, setAlertasLimit] = useState(2); // Mostrar apenas 2 alertas por página
  const [alertasTotal, setAlertasTotal] = useState(0); // total vindo do servidor (se houver)
  const [mostrarTodosAlertas, setMostrarTodosAlertas] = useState(false); // Toggle para mostrar alertas visualizados
  // Cache de nomes de búfalos para evitar múltiplas chamadas à API
  const [bufaloNamesCache, setBufaloNamesCache] = useState({});

  // Estado para produção mensal
  const [producaoMensal, setProducaoMensal] = useState(null);
  const [producaoLoading, setProducaoLoading] = useState(false);
  const [producaoError, setProducaoError] = useState(null);

  // Estado para estatísticas dos ciclos de lactação
  const [estatisticasCiclos, setEstatisticasCiclos] = useState(null);
  const [loadingEstatisticas, setLoadingEstatisticas] = useState(false);
  const [errorEstatisticas, setErrorEstatisticas] = useState(null);

  // Função para buscar produção mensal
  const fetchProducaoMensal = async (ano = new Date().getFullYear()) => {
    if (!propriedadeId) return;
    setProducaoLoading(true);
    setProducaoError(null);
    try {
      const data = await dashboardService.getProducaoMensalByPropriedadeId(
        propriedadeId,
        ano
      );
      console.log("📊 Dados de Produção Mensal:", data);
      console.log("📊 Série Histórica:", data?.serie_historica);
      setProducaoMensal(data);
    } catch (err) {
      console.error("❌ Erro ao buscar produção mensal:", err);
      setProducaoError(
        "Não foi possível carregar os dados de produção mensal."
      );
    } finally {
      setProducaoLoading(false);
    }
  };

  // Função para buscar alertas de produção (apenas clínicos)
  const fetchAlertasProducao = async (
    page = alertasPage,
    limit = alertasLimit
  ) => {
    if (!propriedadeId) return;
    setAlertasLoading(true);
    setAlertasError(null);
    try {
      // Buscar apenas alertas clínicos usando o novo formato do serviço
      const data = await alertaService.listarAlertasPorPropriedade(
        propriedadeId,
        {
          nichos: 'CLINICO', // Filtrar apenas alertas clínicos
          incluirVistos: mostrarTodosAlertas, // true = mostrar todos, false = mostrar apenas não visualizados
          page,
          limit,
        }
      );

      // Se o backend retornou apenas o resumo da verificação (POST /alertas/verificar)
      if (
        data &&
        typeof data.success === "boolean" &&
        (data.alertas_criados !== undefined ||
          data.nichos_verificados !== undefined)
      ) {
        setAlertasSummary(data);
        setAlertasLactacao([]);
        setAlertasTotal(0);
        setAlertasLoading(false);
        return;
      }

      // Otherwise limpa summary e processa listas
      setAlertasSummary(null);

      // Se o backend devolve um objeto com { data, meta }
      if (data && data.data && Array.isArray(data.data)) {
        const normalized = sortAndNormalizeAlertas(data.data);
        setAlertasLactacao(normalized);
        if (data.meta && typeof data.meta.total === "number")
          setAlertasTotal(data.meta.total);
        else setAlertasTotal(null);
        
        // Buscar nomes dos búfalos dos alertas
        const animalIds = normalized
          .map(a => a.raw?.animal_id)
          .filter(id => id);
        if (animalIds.length > 0) {
          fetchBufaloNames(animalIds);
        }
      } else if (Array.isArray(data)) {
        // Recebeu array direto (backend sem paginação) -> armazenar e paginar client-side
        const normalized = sortAndNormalizeAlertas(data);
        setAlertasLactacao(normalized);
        setAlertasTotal(data.length);
        
        // Buscar nomes dos búfalos dos alertas
        const animalIds = normalized
          .map(a => a.raw?.animal_id)
          .filter(id => id);
        if (animalIds.length > 0) {
          fetchBufaloNames(animalIds);
        }
      } else if (data && Array.isArray(data.alertas)) {
        const normalized = sortAndNormalizeAlertas(data.alertas);
        setAlertasLactacao(normalized);
        setAlertasTotal(
          Array.isArray(data.alertas) ? data.alertas.length : null
        );
        
        // Buscar nomes dos búfalos dos alertas
        const animalIds = normalized
          .map(a => a.raw?.animal_id)
          .filter(id => id);
        if (animalIds.length > 0) {
          fetchBufaloNames(animalIds);
        }
      } else {
        setAlertasLactacao([]);
        setAlertasTotal(0);
      }
    } catch (err) {
      console.error("❌ Erro ao buscar alertas clínicos:", err);
      setAlertasError("Não foi possível carregar alertas clínicos.");
      setAlertasLactacao([]);
      setAlertasTotal(0);
    } finally {
      setAlertasLoading(false);
    }
  };

  // ordena por data decrescente (se houver) e normaliza campos
  const sortAndNormalizeAlertas = (arr) => {
    const normalized = arr.map((a) => ({
      id: a.id_alerta || a.id,
      tipo: a.motivo || a.tipo || a.titulo || a.nicho || 'Alerta',
      mensagem: a.observacao || a.mensagem || a.descricao || a.texto || a.message || "",
      data: getAlertDate(a),
      prioridade: a.prioridade,
      nicho: a.nicho,
      localizacao: a.localizacao,
      grupo: a.grupo,
      visto: a.visto,
      raw: a,
    }));
    normalized.sort((x, y) => {
      if (x.data && y.data) return new Date(y.data) - new Date(x.data);
      if (x.data) return -1;
      if (y.data) return 1;
      return 0;
    });
    return normalized;
  };

  const getAlertDate = (a) => {
    if (!a) return null;
    const candidates = [
      "data_alerta",
      "created_at",
      "createdAt",
      "dt_registro",
      "data",
      "dt",
      "timestamp",
    ];
    for (const k of candidates) {
      if (a[k]) return a[k];
    }
    // try nested
    if (a.raw && a.raw.data) return a.raw.data;
    return null;
  };

  // Dispara verificação/geração de alertas apenas para produção e recarrega a lista
  const verificarAlertasProducao = async () => {
    if (!propriedadeId) return;
    setAlertasLoading(true);
    setAlertasError(null);

    // Simulando verificação com delay
    setTimeout(() => {
      setAlertasSummary({
        success: true,
        message: "Verificação de produção concluída",
        propriedade: "Fazenda Exemplo",
        nichos_verificados: ["Lactação", "Ordenha", "Produção Diária"],
        alertas_criados: 2,
      });
      setAlertasLoading(false);

      // Limpar resumo após 5 segundos
      setTimeout(() => {
        setAlertasSummary(null);
      }, 5000);
    }, 1500);
  };

  // Função para buscar nomes de búfalos e popular o cache
  const fetchBufaloNames = async (animalIds) => {
    if (!animalIds || animalIds.length === 0) return;
    
    // Filtrar IDs que ainda não estão no cache
    const idsToFetch = animalIds.filter(id => id && !bufaloNamesCache[id]);
    
    if (idsToFetch.length === 0) return; // Todos já estão no cache
    
    // Buscar búfalos em lote
    const promises = idsToFetch.map(async (id) => {
      try {
        const bufalo = await bufaloService.buscarBufaloPorId(id);
        return { id, nome: bufalo?.nome || bufalo?.brinco || 'Sem nome' };
      } catch (err) {
        console.error(`Erro ao buscar búfalo ${id}:`, err);
        return { id, nome: 'Desconhecido' };
      }
    });
    
    const results = await Promise.all(promises);
    
    // Atualizar cache
    const newCache = { ...bufaloNamesCache };
    results.forEach(({ id, nome }) => {
      newCache[id] = nome;
    });
    setBufaloNamesCache(newCache);
  };

  useEffect(() => {
    if (propriedadeId) {
      console.log("🔄 Carregando dados da propriedade:", propriedadeId);
      setLoading(true);
      dashboardService
        .getDashboardStatsByPropriedadeId(propriedadeId)
        .then((data) => {
          console.log("✅ Dashboard Stats recebido:", data);
          console.log("  - Búfalas lactando:", data.qtd_bufalas_lactando);
          setBufalasLactando(data.qtd_bufalas_lactando);
          setLoading(false);
        })
        .catch((err) => {
          console.error("❌ Erro ao carregar dashboard stats:", err);
          setError("Erro ao carregar búfalas lactando.");
          setLoading(false);
        });
      // Dados mockados já carregados no useState inicial
      fetchProducaoMensal();
      // Buscar alertas clínicos da API
      fetchAlertasProducao();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propriedadeId]);

  // Buscar alertas quando a paginação mudar
  useEffect(() => {
    if (propriedadeId) {
      fetchAlertasProducao(alertasPage, alertasLimit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertasPage, alertasLimit, mostrarTodosAlertas]);

  // Calcular alertas paginados (se a API não fizer paginação server-side)
  const alertasPaginados = useMemo(() => {
    // Se a API já retorna paginado, usar diretamente alertasLactacao
    // Caso contrário, fazer paginação client-side
    if (alertasTotal && alertasLactacao.length <= alertasLimit) {
      return alertasLactacao; // API já retornou apenas a página atual
    }
    // Fallback: paginação client-side
    const start = (alertasPage - 1) * alertasLimit;
    return alertasLactacao.slice(start, start + alertasLimit);
  }, [alertasLactacao, alertasPage, alertasLimit, alertasTotal]);

  // Corrigir erro: definir totalBufalasLactando a partir do estado
  const totalBufalasLactando = bufalasLactando ?? 0;

  // ==== MOCKS: indicadores header ====
  // Usar dados reais do backend de produção mensal
  const litrosMesAtual = producaoMensal?.mes_atual_litros || 0;
  const litrosMesAnterior = producaoMensal?.mes_anterior_litros || 0;
  const variacaoMes = producaoMensal?.variacao_percentual || 0;
  const bufalasLactantesAtual =
    producaoMensal?.bufalas_lactantes_atual || totalBufalasLactando;
  const variacaoMesLabel =
    variacaoMes >= 0
      ? `+${variacaoMes.toFixed(1)}%`
      : `${variacaoMes.toFixed(1)}%`;
  const variacaoMesColor =
    variacaoMes >= 0 ? "text-emerald-700" : "text-red-700";

  // ==== MOCK: gráfico mês a mês ====
  const graficoProducaoMes = useMemo(() => {
    if (!producaoMensal?.serie_historica) {
      console.log("⚠️ Nenhum dado de série histórica encontrado");
      return [];
    }

    console.log(
      "📈 Processando série histórica para o gráfico:",
      producaoMensal.serie_historica
    );

    return producaoMensal.serie_historica.map((item) => {
      const mesFormatado = new Date(item.mes + "-01").toLocaleString("pt-BR", {
        month: "short",
      });
      console.log(`  - ${item.mes}: ${item.total_litros}L (${mesFormatado})`);
      return {
        mes: mesFormatado,
        litros: item.total_litros,
      };
    });
  }, [producaoMensal]);

  // Memoized chart component to avoid re-render when parent state (like alertas pagination) changes
  const ProductionChart = React.useMemo(
    () =>
      React.memo(function ProductionChartInner({ data }) {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(v) => [`${v} L`, "Litros"]} />
              <Line
                type="monotone"
                dataKey="litros"
                stroke="#CE7D0A"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      }),
    []
  );

  // ==== MOCK: ranking bufalas ====
  // Dados reais de lactação vindo do dashboard
  const [lactacaoStats, setLactacaoStats] = useState(null);
  const [lactacaoLoading, setLactacaoLoading] = useState(false);
  const [lactacaoError, setLactacaoError] = useState(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  // Paginação do ranking (comportamento semelhante a src/pages/proprietario/rebanho.js)
  const [lactacaoPage, setLactacaoPage] = useState(1);
  const [lactacaoLimit, setLactacaoLimit] = useState(10);

  // Estado para o modal de produção
  const [modalProducaoOpen, setModalProducaoOpen] = useState(false);
  const [bufalaIdSelecionada, setBufalaIdSelecionada] = useState(null);

  // Estado para o modal de alerta
  const [modalAlertaOpen, setModalAlertaOpen] = useState(false);
  const [alertaIdSelecionado, setAlertaIdSelecionado] = useState(null);

  // Função para abrir o modal de produção
  const abrirModalProducao = (idBufala) => {
    setBufalaIdSelecionada(idBufala);
    setModalProducaoOpen(true);
  };

  // Função para fechar o modal de produção
  const fecharModalProducao = () => {
    setModalProducaoOpen(false);
    setBufalaIdSelecionada(null);
  };

  // Função para abrir o modal de alerta
  const abrirModalAlerta = (idAlerta) => {
    setAlertaIdSelecionado(idAlerta);
    setModalAlertaOpen(true);
  };

  // Função para fechar o modal de alerta
  const fecharModalAlerta = () => {
    setModalAlertaOpen(false);
    setAlertaIdSelecionado(null);
  };

  // Busca dados do dashboard para o ano selecionado
  const fetchLactacaoStats = async (ano = selectedYear) => {
    if (!propriedadeId) return;
    setLactacaoLoading(true);
    setLactacaoError(null);
    try {
      const data = await dashboardService.getLactacaoStatsByPropriedadeId(
        propriedadeId,
        ano
      );
      setLactacaoStats(data);
    } catch (err) {
      setLactacaoError("Erro ao carregar estatísticas de lactação.");
      setLactacaoStats(null);
    } finally {
      setLactacaoLoading(false);
    }
  };

  // Buscar estatísticas dos ciclos de lactação
  useEffect(() => {
    const fetchEstatisticasCiclos = async () => {
      if (!propriedadeId) return;
      setLoadingEstatisticas(true);
      try {
        const data = await lactacaoService.buscarEstatisticasCiclosPorPropriedade(propriedadeId);
        setEstatisticasCiclos(data);
      } catch (error) {
        setErrorEstatisticas(error);
      } finally {
        setLoadingEstatisticas(false);
      }
    };

    fetchEstatisticasCiclos();
  }, [propriedadeId]);

  // Buscar quando propriedadeId ou ano mudarem
  useEffect(() => {
    if (propriedadeId) {
      fetchLactacaoStats(selectedYear);
    }
  }, [propriedadeId, selectedYear]);

  // Indicadores
  const totalCiclos = estatisticasCiclos?.total_ciclos || 0;
  const ciclosAtivos = estatisticasCiclos?.ciclos_ativos || 0;
  const ciclosSecos = estatisticasCiclos?.ciclos_secos || 0;
  const mediaDiasLactacao = estatisticasCiclos?.media_dias_lactacao || 0;



  // Ranking derivado dos ciclos retornados pelo dashboard
  const rankingBufalas = useMemo(() => {
    if (!lactacaoStats?.ciclos) return [];

    // O backend retorna DashboardLactacaoDto com array de CicloLactacaoMetricaDto
    // Já vem ordenado de melhor para pior classificação
    return lactacaoStats.ciclos.map((ciclo, index) => ({
      posicao: index + 1,
      id_bufala: ciclo.id_bufala,
      nome_bufala: ciclo.nome_bufala,
      numero_parto: ciclo.numero_parto,
      dt_parto: ciclo.dt_parto,
      dt_secagem_real: ciclo.dt_secagem_real,
      dias_em_lactacao: ciclo.dias_em_lactacao,
      media_lactacao: ciclo.media_lactacao,
      lactacao_total: ciclo.lactacao_total,
      classificacao: ciclo.classificacao, // 'Ótima', 'Boa', 'Mediana', 'Ruim'
    }));
  }, [lactacaoStats]);

  // Paginação client-side: derive página atual e meta a partir do ranking completo
  const lactacaoMeta = useMemo(() => {
    const total = rankingBufalas.length;
    const totalPages = Math.max(1, Math.ceil(total / lactacaoLimit));
    // ensure current page within bounds
    const page = Math.min(Math.max(1, lactacaoPage), totalPages);
    return { page, totalPages, total };
  }, [rankingBufalas.length, lactacaoLimit, lactacaoPage]);

  const paginatedRanking = useMemo(() => {
    const start = (lactacaoMeta.page - 1) * lactacaoLimit;
    return rankingBufalas.slice(start, start + lactacaoLimit);
  }, [rankingBufalas, lactacaoMeta, lactacaoLimit]);

  return (
    <>
      <Head>
        <title>Lactação | Buffs</title>
        <meta
          name="description"
          content="Dashboard de lactação e produção de leite"
        />
      </Head>
      <div className="p-6 flex flex-col gap-8">
        {/* Header - Indicadores de Lactação */}
        <div className="w-full flex flex-col bg-white rounded-xl p-6 gap-6 box-border border border-[#e0e0e0] shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Controle de Produção
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-lg shadow border border-[#e0e0e0] flex flex-col gap-1">
              <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Búfalas Lactando
              </span>
              {loading ? (
                <span className="text-gray-500">Carregando...</span>
              ) : error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                <>
                  <span className="text-4xl font-extrabold tracking-tight text-[var(--color-text-dark)]">
                    {bufalasLactantesAtual}
                  </span>
                  {producaoMensal?.bufalas_lactantes_atual && (
                    <span className="text-xs text-gray-500">
                      Dados do mês atual
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-[#e0e0e0] flex flex-col gap-1">
              <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Leite produzido (mês atual)
              </span>
              <span className="text-4xl font-extrabold tracking-tight text-[var(--color-text-dark)]">
                {litrosMesAtual.toFixed(1)} L
              </span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-[#e0e0e0] flex flex-col gap-1">
              <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Comparação mês anterior
              </span>
              <span className={`text-2xl font-bold ${variacaoMesColor}`}>
                {variacaoMesLabel}
              </span>
              <span className="text-xs text-gray-500">
                {litrosMesAnterior.toFixed(1)} L no mês anterior
              </span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-[#e0e0e0] flex flex-col gap-1">
              <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Total de Ciclos
              </span>
              {loadingEstatisticas ? (
                <span className="text-gray-500">Carregando...</span>
              ) : errorEstatisticas ? (
                <span className="text-red-500">Erro</span>
              ) : (
                <span className="text-4xl font-extrabold tracking-tight text-[var(--color-text-dark)]">
                  {totalCiclos}
                </span>
              )}
            </div>
          </div>
        </div>

        

        {/* Gráfico produção mês a mês + painel de alertas */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl p-5 box-border border border-[#e0e0e0] shadow-sm flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Produção mês a mês (
              {producaoMensal?.ano || new Date().getFullYear()})
            </h2>
            {producaoLoading ? (
              <div className="text-gray-500 text-center py-20">
                Carregando dados de produção...
              </div>
            ) : producaoError ? (
              <div className="text-red-500 text-center py-20">
                {producaoError}
              </div>
            ) : (
              <ProductionChart data={graficoProducaoMes} />
            )}
          </div>
          <div className="bg-white rounded-xl box-border border border-[#e0e0e0] shadow-sm flex flex-col h-full">
            {/* Header fixo */}
            <div className="flex items-center justify-between border-b border-gray-200 p-5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-800">
                  Alertas Clínicos
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMostrarTodosAlertas(!mostrarTodosAlertas);
                    setAlertasPage(1); // Resetar para primeira página ao trocar filtro
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    mostrarTodosAlertas
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-[#FFCF78] text-gray-800 hover:bg-[#F2B84D]'
                  }`}
                  title={mostrarTodosAlertas ? 'Mostrar apenas não vistos' : 'Mostrar todos os alertas'}
                >
                  {mostrarTodosAlertas ? 'Não Vistos' : 'Ver Todos'}
                </button>
                {alertasTotal > 0 && !alertasLoading && (
                  <span className="bg-[#CE7D0A] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {alertasTotal}
                  </span>
                )}
              </div>
            </div>

            {/* Conteúdo - altura fixa sem scroll */}
            <div className="flex-1 px-5 py-4 flex flex-col justify-between" style={{ minHeight: '280px' }}>
              {alertasLoading ? (
                <div className="text-gray-500 text-sm flex items-center justify-center h-full">Carregando alertas...</div>
              ) : alertasError ? (
                <div className="text-red-500 text-sm flex items-center justify-center h-full">{alertasError}</div>
              ) : alertasSummary ? (
                <div className="text-sm text-gray-700">
                  <div className="font-semibold">{alertasSummary.message}</div>
                  <div className="mt-2">
                    Propriedade: {alertasSummary.propriedade}
                  </div>
                  <div>
                    Nichos verificados:{" "}
                    {Array.isArray(alertasSummary.nichos_verificados)
                      ? alertasSummary.nichos_verificados.join(", ")
                      : alertasSummary.nichos_verificados || ""}
                  </div>
                  <div>
                    Alertas criados: {alertasSummary.alertas_criados ?? 0}
                  </div>
                </div>
              ) : alertasLactacao.length === 0 ? (
                <div className="text-gray-500 text-sm text-center flex items-center justify-center h-full">
                  Nenhum alerta no momento.
                </div>
              ) : (
                <div className="space-y-3 flex-1">
                  {alertasPaginados.map((a, i) => {
                    // Define cor da borda e background baseada na prioridade
                    const getPrioridadeStyle = (prioridade) => {
                      switch (prioridade) {
                        case 'ALTA':
                          return {
                            borderColor: '#DC2626',
                            bgColor: 'bg-red-50',
                            badgeClass: 'bg-red-100 text-red-800 border-red-300',
                          };
                        case 'MEDIA':
                          return {
                            borderColor: '#F59E0B',
                            bgColor: 'bg-orange-50',
                            badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
                          };
                        case 'BAIXA':
                          return {
                            borderColor: '#3B82F6',
                            bgColor: 'bg-blue-50',
                            badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
                          };
                        default:
                          return {
                            borderColor: '#9CA3AF',
                            bgColor: 'bg-gray-50',
                            badgeClass: 'bg-gray-100 text-gray-800 border-gray-300',
                          };
                      }
                    };

                    const style = getPrioridadeStyle(a.prioridade);
                    
                    // Obter nome do búfalo do cache
                    const animalId = a.raw?.animal_id;
                    const bufaloNome = animalId ? bufaloNamesCache[animalId] : null;

                    return (
                      <div
                        key={a.id || i}
                        onClick={() => abrirModalAlerta(a.id)}
                        className={`border-l-4 ${style.bgColor} rounded-r-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-all`}
                        style={{
                          borderColor: style.borderColor,
                        }}
                      >
                        <div className="flex flex-col gap-2">
                          {/* Cabeçalho com tipo, prioridade e data */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="font-bold text-gray-900 text-sm">
                                {a.tipo || "Alerta"}
                              </span>
                              {a.prioridade && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${style.badgeClass}`}
                                >
                                  {a.prioridade}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {a.data
                                ? new Date(a.data).toLocaleString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>

                          {/* Nome do búfalo e grupo em uma linha */}
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            {bufaloNome && (
                              <div className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="font-semibold text-gray-800">
                                  {bufaloNome}
                                </span>
                              </div>
                            )}
                            {a.grupo && (
                              <div className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span>{a.grupo}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Paginação fixa no rodapé */}
            {!alertasLoading && !alertasError && !alertasSummary && alertasLactacao.length > 0 && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span>
                    Total: <span className="font-semibold">{alertasTotal || 0}</span> alerta{alertasTotal !== 1 ? 's' : ''}
                  </span>
                  <span>
                    Página {alertasPage} de {Math.max(1, Math.ceil(alertasTotal / alertasLimit))}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    disabled={alertasPage <= 1}
                    onClick={() => setAlertasPage((p) => Math.max(1, p - 1))}
                    className={`py-1.5 px-4 rounded-md text-sm font-medium transition-colors ${
                      alertasPage <= 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-[#FFCF78] hover:bg-[#F2B84D] text-gray-800 shadow-sm"
                    }`}
                  >
                    Anterior
                  </button>
                  <button
                    disabled={
                      alertasPage >= Math.ceil(alertasTotal / alertasLimit)
                    }
                    onClick={() => setAlertasPage((p) => p + 1)}
                    className={`py-1.5 px-4 rounded-md text-sm font-medium transition-colors ${
                      alertasPage >= Math.ceil(alertasTotal / alertasLimit)
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-[#FFCF78] hover:bg-[#F2B84D] text-gray-800 shadow-sm"
                    }`}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabela ranking das melhores búfalas */}
        <div className="w-full flex flex-col bg-white rounded-xl p-5 gap-4 box-border border border-[#e0e0e0] shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Búfalas em Lactação
            </h2>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Ano:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = currentYear - i;
                  return (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          {lactacaoStats?.media_rebanho_ano && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="text-sm font-semibold text-blue-800">
                Média do Rebanho ({selectedYear}):{" "}
              </span>
              <span className="text-lg font-bold text-blue-900">
                {lactacaoStats.media_rebanho_ano.toFixed(2)} L
              </span>
            </div>
          )}
          <p className="text-gray-600">
            {lactacaoLoading
              ? "Carregando..."
              : lactacaoError
              ? lactacaoError
              : `Lista completa de búfalas em lactação com ${lactacaoMeta.total} animais.`}
          </p>
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse min-w-[650px] bg-white rounded-lg overflow-hidden shadow-sm">
              <thead className="bg-[#f0f0f0]">
                <tr>
                  <th className="p-3 text-center font-medium text-gray-800 text-base">
                    Nome
                  </th>
                  <th className="p-3 text-center font-medium text-gray-800 text-base">
                    Parto
                  </th>
                  <th className="p-3 text-center font-medium text-gray-800 text-base">
                    Data Parto
                  </th>
                  <th className="p-3 text-center font-medium text-gray-800 text-base">
                    Data Secagem
                  </th>
                  <th className="p-3 text-center font-medium text-gray-800 text-base">
                    Dias em Lactação
                  </th>
                  <th className="p-3 text-center font-medium text-gray-800 text-base">
                    Média Lactação
                  </th>
                  <th className="p-3 text-center font-medium text-gray-800 text-base">
                    Total Lactação
                  </th>
                  <th className="p-3 text-center font-medium text-gray-800 text-base">
                    Classificação
                  </th>
                  <th className="p-3 text-center font-medium text-gray-800 text-base">
                    Prontuário
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRanking.map((ciclo, idx) => {
                  // Definir cor da classificação
                  const getClassificacaoColor = (classificacao) => {
                    switch (classificacao) {
                      case "Ótima":
                        return "bg-green-100 text-green-800 border border-green-300";
                      case "Boa":
                        return "bg-blue-100 text-blue-800 border border-blue-300";
                      case "Mediana":
                        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
                      case "Ruim":
                        return "bg-red-100 text-red-800 border border-red-300";
                      default:
                        return "bg-gray-100 text-gray-800 border border-gray-300";
                    }
                  };

                  return (
                    /* compute a stable key: prefer id_ciclo_lactacao, fallback to id_bufala + index */
                    <tr
                      key={
                        ciclo.id_ciclo_lactacao ??
                        `${ciclo.id_bufala ?? "buf"}-${
                          (lactacaoMeta.page - 1) * lactacaoLimit + idx
                        }`
                      }
                      className={idx % 2 === 0 ? "bg-[#fafafa]" : "bg-white"}
                    >
                      <td className="p-3 text-center text-gray-800 text-base font-medium">
                        {ciclo.nome_bufala}
                      </td>
                      <td className="p-3 text-center text-gray-800 text-base">
                        {ciclo.numero_parto}
                      </td>
                      <td className="p-3 text-center text-gray-800 text-base">
                        {ciclo.dt_parto}
                      </td>
                      <td className="p-3 text-center text-gray-800 text-base">
                        {ciclo.dt_secagem_real || "-"}
                      </td>
                      <td className="p-3 text-center text-gray-800 text-base">
                        {ciclo.dias_em_lactacao}
                      </td>
                      <td className="p-3 text-center text-gray-800 text-base">
                        {ciclo.media_lactacao?.toFixed(2)} L
                      </td>
                      <td className="p-3 text-center text-gray-800 text-base">
                        {ciclo.lactacao_total?.toFixed(2)} L
                      </td>
                      <td className="p-3 text-center text-base">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getClassificacaoColor(
                            ciclo.classificacao
                          )}`}
                        >
                          {ciclo.classificacao}
                        </span>
                      </td>
                      <td className="p-3 text-center text-base">
                        <button
                          onClick={() => abrirModalProducao(ciclo.id_bufala)}
                          className="bg-[#FFCF78] border-none text-gray-800 py-2 px-3.5 rounded-lg cursor-pointer text-sm font-bold hover:bg-[#F2B84D] transition-colors"
                        >
                          Prontuário
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Paginação similar à tela Rebanho */}
          {lactacaoMeta && lactacaoMeta.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <button
                onClick={() => setLactacaoPage((p) => Math.max(1, p - 1))}
                disabled={lactacaoMeta.page <= 1}
                className={`px-4 py-2 rounded-lg font-medium ${
                  lactacaoMeta.page <= 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#FFCF78] hover:bg-[#F2B84D] text-gray-800"
                }`}
              >
                Anterior
              </button>

              {Array.from(
                { length: lactacaoMeta.totalPages },
                (_, i) => i + 1
              ).map((p) => (
                <button
                  key={`lapage-${p}`}
                  onClick={() => setLactacaoPage(p)}
                  className={`w-10 h-10 rounded-lg font-medium ${
                    lactacaoMeta.page === p
                      ? "bg-[#CE7D0A] text-white"
                      : "bg-gray-200 hover:bg-[#FFCF78] text-gray-800"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() =>
                  setLactacaoPage((p) =>
                    Math.min(lactacaoMeta.totalPages, p + 1)
                  )
                }
                disabled={lactacaoMeta.page >= lactacaoMeta.totalPages}
                className={`px-4 py-2 rounded-lg font-medium ${
                  lactacaoMeta.page >= lactacaoMeta.totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#FFCF78] hover:bg-[#F2B84D] text-gray-800"
                }`}
              >
                Próximo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Produção */}
      <ProducaoModal
        open={modalProducaoOpen}
        onClose={fecharModalProducao}
        idBufala={bufalaIdSelecionada}
      />

      {/* Modal de Detalhes do Alerta */}
      <AlertaDetalhesModal
        open={modalAlertaOpen}
        onClose={fecharModalAlerta}
        idAlerta={alertaIdSelecionado}
      />
    </>
  );
}
