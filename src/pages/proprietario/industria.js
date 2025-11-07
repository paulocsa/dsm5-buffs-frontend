import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { usePropriedade } from "@/contexts/propriedadeContext";
import estoqueLeiteService from "@/services/estoqueLeiteService";
import coletaService from "@/services/coletaService";
import industriaService from "@/services/industriaService";
import ColetaDetalhesModal from "@/components/proprietario/industria/ColetaDetalhesModal";
import ColetaEditModal from "@/components/proprietario/industria/ColetaEditModal";
import { FiEye, FiEdit2, FiTrash2, FiCheckCircle, FiAlertTriangle, FiXCircle } from "react-icons/fi";
import DeleteIndustriaModal from "@/components/proprietario/industria/DeleteIndustriaModal";
import DeleteColetaModal from "@/components/proprietario/industria/DeleteColetaModal";
import IndustriaDetalhesModal from "@/components/proprietario/industria/IndustriaDetalhesModal";
import IndustriaEditModal from "@/components/proprietario/industria/IndustriaEditModal";
import IndustriaCreateModal from "@/components/proprietario/industria/IndustriaCreateModal";

export default function Industria() {
  const router = useRouter();
  const { propriedadeId } = usePropriedade();
  const [volumeTotalColetado, setVolumeTotalColetado] = useState(null);
  const [taxaAprovacao, setTaxaAprovacao] = useState(null);
  const [volumeRejeitadoMes, setVolumeRejeitadoMes] = useState(null);
  const [totalColetas, setTotalColetas] = useState(null);
  const [coletas, setColetas] = useState([]);
  const [metaColetas, setMetaColetas] = useState(null);
  const [loadingColetas, setLoadingColetas] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [industrias, setIndustrias] = useState([]);
  const [loadingIndustrias, setLoadingIndustrias] = useState(false);
  const [modalColetaOpen, setModalColetaOpen] = useState(false);
  const [modalColetaEditOpen, setModalColetaEditOpen] = useState(false);
  const [coletaSelecionada, setColetaSelecionada] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [modalDeleteIndustriaOpen, setModalDeleteIndustriaOpen] = useState(false);
  const [industriaSelecionada, setIndustriaSelecionada] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [modalDeleteColetaOpen, setModalDeleteColetaOpen] = useState(false);
  const [deleteColetaLoading, setDeleteColetaLoading] = useState(false);
  const [deleteColetaError, setDeleteColetaError] = useState("");
  const [modalIndustriaDetalhesOpen, setModalIndustriaDetalhesOpen] = useState(false);
  const [industriaDetalhes, setIndustriaDetalhes] = useState(null);
  const [industriaDetalhesLoading, setIndustriaDetalhesLoading] = useState(false);
  const [industriaDetalhesError, setIndustriaDetalhesError] = useState("");
  const [modalIndustriaEditOpen, setModalIndustriaEditOpen] = useState(false);
  const [industriaEditLoading, setIndustriaEditLoading] = useState(false);
  const [industriaEditError, setIndustriaEditError] = useState("");
  const [modalIndustriaCreateOpen, setModalIndustriaCreateOpen] = useState(false);
  const [industriaCreateLoading, setIndustriaCreateLoading] = useState(false);
  const [industriaCreateError, setIndustriaCreateError] = useState("");

  // Busca totais e coletas paginadas
  useEffect(() => {
    async function fetchAll() {
      if (!propriedadeId) {
        setColetas([]);
        setMetaColetas(null);
        setVolumeTotalColetado(null);
        setTotalColetas(null);
        setTaxaAprovacao(null);
        setVolumeRejeitadoMes(null);
        return;
      }
      // Volume Total Coletado (soma de todas as coletas APROVADAS do mês atual)
      try {
        const now = new Date();
        const anoAtual = now.getFullYear();
        const mesAtual = now.getMonth() + 1; // getMonth() retorna 0-11, API usa 1-12
        let pageCol = 1;
        let volumeTotal = 0;
        let hasNext = true;
        const limitCol = 100;
        while (hasNext) {
          const res = await coletaService.listarColetasPorPropriedade(
            propriedadeId,
            pageCol,
            limitCol
          );
          if (Array.isArray(res.data)) {
            volumeTotal += res.data
              .filter((coleta) => {
                // Verifica se tem data de coleta
                if (!coleta.dt_coleta) return false;
                // Verifica se foi aprovada
                if (!coleta.resultado_teste) return false;
                // Extrai ano e mês da data da coleta
                const partes = coleta.dt_coleta.split('-'); // "2025-11-12"
                const anoColeta = parseInt(partes[0], 10);
                const mesColeta = parseInt(partes[1], 10);
                // Compara com mês/ano atual
                return anoColeta === anoAtual && mesColeta === mesAtual;
              })
              .reduce(
                (acc, coleta) => acc + (Number(coleta.quantidade) || 0),
                0
              );
          }
          hasNext = res.meta?.hasNextPage;
          pageCol++;
        }
        setVolumeTotalColetado(volumeTotal);
      } catch (err) {
        setVolumeTotalColetado("Erro");
      }
      // Total de coletas (meta)
      try {
        const res = await coletaService.listarColetasPorPropriedade(
          propriedadeId,
          1,
          1
        );
        setTotalColetas(res.meta?.total ?? 0);
      } catch (err) {
        setTotalColetas("Erro");
      }

      // Taxa de Aprovação (% de coletas aprovadas sobre o total DO MÊS ATUAL)
      try {
        const now = new Date();
        const anoAtual = now.getFullYear();
        const mesAtual = now.getMonth() + 1;
        let pageCol = 1;
        let totalColetasMes = 0;
        let totalAprovadas = 0;
        let hasNext = true;
        const limitCol = 100;
        while (hasNext) {
          const res = await coletaService.listarColetasPorPropriedade(
            propriedadeId,
            pageCol,
            limitCol
          );
          if (Array.isArray(res.data)) {
            res.data.forEach((coleta) => {
              if (!coleta.dt_coleta) return;
              // Parse da data no formato YYYY-MM-DD
              const partes = coleta.dt_coleta.split('-');
              const anoColeta = parseInt(partes[0], 10);
              const mesColeta = parseInt(partes[1], 10);
              // Verifica se é do mês atual
              if (anoColeta === anoAtual && mesColeta === mesAtual) {
                totalColetasMes++;
                if (coleta.resultado_teste) {
                  totalAprovadas++;
                }
              }
            });
          }
          hasNext = res.meta?.hasNextPage;
          pageCol++;
        }
        const taxa = totalColetasMes > 0 ? (totalAprovadas / totalColetasMes) * 100 : 0;
        setTaxaAprovacao(taxa);
      } catch (err) {
        setTaxaAprovacao("Erro");
      }

      // Volume Rejeitado (soma de coletas REPROVADAS do mês atual)
      try {
        const now = new Date();
        const anoAtual = now.getFullYear();
        const mesAtual = now.getMonth() + 1;
        let pageCol = 1;
        let volumeRejeitado = 0;
        let hasNext = true;
        const limitCol = 100;
        while (hasNext) {
          const res = await coletaService.listarColetasPorPropriedade(
            propriedadeId,
            pageCol,
            limitCol
          );
          if (Array.isArray(res.data)) {
            volumeRejeitado += res.data
              .filter((coleta) => {
                // Verifica se tem data de coleta
                if (!coleta.dt_coleta) return false;
                // Verifica se foi REPROVADA
                if (coleta.resultado_teste) return false;
                // Extrai ano e mês da data da coleta
                const partes = coleta.dt_coleta.split('-');
                const anoColeta = parseInt(partes[0], 10);
                const mesColeta = parseInt(partes[1], 10);
                // Compara com mês/ano atual
                return anoColeta === anoAtual && mesColeta === mesAtual;
              })
              .reduce(
                (acc, coleta) => acc + (Number(coleta.quantidade) || 0),
                0
              );
          }
          hasNext = res.meta?.hasNextPage;
          pageCol++;
        }
        setVolumeRejeitadoMes(volumeRejeitado);
      } catch (err) {
        setVolumeRejeitadoMes("Erro");
      }
    }
    fetchAll();
  }, [propriedadeId]);

  // Busca coletas paginadas
  useEffect(() => {
    if (!propriedadeId) {
      setColetas([]);
      setMetaColetas(null);
      return;
    }
    let ignore = false;
    (async () => {
      setLoadingColetas(true);
      try {
        const res = await coletaService.listarColetasPorPropriedade(
          propriedadeId,
          page,
          limit
        );
        if (!ignore) {
          setColetas(res.data || []);
          setMetaColetas(res.meta || null);
        }
      } catch (err) {
        if (!ignore) {
          setColetas([]);
          setMetaColetas(null);
        }
      } finally {
        if (!ignore) setLoadingColetas(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [propriedadeId, page, limit]);

  // Busca indústrias da propriedade
  useEffect(() => {
    if (!propriedadeId) {
      setIndustrias([]);
      return;
    }
    let ignore = false;
    (async () => {
      setLoadingIndustrias(true);
      try {
        const res = await industriaService.listarIndustriasPorPropriedade(propriedadeId);
        if (!ignore) setIndustrias(res || []);
      } catch (err) {
        if (!ignore) setIndustrias([]);
      } finally {
        if (!ignore) setLoadingIndustrias(false);
      }
    })();
    return () => { ignore = true; };
  }, [propriedadeId]);

  return (
    <>
      <Head>
        <title>Indústria | Buffs</title>
        <meta name="description" content="Gestão da equipe de funcionários" />
      </Head>

      <div className="p-6 flex flex-col gap-8">
        {/* Header - Gestão da Indústria*/}
        <div className="w-full flex flex-col bg-white rounded-xl p-6 gap-6 box-border border border-[#e0e0e0] shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Controle de Produção{" "}
            </h1>
            <p className="text-gray-600 text-lg">
              Monitoramento da Produção de Leite de Búfalas.
            </p>
          </div>

          {/* Resumo da Indústria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-lg shadow border border-[#e0e0e0]">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  Volume Total Coletado
                </h2>
                <span className="text-xs font-medium text-[var(--color-primary-dark)]">
                  Mês atual
                </span>
              </div>
              <p className="text-4xl font-extrabold tracking-tight text-[var(--color-text-dark)]">
                {volumeTotalColetado === null
                  ? "..."
                  : volumeTotalColetado === "Erro"
                  ? "Erro"
                  : `${volumeTotalColetado.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })} L`}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Coletas do mês atual
              </p>
            </div>

            {/* Indicador de coletas */}
            <div className="bg-white p-4 rounded-lg shadow border border-[#e0e0e0]">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  Total de Coletas
                </h2>
                <span className="text-xs font-medium text-[var(--color-primary-dark)]">
                  Registros
                </span>
              </div>
              <p className="text-4xl font-extrabold tracking-tight text-[var(--color-text-dark)]">
                {totalColetas === null ? "..." : totalColetas}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Coletas realizadas
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border border-[#e0e0e0]">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  Taxa de Aprovação
                </h2>
                <span className="text-xs font-medium text-[var(--color-primary-dark)]">
                  Mês atual
                </span>
              </div>
              <p
                className={`text-4xl font-extrabold tracking-tight flex items-center gap-2 ${
                  taxaAprovacao !== null && taxaAprovacao !== "Erro"
                    ? taxaAprovacao >= 80
                      ? "text-green-600"
                      : taxaAprovacao >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                    : "text-[var(--color-text-dark)]"
                }`}
              >
                {taxaAprovacao === null
                  ? "..."
                  : taxaAprovacao === "Erro"
                  ? "Erro"
                  : `${taxaAprovacao.toFixed(1)}%`}
                {taxaAprovacao !== null && taxaAprovacao !== "Erro" && (
                  <span className="text-2xl">
                    {taxaAprovacao >= 80
                      ? <FiCheckCircle />
                      : taxaAprovacao >= 60
                      ? <FiAlertTriangle />
                      : <FiXCircle />}
                  </span>
                )}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Percentual de coletas aprovadas no mês
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border border-[#e0e0e0]">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  Volume Rejeitado
                </h2>
                <span className="text-xs font-medium text-[var(--color-primary-dark)]">
                  Mês atual
                </span>
              </div>
              <p className="text-4xl font-extrabold tracking-tight text-[var(--color-text-dark)]">
                {volumeRejeitadoMes === null
                  ? "..."
                  : `${volumeRejeitadoMes.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })} L`}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Perdas registradas no mês
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico de Distribuição
        <div className="w-full flex flex-col bg-white rounded-xl p-5 gap-4 box-border border border-[#e0e0e0] shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Distribuição da Equipe
          </h2>
          <div className="w-full">
            <div className="bg-white p-4 rounded-lg shadow border border-[#e0e0e0]">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Distribuição por Cargos
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={distribuicaoCargos}
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {distribuicaoCargos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} funcionários`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div> */}

        {/* Tabela de Coletas */}
        <div className="w-full flex flex-col bg-white rounded-xl p-5 gap-4 box-border border border-[#e0e0e0] shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Registro de Coletas
            </h2>
            <p className="text-gray-600">
              Monitoramento da Produção de leite de Búfalas -{" "}
              {totalColetas === null
                ? "..."
                : `${totalColetas} coletas registradas`}
            </p>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm text-center align-middle">
              <thead className="bg-[#f0f0f0]">
                <tr>
                  <th
                    className="p-3 font-medium text-gray-800 text-base whitespace-nowrap"
                    style={{
                      minWidth: "110px",
                      maxWidth: "140px",
                      width: "1%",
                    }}
                  >
                    Data da Coleta
                  </th>
                  <th className="p-3 font-medium text-gray-800 text-base whitespace-nowrap">
                    Empresa
                  </th>
                  <th className="p-3 font-medium text-gray-800 text-base whitespace-nowrap">
                    Quantidade
                  </th>
                  <th className="p-3 font-medium text-gray-800 text-base whitespace-nowrap">
                    Observação
                  </th>
                  <th className="p-3 font-medium text-gray-800 text-base whitespace-nowrap">
                    Status
                  </th>
                  <th className="p-3 font-medium text-gray-800 text-base whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loadingColetas ? (
                  <tr>
                    <td colSpan="6" className="text-center p-6 text-gray-500">
                      Carregando coletas...
                    </td>
                  </tr>
                ) : coletas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-6 text-gray-500">
                      Nenhuma coleta encontrada
                    </td>
                  </tr>
                ) : (
                  coletas.map((c) => (
                    <tr
                      key={c.id_coleta}
                      className="odd:bg-white even:bg-[#fafafa]"
                    >
                      <td
                        className="p-3 text-gray-800 text-base font-medium whitespace-nowrap"
                        style={{
                          minWidth: "110px",
                          maxWidth: "140px",
                          width: "1%",
                        }}
                      >
                        {c.dt_coleta
                          ? new Date(c.dt_coleta).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-3 text-gray-800 text-base whitespace-nowrap">
                        {c.nome_empresa || "-"}
                      </td>
                      <td className="p-3 text-gray-800 text-base whitespace-nowrap">
                        {c.quantidade != null
                          ? `${c.quantidade.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })} L`
                          : "-"}
                      </td>
                      <td className="p-3 text-gray-800 text-base">
                        {c.observacao || "-"}
                      </td>
                      <td className="p-3 text-gray-800 text-base whitespace-nowrap">
                        {c.resultado_teste ? (
                          <span className="px-2.5 py-1.5 rounded-full text-sm font-bold inline-block w-25 bg-[#9DFFBE] text-gray-800">
                            Aprovado
                          </span>
                        ) : (
                          <span className="px-2.5 py-1.5 rounded-full text-sm font-bold inline-block w-25 bg-[#FF9D9D] text-gray-800">
                            Reprovado
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-800 text-base whitespace-nowrap">
                        <button
                          className="border-none bg-transparent p-0 m-0 cursor-pointer"
                          title="Ver detalhes"
                          onClick={() => {
                            setColetaSelecionada(c);
                            setModalColetaOpen(true);
                          }}
                          style={{ outline: 'none' }}
                        >
                          <span
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FFF6E0] text-[#CE7D0A] hover:bg-[#FFCF78] hover:scale-105 transition-all shadow-sm"
                            style={{ fontSize: '1.5rem' }}
                          >
                            <FiEye />
                          </span>
                        </button>
                        <button
                          className="border-none bg-transparent p-0 m-0 cursor-pointer ml-2"
                          title="Editar coleta"
                          onClick={() => {
                            setColetaSelecionada(c);
                            setModalColetaEditOpen(true);
                            setEditError("");
                          }}
                          style={{ outline: 'none' }}
                        >
                          <span
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#E0F2FF] text-[#0A7DCE] hover:bg-[#B8E6FF] hover:scale-105 transition-all shadow-sm"
                            style={{ fontSize: '1.5rem' }}
                          >
                            <FiEdit2 />
                          </span>
                        </button>
                        <button
                          className="border-none bg-transparent p-0 m-0 cursor-pointer ml-2"
                          title="Excluir coleta"
                          onClick={() => {
                            setColetaSelecionada(c);
                            setModalDeleteColetaOpen(true);
                            setDeleteColetaError("");
                          }}
                          style={{ outline: 'none' }}
                        >
                          <span
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FFE0E0] text-[#CE0A0A] hover:bg-[#FF9D9D] hover:scale-105 transition-all shadow-sm"
                            style={{ fontSize: '1.5rem' }}
                          >
                            <FiTrash2 />
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {/* Paginação dinâmica das coletas (janela de páginas, como rebanho.js, mas com elipses) */}
              {metaColetas && metaColetas.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={metaColetas.page <= 1}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      metaColetas.page <= 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#FFCF78] hover:bg-[#F2B84D] text-gray-800"
                    }`}
                  >
                    Anterior
                  </button>

                  {/* Paginação dinâmica: mostra uma janela de páginas ao redor da atual, com elipses e sempre o primeiro/último */}
                  {(() => {
                    const total = metaColetas.totalPages;
                    const current = metaColetas.page;
                    const windowSize = 2; // páginas vizinhas de cada lado
                    let pages = [];
                    if (total <= 7) {
                      // Poucas páginas: mostra todas
                      pages = Array.from({ length: total }, (_, i) => i + 1);
                    } else {
                      // Muitas páginas: mostra 1 ... [window] ... total
                      pages.push(1);
                      let start = Math.max(2, current - windowSize);
                      let end = Math.min(total - 1, current + windowSize);
                      if (start > 2) pages.push("...");
                      for (let i = start; i <= end; i++) pages.push(i);
                      if (end < total - 1) pages.push("...");
                      pages.push(total);
                    }
                    return pages.map((p, idx) =>
                      p === "..." ? (
                        <span
                          key={"elip-" + idx}
                          className="w-10 h-10 flex items-center justify-center text-gray-400"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-10 h-10 rounded-lg font-medium ${
                            metaColetas.page === p
                              ? "bg-[#CE7D0A] text-white"
                              : "bg-gray-200 hover:bg-[#FFCF78] text-gray-800"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    );
                  })()}

                  <button
                    onClick={() =>
                      setPage((p) => Math.min(metaColetas.totalPages, p + 1))
                    }
                    disabled={metaColetas.page >= metaColetas.totalPages}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      metaColetas.page >= metaColetas.totalPages
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#FFCF78] hover:bg-[#F2B84D] text-gray-800"
                    }`}
                  >
                    Próximo
                  </button>
                </div>
              )}
            </table>
          </div>
        </div>

        {/* Seção de Indústrias */}
        <div className="w-full flex flex-col bg-white rounded-xl p-5 gap-4 box-border border border-[#e0e0e0] shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Industrias
            </h2>
            <p className="text-gray-600">
              Industrias parceiras cadastradas no sistema.
            </p>
          </div>
          <div className="flex justify-end mb-4">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 transition-colors"
              onClick={() => {
                setModalIndustriaCreateOpen(true);
                setIndustriaCreateError("");
              }}
            >
              + Nova Indústria
            </button>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm text-center align-middle">
              <thead className="bg-[#f0f0f0]">
                <tr>
                  <th className="p-3 font-medium text-gray-800 text-base whitespace-nowrap">Nome</th>
                  <th className="p-3 font-medium text-gray-800 text-base whitespace-nowrap">Representante</th>
                  <th className="p-3 font-medium text-gray-800 text-base whitespace-nowrap">Contato</th>
                  <th className="p-3 font-medium text-gray-800 text-base whitespace-nowrap">Observação</th>
                  <th className="p-3 font-medium text-gray-800 text-base whitespace-nowrap">Criado em</th>
                  <th className="p-3 font-medium text-gray-800 text-base whitespace-nowrap">Atualizado em</th>
                  <th className="p-3 font-medium text-gray-800 text-base whitespace-nowrap">ID</th>
                  <th className="p-3 font-medium text-gray-800 text-base whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loadingIndustrias ? (
                  <tr>
                    <td colSpan="8" className="text-center p-6 text-gray-500">Carregando indústrias...</td>
                  </tr>
                ) : industrias.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center p-6 text-gray-500">Nenhuma indústria encontrada</td>
                  </tr>
                ) : (
                  industrias.map((ind) => (
                    <tr key={ind.id_industria} className="odd:bg-white even:bg-[#fafafa]">
                      <td className="p-3 text-gray-800 text-base font-medium whitespace-nowrap">{ind.nome}</td>
                      <td className="p-3 text-gray-800 text-base whitespace-nowrap">{ind.representante}</td>
                      <td className="p-3 text-gray-800 text-base whitespace-nowrap">{ind.contato}</td>
                      <td className="p-3 text-gray-800 text-base whitespace-nowrap">{ind.observacao}</td>
                      <td className="p-3 text-gray-800 text-base whitespace-nowrap">{ind.created_at ? new Date(ind.created_at).toLocaleDateString() : '-'}</td>
                      <td className="p-3 text-gray-800 text-base whitespace-nowrap">{ind.updated_at ? new Date(ind.updated_at).toLocaleDateString() : '-'}</td>
                      <td className="p-3 text-gray-800 text-base whitespace-nowrap">{ind.id_industria}</td>
                      <td className="p-3 text-gray-800 text-base whitespace-nowrap">
                        <button
                          className="border-none bg-transparent p-0 m-0 cursor-pointer"
                          title="Ver detalhes"
                          onClick={async () => {
                            setIndustriaDetalhesLoading(true);
                            setIndustriaDetalhesError("");
                            setModalIndustriaDetalhesOpen(true);
                            try {
                              // Fetch details from backend (optional, if not all fields are present)
                              const details = await industriaService.buscarIndustriaPorId(ind.id_industria);
                              setIndustriaDetalhes(details);
                            } catch (err) {
                              setIndustriaDetalhesError(err?.message || "Erro ao buscar detalhes da indústria");
                              setIndustriaDetalhes(ind); // fallback to row data
                            } finally {
                              setIndustriaDetalhesLoading(false);
                            }
                          }}
                          style={{ outline: 'none' }}
                        >
                          <span
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FFF6E0] text-[#CE7D0A] hover:bg-[#FFCF78] hover:scale-105 transition-all shadow-sm"
                            style={{ fontSize: '1.5rem' }}
                          >
                            <FiEye />
                          </span>
                        </button>
                        <button
                          className="border-none bg-transparent p-0 m-0 cursor-pointer ml-2"
                          title="Editar indústria"
                          onClick={() => {
                            setIndustriaSelecionada(ind);
                            setModalIndustriaEditOpen(true);
                            setIndustriaEditError("");
                          }}
                          style={{ outline: 'none' }}
                        >
                          <span
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#E0F2FF] text-[#0A7DCE] hover:bg-[#B8E6FF] hover:scale-105 transition-all shadow-sm"
                            style={{ fontSize: '1.5rem' }}
                          >
                            <FiEdit2 />
                          </span>
                        </button>
                        <button
                          className="border-none bg-transparent p-0 m-0 cursor-pointer ml-2"
                          title="Excluir indústria"
                          onClick={() => {
                            setIndustriaSelecionada(ind);
                            setModalDeleteIndustriaOpen(true);
                            setDeleteError("");
                          }}
                          style={{ outline: 'none' }}
                        >
                          <span
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FFE0E0] text-[#CE0A0A] hover:bg-[#FF9D9D] hover:scale-105 transition-all shadow-sm"
                            style={{ fontSize: '1.5rem' }}
                          >
                            <FiTrash2 />
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ColetaDetalhesModal
          isOpen={modalColetaOpen}
          onClose={() => setModalColetaOpen(false)}
          coleta={coletaSelecionada}
          loading={false}
          error={null}
        />
        <ColetaEditModal
          isOpen={modalColetaEditOpen}
          onClose={() => setModalColetaEditOpen(false)}
          coleta={coletaSelecionada}
          industrias={industrias}
          loading={editLoading}
          error={editError}
          onSave={async (form) => {
            setEditLoading(true);
            setEditError("");
            try {
              await coletaService.atualizarColetaPorId(coletaSelecionada.id_coleta, form);
              setModalColetaEditOpen(false);
              // Atualiza lista após edição
              const res = await coletaService.listarColetasPorPropriedade(propriedadeId, page, limit);
              setColetas(res.data || []);
              setMetaColetas(res.meta || null);
            } catch (err) {
              setEditError(err?.message || "Erro ao editar coleta");
            } finally {
              setEditLoading(false);
            }
          }}
        />
        <DeleteIndustriaModal
          isOpen={modalDeleteIndustriaOpen}
          onClose={() => setModalDeleteIndustriaOpen(false)}
          industria={industriaSelecionada}
          loading={deleteLoading}
          error={deleteError}
          onConfirm={async () => {
            setDeleteLoading(true);
            setDeleteError("");
            try {
              await industriaService.removerIndustriaPorId(industriaSelecionada.id_industria);
              setModalDeleteIndustriaOpen(false);
              // Atualiza lista após exclusão
              const res = await industriaService.listarIndustriasPorPropriedade(propriedadeId);
              setIndustrias(res || []);
            } catch (err) {
              setDeleteError(err?.message || "Erro ao excluir indústria");
            } finally {
              setDeleteLoading(false);
            }
          }}
        />
        <DeleteColetaModal
          isOpen={modalDeleteColetaOpen}
          onClose={() => setModalDeleteColetaOpen(false)}
          coleta={coletaSelecionada}
          loading={deleteColetaLoading}
          error={deleteColetaError}
          onConfirm={async () => {
            setDeleteColetaLoading(true);
            setDeleteColetaError("");
            try {
              await coletaService.removerColetaPorId(coletaSelecionada.id_coleta);
              setModalDeleteColetaOpen(false);
              // Atualiza lista após exclusão
              const res = await coletaService.listarColetasPorPropriedade(propriedadeId, page, limit);
              setColetas(res.data || []);
              setMetaColetas(res.meta || null);
            } catch (err) {
              setDeleteColetaError(err?.message || "Erro ao excluir coleta");
            } finally {
              setDeleteColetaLoading(false);
            }
          }}
        />
        <IndustriaDetalhesModal
          isOpen={modalIndustriaDetalhesOpen}
          onClose={() => setModalIndustriaDetalhesOpen(false)}
          industria={industriaDetalhes}
          loading={industriaDetalhesLoading}
          error={industriaDetalhesError}
        />
        <IndustriaEditModal
          isOpen={modalIndustriaEditOpen}
          onClose={() => setModalIndustriaEditOpen(false)}
          industria={industriaSelecionada}
          loading={industriaEditLoading}
          error={industriaEditError}
          onSave={async (form) => {
            setIndustriaEditLoading(true);
            setIndustriaEditError("");
            try {
              await industriaService.atualizarIndustriaPorId(industriaSelecionada.id_industria, form);
              setModalIndustriaEditOpen(false);
              // Atualiza lista após edição
              const res = await industriaService.listarIndustriasPorPropriedade(propriedadeId);
              setIndustrias(res || []);
            } catch (err) {
              setIndustriaEditError(err?.message || "Erro ao editar indústria");
            } finally {
              setIndustriaEditLoading(false);
            }
          }}
        />
        <IndustriaCreateModal
          isOpen={modalIndustriaCreateOpen}
          onClose={() => setModalIndustriaCreateOpen(false)}
          propriedadeId={propriedadeId}
          loading={industriaCreateLoading}
          error={industriaCreateError}
          onSave={async (form) => {
            setIndustriaCreateLoading(true);
            setIndustriaCreateError("");
            try {
              await industriaService.criarIndustria(form);
              setModalIndustriaCreateOpen(false);
              // Atualiza lista após criação
              const res = await industriaService.listarIndustriasPorPropriedade(propriedadeId);
              setIndustrias(res || []);
            } catch (err) {
              setIndustriaCreateError(err?.message || "Erro ao criar indústria");
            } finally {
              setIndustriaCreateLoading(false);
            }
          }}
        />
      </div>
    </>
  );
}
