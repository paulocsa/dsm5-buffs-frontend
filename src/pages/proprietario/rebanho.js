"use client";

import { useEffect, useState } from "react";
import { usePropriedade } from "@/contexts/propriedadeContext";
import dashboardService from "@/services/dashboardService";
import bufaloService from "@/services/bufaloService";
import dadosSanitariosService from "@/services/dadosSanitariosService";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, XAxis, YAxis, Bar } from "recharts";
import BuffaloModal from "@/components/proprietario/rebanho/prontuarioModal";
import CriarBufaloModal from "@/components/proprietario/rebanho/CriarBufaloModal";

export default function Rebanho() {
	// obter id da propriedade via context
	const { propriedadeId } = usePropriedade();

	// estado para dados do dashboard
	const [dashboardStats, setDashboardStats] = useState(null);
	const [loadingStats, setLoadingStats] = useState(false);

	// búfalos / paginação
	const [bufalos, setBufalos] = useState([]);
	const [metaBufalos, setMetaBufalos] = useState(null);
	const [loadingBufalos, setLoadingBufalos] = useState(false);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [modalOpen, setModalOpen] = useState(false);
	const [bufaloSelecionado, setBufaloSelecionado] = useState(null);
	const [modalCriarBufaloOpen, setModalCriarBufaloOpen] = useState(false);

	// frequência de doenças
	const [frequenciaDoencas, setFrequenciaDoencas] = useState([]);
	const [loadingDoencas, setLoadingDoencas] = useState(false);

	useEffect(() => {
		if (!propriedadeId) {
			setDashboardStats(null);
			return;
		}
		let ignore = false;
		(async () => {
			setLoadingStats(true);
			try {
				const data = await dashboardService.getDashboardStatsByPropriedadeId(propriedadeId);
				if (!ignore) setDashboardStats(data || null);
			} catch (e) {
				if (!ignore) setDashboardStats(null);
			} finally {
				if (!ignore) setLoadingStats(false);
			}
		})();
		return () => { ignore = true; };
	}, [propriedadeId]);

	// buscar búfalos da propriedade (paginação)
	useEffect(() => {
		if (!propriedadeId) {
			setBufalos([]);
			setMetaBufalos(null);
			return;
		}
		let ignore = false;
		(async () => {
			setLoadingBufalos(true);
			try {
				const res = await bufaloService.listarBufalosPorPropriedade(propriedadeId, page, limit);
				if (ignore) return;
				// res deve ter formato: { data: [...], meta: {...} }
				setBufalos(Array.isArray(res?.data) ? res.data : []);
				setMetaBufalos(res?.meta ?? null);
			} catch (err) {
				if (!ignore) {
					setBufalos([]);
					setMetaBufalos(null);
				}
			} finally {
				if (!ignore) setLoadingBufalos(false);
			}
		})();
		return () => { ignore = true; };
	}, [propriedadeId, page, limit]);

	// buscar frequência de doenças
	useEffect(() => {
		if (!propriedadeId) return;
		let ignore = false;
		(async () => {
			setLoadingDoencas(true);
			try {
				const data = await dadosSanitariosService.obterFrequenciaDoencasPorPropriedade(propriedadeId);
				if (!ignore) setFrequenciaDoencas(data.dados || []);
			} catch (e) {
				if (!ignore) setFrequenciaDoencas([]);
			} finally {
				if (!ignore) setLoadingDoencas(false);
			}
		})();
		return () => { ignore = true; };
	}, [propriedadeId]);

	// helpers para exibir valores com fallback
	const totalAtivos =
		(dashboardStats?.qtd_macho_ativos ?? 0) + (dashboardStats?.qtd_femeas_ativas ?? 0);
	const femeasAtivas = dashboardStats?.qtd_femeas_ativas ?? null;
	const machosAtivos = dashboardStats?.qtd_macho_ativos ?? null;
	const lactando = (dashboardStats?.qtd_bufalas_lactando ?? null) ?? dashboardStats?.qtd_bufalos_vaca ?? null;

	const pct = (value, total) =>
		total > 0 && value != null ? `${Math.round((value / total) * 100)}% do rebanho` : "0% do rebanho";

	// dados de maturidade para o gráfico (vêm do endpoint)
	const maturidadeData = [
		{ name: "Bezerros", value: dashboardStats?.qtd_bufalos_bezerro ?? 0, color: "#FCA90F" },
		{ name: "Novilhas", value: dashboardStats?.qtd_bufalos_novilha ?? 0, color: "#FFCF78" },
		{ name: "Vacas", value: dashboardStats?.qtd_bufalos_vaca ?? 0, color: "#CE7D0A" },
		{ name: "Touros", value: dashboardStats?.qtd_bufalos_touro ?? 0, color: "#F2B84D" },
	];

	// dados de sexo para o gráfico (vêm do endpoint)
	const sexData = [
		{ name: "Fêmeas", value: dashboardStats?.qtd_femeas_ativas ?? 0, color: "#FFCF78" },
		{ name: "Machos", value: dashboardStats?.qtd_macho_ativos ?? 0, color: "#CE7D0A" },
	];

	return (
		<div className="p-6 flex flex-col gap-8">
			{/* Header - Gestão do Rebanho */}
			<div className="w-full flex flex-col bg-white rounded-xl p-6 gap-6 box-border border border-[#e0e0e0] shadow-sm">
				<div>
					<h1 className="text-3xl font-bold text-gray-800 mb-2">
						Gestão do Rebanho
					</h1>
					<p className="text-gray-600 text-lg">
						Gerencie seu rebanho de búfalos, registre informações zootécnicas e sanitárias.
					</p>
				</div>

				{/* Resumo do Rebanho */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="bg-white p-4 rounded-lg shadow border border-[#e0e0e0]">
						<div className="flex items-center justify-between mb-1">
							<h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
								Total do Rebanho
							</h2>
							<span className="text-xs font-medium text-[var(--color-primary-dark]">
								Ativos
							</span>
						</div>
						<p className="text-4xl font-extrabold tracking-tight text-[var(--color-text-dark]">
							{loadingStats ? "-" : (totalAtivos || "-")}
						</p>
						<p className="text-xs text-[var(--color-text-tertiary)] mt-1">
							{loadingStats ? "Carregando..." : "Búfalos ativos no sistema"}
						</p>
					</div>

					<div className="bg-white p-4 rounded-lg shadow border border-[#e0e0e0]">
						<div className="flex items-center justify-between mb-1">
							<h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">Fêmeas</h2>
							<span className="text-xs font-medium text-[var(--color-primary-dark)]">Percentual</span>
						</div>
						<p className="text-4xl font-extrabold tracking-tight text-[var(--color-text-dark)]">
							{loadingStats ? "-" : (femeasAtivas ?? "-")}
						</p>
						<p className="text-sm font-semibold text-[var(--color-primary-dark)] mt-1">
							{loadingStats ? "-" : (femeasAtivas != null ? pct(femeasAtivas, totalAtivos) : "0% do rebanho")}
						</p>
					</div>

					<div className="bg-white p-4 rounded-lg shadow border border-[#e0e0e0]">
						<div className="flex items-center justify-between mb-1">
							<h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">Machos</h2>
							<span className="text-xs font-medium text-[var(--color-primary-dark)]">Percentual</span>
						</div>
						<p className="text-4xl font-extrabold tracking-tight text-[var(--color-text-dark)]">
							{loadingStats ? "-" : (machosAtivos ?? "-")}
						</p>
						<p className="text-sm font-semibold text-[var(--color-primary-dark)] mt-1">
							{loadingStats ? "-" : (machosAtivos != null ? pct(machosAtivos, totalAtivos) : "0% do rebanho")}
						</p>
					</div>

					<div className="bg-white p-4 rounded-lg shadow border border-[#e0e0e0]">
						<div className="flex items-center justify-between mb-1">
							<h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">Vacas Produtoras</h2>
							<span className="text-xs font-medium text-[var(--color-primary-dark)]">Ativas</span>
						</div>
						<p className="text-4xl font-extrabold tracking-tight text-[var(--color-text-dark)]">
							{loadingStats ? "-" : (lactando ?? "-")}
						</p>
						<p className="text-sm font-medium text-[var(--color-text-tertiary)] mt-1">
							Em lactação
						</p>
					</div>
				</div>
			</div>

			{/* Gráficos de Análise (placeholders visuais) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="bg-white rounded-xl p-5 border border-[#e0e0e0] shadow-sm">
					<h2 className="text-lg font-semibold text-gray-800 mb-4">Distribuição por Maturidade</h2>
					<div className="flex flex-col items-center justify-center h-[160px] text-center">
						{loadingStats ? (
							<p className="text-gray-400 text-sm mt-6">Carregando dados...</p>
						) : !dashboardStats ? (
							<p className="text-gray-400 text-sm mt-6">Nenhum dado disponível</p>
						) : (
							<ResponsiveContainer width="100%" height={160}>
								<PieChart>
									<Pie
										data={maturidadeData}
										dataKey="value"
										nameKey="name"
										cx="50%"
										cy="50%"
										outerRadius={60}
										label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
									>
										{maturidadeData.map((entry, index) => (
											<Cell key={`cell-mat-${index}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip formatter={(value) => [`${value}`, "Quantidade"]} />
								</PieChart>
							</ResponsiveContainer>
						)}
					</div>
				</div>

				<div className="bg-white rounded-xl p-5 border border-[#e0e0e0] shadow-sm">
					<h2 className="text-lg font-semibold text-gray-800 mb-4">Distribuição por Sexo</h2>
					<div className="flex flex-col items-center justify-center h-[160px] text-center">
						{loadingStats ? (
							<p className="text-gray-400 text-sm mt-6">Carregando dados...</p>
						) : !dashboardStats ? (
							<p className="text-gray-400 text-sm mt-6">Nenhum dado disponível</p>
						) : (
							<ResponsiveContainer width="100%" height={160}>
								<PieChart>
									<Pie
										data={sexData}
										dataKey="value"
										nameKey="name"
										cx="50%"
										cy="50%"
										outerRadius={60}
										label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
									>
										{sexData.map((entry, index) => (
											<Cell key={`cell-sex-${index}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip formatter={(value) => [`${value}`, "Quantidade"]} />
								</PieChart>
							</ResponsiveContainer>
						)}
					</div>
				</div>

				<div className="bg-white rounded-xl p-5 border border-[#e0e0e0] shadow-sm">
					<h2 className="text-lg font-semibold text-gray-800 mb-4">Distribuição por Raça</h2>
					<div className="flex flex-col items-center justify-center h-[160px] text-center">
						{loadingStats ? (
							<p className="text-gray-400 text-sm mt-6">Carregando dados...</p>
						) : !dashboardStats ? (
							<p className="text-gray-400 text-sm mt-6">Nenhum dado disponível</p>
						) : (
							<ResponsiveContainer width="100%" height={160}>
								<PieChart>
									<Pie
										data={dashboardStats.bufalosPorRaca || []}
										dataKey="quantidade"
										nameKey="raca"
										cx="50%"
										cy="50%"
										outerRadius={60}
										label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
									>
										{(dashboardStats.bufalosPorRaca || []).map((entry, index) => (
											<Cell key={`cell-raca-${index}`} fill={["#FCA90F", "#FFCF78", "#CE7D0A", "#F2B84D"][index % 4]} />
										))}
									</Pie>
									<Tooltip formatter={(value) => [`${value}`, "Quantidade"]} />
								</PieChart>
							</ResponsiveContainer>
						)}
					</div>
				</div>
			</div>

			{/* Tabela de Búfalos com Filtros (apenas visual) */}
			<div className="w-full flex flex-col bg-white rounded-xl p-5 gap-4 box-border border border-[#e0e0e0] shadow-sm">
				<div className="mb-4">
					<div className="flex justify-between items-center mb-2">
						<h2 className="text-2xl font-bold text-gray-800">Registro de Búfalos</h2>
						<button
							className="bg-[#FFCF78] hover:bg-[#F2B84D] text-gray-800 font-medium py-2 px-4 rounded-lg"
							onClick={() => setModalCriarBufaloOpen(true)}
						>
							+ Adicionar Búfalo
						</button>
					</div>
					<p className="text-gray-600">Lista estática para visualização do layout.</p>
				</div>

				{/* Filtros (visuais apenas) */}
				<div className="bg-gray-50 rounded-lg p-4 mb-4">
					<div className="flex flex-wrap items-center gap-4">
						<h3 className="text-sm font-semibold text-gray-700 mr-2">Filtros:</h3>
						<div className="flex items-center gap-2">
							<label className="text-sm text-gray-600">Sexo:</label>
							<select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
								<option>Todos</option>
								<option>Fêmea</option>
								<option>Macho</option>
							</select>
						</div>
						<div className="flex items-center gap-2">
							<label className="text-sm text-gray-600">Raça:</label>
							<select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
								<option>Todas</option>
								<option>Murrah</option>
								<option>Jafarabadi</option>
							</select>
						</div>
						<div className="flex items-center gap-2">
							<label className="text-sm text-gray-600">Maturidade:</label>
							<select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
								<option>Todas</option>
								<option>Adulto</option>
								<option>Bezerro</option>
							</select>
						</div>
					</div>
				</div>

				<div className="overflow-x-auto w-full">
					<table className="w-full border-collapse min-w-[800px] bg-white rounded-lg overflow-hidden shadow-sm">
						<thead className="bg-[#f0f0f0]">
							<tr>
								<th className="p-3 text-center font-medium text-gray-800 text-base">TAG</th>
								<th className="p-3 text-center font-medium text-gray-800 text-base">Nome</th>
								<th className="p-3 text-center font-medium text-gray-800 text-base">Sexo</th>
								<th className="p-3 text-center font-medium text-gray-800 text-base">Raça</th>
								<th className="p-3 text-center font-medium text-gray-800 text-base">Maturidade</th>
								<th className="p-3 text-center font-medium text-gray-800 text-base">Status</th>
								<th className="p-3 text-center font-medium text-gray-800 text-base">Ações</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-gray-200">
							{loadingBufalos ? (
								<tr>
									<td colSpan="7" className="text-center p-6 text-gray-500">Carregando búfalos...</td>
								</tr>
							) : bufalos.length === 0 ? (
								<tr>
									<td colSpan="7" className="text-center p-6 text-gray-500">Nenhum búfalo encontrado</td>
								</tr>
							) : (
								bufalos.map((b) => (
									<tr key={b.id_bufalo} className="odd:bg-white even:bg-[#fafafa]">
										<td className="p-3 text-center text-gray-800 text-base font-medium">{b.brinco || b.id_bufalo}</td>
										<td className="p-3 text-center text-gray-800 text-base">{b.nome}</td>
										<td className="p-3 text-center text-gray-800 text-base">
											{b.sexo === "M" ? "Macho" : b.sexo === "F" ? "Fêmea" : b.sexo}
										</td>
										<td className="p-3 text-center text-gray-800 text-base">{b.raca?.nome || "N/D"}</td>
										<td className="p-3 text-center text-gray-800 text-base">
											{(() => {
												switch (b.nivel_maturidade) {
													case "B": return "Bezerro(a)";
													case "N": return "Novilho(a)";
													case "V": return "Vaca";
													case "T": return "Touro";
													case "A": return "Adulto";
													default: return b.nivel_maturidade || "N/D";
												}
											})()}
										</td>
										<td className="p-3 text-center text-gray-800 text-base">
											<span className={`px-2.5 py-1.5 rounded-full text-sm font-bold inline-block w-28 ${b.status ? "bg-[#9DFFBE] text-gray-800" : "bg-red-200 text-red-800"}`}>
												{b.status ? "Ativo" : "Inativo"}
											</span>
										</td>
										<td className="p-3 text-center">
											<button
												onClick={() => {
													setBufaloSelecionado(b.id_bufalo);
													setModalOpen(true);
												}}
												className="bg-[#FFCF78] hover:bg-[#F2B84D] text-black px-3 py-1 rounded-lg text-sm font-medium"
											>
												Prontuário
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Paginação simples */}
				{metaBufalos && metaBufalos.totalPages > 1 && (
					<div className="flex justify-center items-center space-x-2 mt-4">
						<button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={metaBufalos.page <= 1}
							className={`px-4 py-2 rounded-lg font-medium ${metaBufalos.page <= 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#FFCF78] hover:bg-[#F2B84D] text-gray-800"}`}
						>
							Anterior
						</button>

						{Array.from({ length: metaBufalos.totalPages }, (_, i) => i + 1).map((p) => (
							<button
								key={p}
								onClick={() => setPage(p)}
								className={`w-10 h-10 rounded-lg font-medium ${metaBufalos.page === p ? "bg-[#CE7D0A] text-white" : "bg-gray-200 hover:bg-[#FFCF78] text-gray-800"}`}
							>
								{p}
							</button>
						))}

						<button
							onClick={() => setPage((p) => Math.min(metaBufalos.totalPages, p + 1))}
							disabled={metaBufalos.page >= metaBufalos.totalPages}
							className={`px-4 py-2 rounded-lg font-medium ${metaBufalos.page >= metaBufalos.totalPages ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#FFCF78] hover:bg-[#F2B84D] text-gray-800"}`}
						>
							Próximo
						</button>
					</div>
				)}
			</div>

			{/* Gráfico de Frequência de Doenças */}
			<div className="w-full flex flex-col bg-white rounded-xl p-5 gap-4 box-border border border-[var(--color-border-primary)] shadow-sm">
				<h2 className="text-2xl font-bold text-[var(--color-text-dark)]">Frequência de Doenças</h2>
				{loadingDoencas ? (
					<p className="text-[var(--color-text-tertiary)]">Carregando dados...</p>
				) : frequenciaDoencas.length === 0 ? (
					<p className="text-[var(--color-text-tertiary)]">Nenhum dado disponível</p>
				) : (
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={frequenciaDoencas} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
							<XAxis dataKey="doenca" stroke="var(--color-text-secondary)" />
							<YAxis stroke="var(--color-text-secondary)" />
							<Tooltip contentStyle={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border-primary)' }} />
							<Bar dataKey="frequencia" fill="var(--color-primary)" />
						</BarChart>
					</ResponsiveContainer>
				)}
			</div>

			<BuffaloModal open={modalOpen} onClose={() => setModalOpen(false)} idBufalo={bufaloSelecionado} />
			<CriarBufaloModal
				open={modalCriarBufaloOpen}
				onClose={() => setModalCriarBufaloOpen(false)}
				propriedadeId={propriedadeId}
				onSuccess={() => {
					// Atualizar lista de búfalos após criar um novo
					setPage(1); // Reinicia a paginação para carregar a lista atualizada
				}}
			/>
		</div>
	);
}