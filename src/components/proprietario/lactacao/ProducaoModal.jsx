"use client";

import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaTint,
  FaChartLine,
  FaHistory,
  FaClock,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import lactacaoService from "@/services/lactacaoService";

export default function ProducaoModal({ open, onClose, idBufala }) {
  const [activeTab, setActiveTab] = useState("Ciclo Atual");
  const [producaoData, setProducaoData] = useState(null);
  const [ordenhasData, setOrdenhasData] = useState(null);
  const [ordenhasGraficoData, setOrdenhasGraficoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingOrdenhas, setLoadingOrdenhas] = useState(false);
  const [loadingGrafico, setLoadingGrafico] = useState(false);
  const [error, setError] = useState(null);
  const [ordenhasPage, setOrdenhasPage] = useState(1);
  const [ordenhasLimit, setOrdenhasLimit] = useState(5);

  useEffect(() => {
    if (open && idBufala) {
      setLoading(true);
      setError(null);
      lactacaoService
        .buscarResumoProducaoPorBufala(idBufala)
        .then((data) => {
          console.log('📊 Dados de produção recebidos:', data);
          setProducaoData(data);
        })
        .catch((error) => {
          console.error("Erro ao buscar resumo de produção:", error);
          setError("Não foi possível carregar os dados de produção.");
        })
        .finally(() => setLoading(false));
    }
  }, [open, idBufala]);

  // Buscar ordenhas quando a aba de Ordenhas ou Gráfico for ativada ou a página mudar
  useEffect(() => {
    if (open && activeTab === "Ordenhas" && producaoData?.ciclo_atual?.id_ciclo_lactacao) {
      setLoadingOrdenhas(true);
      lactacaoService
        .buscarOrdenhasPorCiclo(producaoData.ciclo_atual.id_ciclo_lactacao, ordenhasPage, ordenhasLimit)
        .then((ordenhasResponse) => {
          console.log('📋 Ordenhas do ciclo recebidas:', ordenhasResponse);
          setOrdenhasData(ordenhasResponse);
        })
        .catch((error) => {
          console.error("Erro ao buscar ordenhas do ciclo:", error);
        })
        .finally(() => setLoadingOrdenhas(false));
    }
  }, [open, activeTab, producaoData, ordenhasPage, ordenhasLimit]);

  // Buscar todas as ordenhas para o gráfico (sem paginação)
  useEffect(() => {
    if (open && activeTab === "Gráfico" && producaoData?.ciclo_atual?.id_ciclo_lactacao) {
      setLoadingGrafico(true);
      lactacaoService
        .buscarOrdenhasPorCiclo(producaoData.ciclo_atual.id_ciclo_lactacao, 1, 1000) // Buscar até 1000 ordenhas
        .then((ordenhasResponse) => {
          console.log('📊 Todas as ordenhas para o gráfico recebidas:', ordenhasResponse);
          setOrdenhasGraficoData(ordenhasResponse);
        })
        .catch((error) => {
          console.error("Erro ao buscar ordenhas para o gráfico:", error);
        })
        .finally(() => setLoadingGrafico(false));
    }
  }, [open, activeTab, producaoData]);

  if (!open) return null;

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-[min(96vw,1200px)] max-h-[92vh] bg-white rounded-3xl shadow-2xl ring-1 ring-gray-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-center p-6">
            <div className="text-gray-600">Carregando dados de produção...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !producaoData) {
    return (
      <div
        className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-[min(96vw,1200px)] max-h-[92vh] bg-white rounded-3xl shadow-2xl ring-1 ring-gray-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Erro</h2>
            <button
              onClick={onClose}
              className="h-10 w-10 grid place-items-center rounded-xl border border-gray-200 hover:bg-gray-50 text-xl font-bold text-gray-600"
              aria-label="Fechar modal"
            >
              ×
            </button>
          </div>
          <div className="flex items-center justify-center p-6">
            <div className="text-red-500">{error || "Erro ao carregar dados."}</div>
          </div>
        </div>
      </div>
    );
  }

  const { bufala, ciclo_atual, comparativo_ciclos, grafico_producao } = producaoData;

  // Formatar data para exibição
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Formatar data curta para o gráfico (ex: 08/11)
  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  // Preparar dados para o gráfico
  const prepararDadosGrafico = () => {
    if (!ordenhasGraficoData || !ordenhasGraficoData.data) return [];
    
    return ordenhasGraficoData.data
      .sort((a, b) => new Date(a.dt_ordenha) - new Date(b.dt_ordenha))
      .map(ordenha => ({
        data: formatDateShort(ordenha.dt_ordenha),
        dataCompleta: formatDate(ordenha.dt_ordenha),
        quantidade: parseFloat(ordenha.qt_ordenha.toFixed(2)),
        periodo: ordenha.periodo === 'M' ? 'Manhã' : ordenha.periodo === 'T' ? 'Tarde' : 'Noite',
      }));
  };

  // Tooltip customizado para o gráfico
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {payload[0].payload.dataCompleta}
          </p>
          <p className="text-xs text-gray-600 mb-2">
            {payload[0].payload.periodo}
          </p>
          <p className="text-base font-bold text-blue-600">
            {payload[0].value} L
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-[min(96vw,1200px)] max-h-[95vh] bg-white rounded-3xl shadow-2xl ring-1 ring-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b bg-white rounded-t-3xl">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                    Resumo de Produção • {bufala.nome}
                  </h2>
                </div>
                <p className="text-sm text-gray-500">
                  Brinco: {bufala.brinco}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 grid place-items-center rounded-xl border border-gray-200 hover:bg-gray-50 text-xl font-bold text-gray-600"
              aria-label="Fechar modal"
            >
              ×
            </button>
          </div>
          {/* Abas */}
          <div className="flex gap-1 px-3 pb-3">
            {["Ciclo Atual", "Histórico", "Ordenhas", "Gráfico"].map((label) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  activeTab === label
                    ? "bg-amber-50 text-amber-900 border-amber-200 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          {/* Tab Ciclo Atual */}
          {activeTab === "Ciclo Atual" && (
            <div className="max-w-6xl mx-auto">
              <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="absolute left-0 top-0 h-full w-1.5 bg-[#CE7D0A] rounded-l-xl" />
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Ciclo Atual de Lactação
                  </h3>
                  
                  {/* Indicadores principais */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ciclo Nº</span>
                      <p className="text-2xl font-bold text-[#CE7D0A] mt-1">{ciclo_atual.numero_ciclo}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dias em Lactação</span>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{ciclo_atual.dias_em_lactacao}</p>
                      <span className="text-xs text-gray-500 mt-0.5 block">dias</span>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Produzido</span>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{ciclo_atual.total_produzido.toFixed(2)}</p>
                      <span className="text-xs text-gray-500 mt-0.5 block">litros</span>
                    </div>
                  </div>

                  {/* Detalhes do Ciclo Atual */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Informações Detalhadas</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-[#CE7D0A] rounded-full mt-2"></div>
                        <div className="flex-1">
                          <span className="text-xs font-medium text-gray-500 block">Data do Parto</span>
                          <span className="text-sm font-semibold text-gray-900">{formatDate(ciclo_atual.dt_parto)}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-[#CE7D0A] rounded-full mt-2"></div>
                        <div className="flex-1">
                          <span className="text-xs font-medium text-gray-500 block">Previsão de Secagem</span>
                          <span className="text-sm font-semibold text-gray-900">{formatDate(ciclo_atual.dt_secagem_prevista)}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-[#CE7D0A] rounded-full mt-2"></div>
                        <div className="flex-1">
                          <span className="text-xs font-medium text-gray-500 block">Média Diária</span>
                          <span className="text-sm font-semibold text-gray-900">{ciclo_atual.media_diaria.toFixed(2)} L/dia</span>
                        </div>
                      </div>
                      {ciclo_atual.ultima_ordenha && (
                        <div className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 bg-[#CE7D0A] rounded-full mt-2"></div>
                          <div className="flex-1">
                            <span className="text-xs font-medium text-gray-500 block">Última Ordenha</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatDate(ciclo_atual.ultima_ordenha.data)} • {ciclo_atual.ultima_ordenha.quantidade.toFixed(2)} L
                            </span>
                            <span className="inline-block mt-1 text-xs bg-white px-2 py-1 rounded border border-gray-200 font-medium text-gray-700">
                              {ciclo_atual.ultima_ordenha.periodo === 'M' ? 'Manhã' : ciclo_atual.ultima_ordenha.periodo === 'T' ? 'Tarde' : 'Noite'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Histórico */}
          {activeTab === "Histórico" && comparativo_ciclos && comparativo_ciclos.length > 0 && (
            <div className="max-w-6xl mx-auto">
              <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="absolute left-0 top-0 h-full w-1.5  bg-[#CE7D0A] rounded-l-xl" />
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Histórico de Ciclos Anteriores
                  </h3>

                  {/* Estatísticas Resumidas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Melhor Produção Total</span>
                      <p className="text-xl font-bold text-blue-900 mt-1">
                        {Math.max(...comparativo_ciclos.map(c => c.total_produzido)).toFixed(2)} L
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Melhor Média Diária</span>
                      <p className="text-xl font-bold text-green-900 mt-1">
                        {Math.max(...comparativo_ciclos.map(c => c.media_diaria)).toFixed(2)} L/dia
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Ciclo Mais Longo</span>
                      <p className="text-xl font-bold text-purple-900 mt-1">
                        {Math.max(...comparativo_ciclos.map(c => c.duracao_dias))} dias
                      </p>
                    </div>
                  </div>

                  {/* Tabela de Ciclos */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full border-collapse bg-white">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="p-2.5 text-left font-semibold text-gray-700 text-xs">Ciclo</th>
                          <th className="p-2.5 text-left font-semibold text-gray-700 text-xs">Data Parto</th>
                          <th className="p-2.5 text-left font-semibold text-gray-700 text-xs">Data Secagem</th>
                          <th className="p-2.5 text-center font-semibold text-gray-700 text-xs">Duração</th>
                          <th className="p-2.5 text-right font-semibold text-gray-700 text-xs">Total Produzido</th>
                          <th className="p-2.5 text-right font-semibold text-gray-700 text-xs">Média Diária</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparativo_ciclos.map((ciclo, idx) => (
                          <tr key={ciclo.numero_ciclo} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                            <td className="p-2.5 text-gray-900 text-xs font-semibold">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#CE7D0A] text-white text-xs font-bold">
                                {ciclo.numero_ciclo}
                              </span>
                            </td>
                            <td className="p-2.5 text-gray-800 text-xs">{formatDate(ciclo.dt_parto)}</td>
                            <td className="p-2.5 text-gray-800 text-xs">{formatDate(ciclo.dt_secagem)}</td>
                            <td className="p-2.5 text-center text-gray-900 text-xs font-medium">
                              <span className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs">{ciclo.duracao_dias} dias</span>
                            </td>
                            <td className="p-2.5 text-right text-gray-900 text-xs font-bold">{ciclo.total_produzido.toFixed(2)} L</td>
                            <td className="p-2.5 text-right text-gray-700 text-xs font-medium">{ciclo.media_diaria.toFixed(2)} L/dia</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Ordenhas */}
          {activeTab === "Ordenhas" && ordenhasData && ordenhasData.data && ordenhasData.data.length > 0 && (
            <div className="max-w-6xl mx-auto">
              <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="absolute left-0 top-0 h-full w-1.5  bg-[#CE7D0A] rounded-l-xl" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Ordenhas do Ciclo Atual
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">
                        Total de ordenhas:
                      </span>
                      <span className="inline-block bg-blue-100 px-3 py-1 rounded-full border border-blue-200 font-bold text-blue-700 text-sm">
                        {ordenhasData.pagination.total}
                      </span>
                    </div>
                  </div>

                  {loadingOrdenhas ? (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 border border-blue-200 rounded-lg p-6 text-center">
                      <p className="text-gray-600">Carregando ordenhas...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Resumo Estatístico */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-3">
                          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Média por Ordenha</span>
                          <p className="text-xl font-bold text-blue-900 mt-1">
                            {(ordenhasData.data.reduce((sum, o) => sum + o.qt_ordenha, 0) / ordenhasData.data.length).toFixed(2)} L
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-lg p-3">
                          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Maior Ordenha</span>
                          <p className="text-xl font-bold text-green-900 mt-1">
                            {Math.max(...ordenhasData.data.map(o => o.qt_ordenha)).toFixed(2)} L
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200 rounded-lg p-3">
                          <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Menor Ordenha</span>
                          <p className="text-xl font-bold text-yellow-900 mt-1">
                            {Math.min(...ordenhasData.data.map(o => o.qt_ordenha)).toFixed(2)} L
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-3">
                          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Total Acumulado</span>
                          <p className="text-xl font-bold text-purple-900 mt-1">
                            {ordenhasData.data.reduce((sum, o) => sum + o.qt_ordenha, 0).toFixed(2)} L
                          </p>
                        </div>
                      </div>

                      {/* Tabela de Ordenhas */}
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full border-collapse bg-white">
                          <thead>
                            <tr className="bg-gray-100 border-b border-gray-200">
                              <th className="p-3 text-left font-semibold text-gray-700 text-sm">Data da Ordenha</th>
                              <th className="p-3 text-center font-semibold text-gray-700 text-sm">Período</th>
                              <th className="p-3 text-right font-semibold text-gray-700 text-sm">Quantidade (L)</th>
                              <th className="p-3 text-center font-semibold text-gray-700 text-sm">Ocorrência</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ordenhasData.data
                              .sort((a, b) => new Date(b.dt_ordenha) - new Date(a.dt_ordenha))
                              .map((ordenha, idx) => (
                              <tr key={ordenha.id_lact} className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                                <td className="p-3 text-gray-900 text-sm">
                                  <div className="flex items-center gap-2">
                                    <FaCalendarAlt className="text-gray-400 text-xs" />
                                    <span className="font-medium">{formatDate(ordenha.dt_ordenha)}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                    ordenha.periodo === 'M' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                    ordenha.periodo === 'T' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                    'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                  }`}>
                                    {ordenha.periodo === 'M' ? 'Manhã' : ordenha.periodo === 'T' ? 'Tarde' : 'Noite'}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="font-bold text-gray-900 text-base">{ordenha.qt_ordenha.toFixed(2)}</span>
                                    <span className="text-xs text-gray-500">L</span>
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  {ordenha.ocorrencia ? (
                                    <span className="inline-block bg-red-100 text-red-800 border border-red-200 px-2 py-1 rounded text-xs font-medium">
                                      {ordenha.ocorrencia}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Paginação - Após a tabela e antes do gráfico */}
                      {ordenhasData.pagination && ordenhasData.pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 py-4">
                          <button
                            onClick={() => setOrdenhasPage((p) => Math.max(1, p - 1))}
                            disabled={ordenhasData.pagination.page <= 1}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              ordenhasData.pagination.page <= 1
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-[#FFCF78] hover:bg-[#F2B84D] text-gray-800"
                            }`}
                          >
                            Anterior
                          </button>

                          {Array.from({ length: ordenhasData.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                              key={p}
                              onClick={() => setOrdenhasPage(p)}
                              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                ordenhasData.pagination.page === p
                                  ? "bg-[#CE7D0A] text-white"
                                  : "bg-gray-200 hover:bg-[#FFCF78] text-gray-800"
                              }`}
                            >
                              {p}
                            </button>
                          ))}

                          <button
                            onClick={() => setOrdenhasPage((p) => Math.min(ordenhasData.pagination.totalPages, p + 1))}
                            disabled={ordenhasData.pagination.page >= ordenhasData.pagination.totalPages}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              ordenhasData.pagination.page >= ordenhasData.pagination.totalPages
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-[#FFCF78] hover:bg-[#F2B84D] text-gray-800"
                            }`}
                          >
                            Próximo
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Gráfico */}
          {activeTab === "Gráfico" && ordenhasGraficoData && ordenhasGraficoData.data && ordenhasGraficoData.data.length > 0 && (
            <div className="max-w-6xl mx-auto">
              <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="absolute left-0 top-0 h-full w-1.5 bg-[#CE7D0A] rounded-l-xl" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Evolução da Produção de Leite
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">
                        Total de ordenhas:
                      </span>
                      <span className="inline-block bg-amber-100 px-3 py-1 rounded-full border border-amber-200 font-bold text-amber-800 text-sm">
                        {ordenhasGraficoData.pagination.total}
                      </span>
                    </div>
                  </div>

                  {loadingGrafico ? (
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 border border-amber-200 rounded-lg p-6 text-center">
                      <p className="text-gray-600">Carregando dados do gráfico...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Resumo Estatístico */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-3">
                          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Média por Ordenha</span>
                          <p className="text-xl font-bold text-blue-900 mt-1">
                            {(ordenhasGraficoData.data.reduce((sum, o) => sum + o.qt_ordenha, 0) / ordenhasGraficoData.data.length).toFixed(2)} L
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-lg p-3">
                          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Maior Ordenha</span>
                          <p className="text-xl font-bold text-green-900 mt-1">
                            {Math.max(...ordenhasGraficoData.data.map(o => o.qt_ordenha)).toFixed(2)} L
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200 rounded-lg p-3">
                          <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Menor Ordenha</span>
                          <p className="text-xl font-bold text-yellow-900 mt-1">
                            {Math.min(...ordenhasGraficoData.data.map(o => o.qt_ordenha)).toFixed(2)} L
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-3">
                          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Total Acumulado</span>
                          <p className="text-xl font-bold text-purple-900 mt-1">
                            {ordenhasGraficoData.data.reduce((sum, o) => sum + o.qt_ordenha, 0).toFixed(2)} L
                          </p>
                        </div>
                      </div>

                      {/* Gráfico de Linha */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-lg border border-blue-200 p-5">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FaChartLine className="text-blue-500" />
                          Gráfico de Evolução
                        </h4>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart
                            data={prepararDadosGrafico()}
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="data"
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              tickLine={{ stroke: '#9ca3af' }}
                            />
                            <YAxis
                              label={{ value: 'Litros (L)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              tickLine={{ stroke: '#9ca3af' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                              iconType="line"
                            />
                            <Line
                              type="monotone"
                              dataKey="quantidade"
                              stroke="#3b82f6"
                              strokeWidth={3}
                              dot={{ fill: '#3b82f6', r: 5 }}
                              activeDot={{ r: 7, fill: '#2563eb' }}
                              name="Quantidade de Leite (L)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
