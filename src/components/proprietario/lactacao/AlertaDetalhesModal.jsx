"use client";
import React, { useEffect, useState } from "react";
import alertaService from "@/services/alertaService";
import bufaloService from "@/services/bufaloService";

export default function AlertaDetalhesModal({ open, onClose, idAlerta }) {
  const [alertaData, setAlertaData] = useState(null);
  const [bufaloNome, setBufaloNome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [atualizandoVisto, setAtualizandoVisto] = useState(false);

  useEffect(() => {
    if (open && idAlerta) {
      setLoading(true);
      setError(null);
      setAlertaData(null);
      setBufaloNome(null);

      // Buscar dados do alerta
      alertaService
        .buscarAlertaPorId(idAlerta)
        .then(async (data) => {
          setAlertaData(data);

          // Buscar nome do búfalo se houver animal_id
          if (data.animal_id) {
            try {
              const bufalo = await bufaloService.buscarBufaloPorId(data.animal_id);
              setBufaloNome(bufalo?.nome || bufalo?.brinco || 'Sem nome');
            } catch (err) {
              console.error("Erro ao buscar búfalo:", err);
              setBufaloNome('Desconhecido');
            }
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Erro ao carregar detalhes do alerta:", err);
          setError("Não foi possível carregar os detalhes do alerta.");
          setLoading(false);
        });
    }
  }, [open, idAlerta]);

  if (!open) return null;

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Função para obter estilo da prioridade
  const getPrioridadeStyle = (prioridade) => {
    switch (prioridade) {
      case "ALTA":
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-800",
          borderColor: "border-red-300",
        };
      case "MEDIA":
        return {
          bgColor: "bg-orange-100",
          textColor: "text-orange-800",
          borderColor: "border-orange-300",
        };
      case "BAIXA":
        return {
          bgColor: "bg-blue-100",
          textColor: "text-blue-800",
          borderColor: "border-blue-300",
        };
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          borderColor: "border-gray-300",
        };
    }
  };

  // Função para obter estilo do nicho
  const getNichoStyle = (nicho) => {
    switch (nicho) {
      case "CLINICO":
        return {
          bgColor: "bg-red-50",
          textColor: "text-red-700",
          borderColor: "border-red-200",
        };
      case "SANITARIO":
        return {
          bgColor: "bg-green-50",
          textColor: "text-green-700",
          borderColor: "border-green-200",
        };
      case "REPRODUCAO":
        return {
          bgColor: "bg-pink-50",
          textColor: "text-pink-700",
          borderColor: "border-pink-200",
        };
      case "MANEJO":
        return {
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
          borderColor: "border-blue-200",
        };
      case "PRODUCAO":
        return {
          bgColor: "bg-amber-50",
          textColor: "text-amber-700",
          borderColor: "border-amber-200",
        };
      default:
        return {
          bgColor: "bg-gray-50",
          textColor: "text-gray-700",
          borderColor: "border-gray-200",
        };
    }
  };

  const prioridadeStyle = alertaData ? getPrioridadeStyle(alertaData.prioridade) : {};
  const nichoStyle = alertaData ? getNichoStyle(alertaData.nicho) : {};

  // Função para marcar/desmarcar alerta como visto
  const handleToggleVisto = async () => {
    if (!alertaData || !idAlerta) return;
    
    setAtualizandoVisto(true);
    try {
      const novoStatus = !alertaData.visto; // Inverte o status atual
      const alertaAtualizado = await alertaService.atualizarStatusVisto(idAlerta, novoStatus);
      setAlertaData(alertaAtualizado); // Atualiza os dados locais com a resposta do servidor
      console.log(`✅ Alerta marcado como ${novoStatus ? 'visto' : 'não visto'}`);
    } catch (err) {
      console.error("❌ Erro ao atualizar status do alerta:", err);
      alert("Não foi possível atualizar o status do alerta. Tente novamente.");
    } finally {
      setAtualizandoVisto(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-[min(96vw,1200px)] max-h-[95vh] bg-white rounded-3xl shadow-2xl ring-1 ring-gray-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b bg-white rounded-t-3xl">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                    Detalhes do Alerta
                  </h2>
                </div>
                {alertaData && bufaloNome && (
                  <p className="text-sm text-gray-500 mt-1">
                    {bufaloNome}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Status Indicators */}
              {alertaData && (
                <div className="flex flex-wrap gap-2 mr-4">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${prioridadeStyle.bgColor} ${prioridadeStyle.textColor} ${prioridadeStyle.borderColor}`}
                  >
                    {alertaData.prioridade}
                  </span>
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${nichoStyle.bgColor} ${nichoStyle.textColor} ${nichoStyle.borderColor}`}
                  >
                    {alertaData.nicho}
                  </span>
                  {alertaData.visto ? (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 bg-green-100 text-green-800 border-green-300">
                      ✓ Visto
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                      Não Visto
                    </span>
                  )}
                </div>
              )}
              
              <button
                onClick={onClose}
                className="h-10 w-10 grid place-items-center rounded-xl border border-gray-200 hover:bg-gray-50 text-xl font-bold text-gray-600"
                aria-label="Fechar modal"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#CE7D0A] mb-4"></div>
              <p className="text-gray-600 font-medium">Carregando detalhes do alerta...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
              <svg
                className="w-16 h-16 text-red-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-red-800 font-bold text-xl mb-2">Erro ao Carregar</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          ) : alertaData ? (
            <div className="max-w-6xl mx-auto">
              <div className="space-y-4">
               

                {/* Motivo do Alerta */}
                <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="absolute left-0 top-0 h-full w-1.5 bg-[#CE7D0A] rounded-l-xl" />
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#CE7D0A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Motivo
                    </h3>
                    <p className="text-gray-700 text-base font-medium">{alertaData.motivo}</p>
                  </div>
                </div>

                {/* Observação */}
                {alertaData.observacao && (
                  <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-[#CE7D0A] rounded-l-xl" />
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#CE7D0A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Observação
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {alertaData.observacao}
                      </p>
                    </div>
                  </div>
                )}

                {/* Informações do Animal e Localização */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Animal */}
                  {(alertaData.animal_id || bufaloNome) && (
                    <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="absolute left-0 top-0 h-full w-1.5 bg-[#CE7D0A] rounded-l-xl" />
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#CE7D0A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Animal
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-semibold text-gray-500">Nome:</span>
                            <p className="text-gray-900 font-medium">{bufaloNome || "Carregando..."}</p>
                          </div>
                          {alertaData.grupo && (
                            <div>
                              <span className="text-sm font-semibold text-gray-500">Grupo:</span>
                              <p className="text-gray-900 font-medium">{alertaData.grupo}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Localização */}
                  {alertaData.localizacao && (
                    <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="absolute left-0 top-0 h-full w-1.5 bg-[#CE7D0A] rounded-l-xl" />
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#CE7D0A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Localização
                        </h3>
                        <p className="text-gray-900 font-medium">{alertaData.localizacao}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Informações de Origem */}
                {(alertaData.id_evento_origem || alertaData.tipo_evento_origem) && (
                  <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-[#CE7D0A] rounded-l-xl" />
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#CE7D0A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Origem do Alerta
                      </h3>
                      <div className="space-y-3">
                        {alertaData.tipo_evento_origem && (
                          <div>
                            <span className="text-sm font-semibold text-gray-500">Tipo de Evento:</span>
                            <p className="text-gray-900 font-medium">{alertaData.tipo_evento_origem}</p>
                          </div>
                        )}
                        {alertaData.id_evento_origem && (
                          <div>
                            <span className="text-sm font-semibold text-gray-500">ID do Evento:</span>
                            <p className="text-gray-900 font-mono text-xs bg-gray-50 p-2 rounded border border-gray-200 break-all">
                              {alertaData.id_evento_origem}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Datas */}
                <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="absolute left-0 top-0 h-full w-1.5 bg-[#CE7D0A] rounded-l-xl" />
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#CE7D0A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Informações de Data
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-semibold text-gray-500">Data do Alerta:</span>
                        <p className="text-gray-900 font-medium">{formatDate(alertaData.data_alerta)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-500">Criado em:</span>
                        <p className="text-gray-900 font-medium">{formatDate(alertaData.created_at)}</p>
                      </div>
                      {alertaData.updated_at && alertaData.updated_at !== alertaData.created_at && (
                        <div>
                          <span className="text-sm font-semibold text-gray-500">Atualizado em:</span>
                          <p className="text-gray-900 font-medium">{formatDate(alertaData.updated_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div className="border-t border-gray-200 p-6 bg-white flex justify-end gap-3">
            {alertaData && (
              <button
                onClick={handleToggleVisto}
                disabled={atualizandoVisto}
                className={`px-6 py-2.5 font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2 ${
                  atualizandoVisto
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : alertaData.visto
                    ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-2 border-yellow-300'
                    : 'bg-green-100 hover:bg-green-200 text-green-800 border-2 border-green-300'
                }`}
              >
                {atualizandoVisto ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Atualizando...
                  </>
                ) : alertaData.visto ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Marcar como Não Visto
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Marcar como Visto
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#FFCF78] hover:bg-[#F2B84D] text-gray-800 font-semibold rounded-lg transition-colors shadow-sm"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}   