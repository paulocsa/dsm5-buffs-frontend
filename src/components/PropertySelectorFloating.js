import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { usePropriedade } from "@/contexts/propriedadeContext";
import propriedadeService from "@/services/propriedadeService";
import { Building2, ChevronDown, X, Check } from "lucide-react";

export default function PropertySelectorFloating() {
  const router = useRouter();
  const propriedadeCtx = usePropriedade();

  // obter contexto de propriedade de forma tolerante a diferentes nomes de exportação
  const selectedPropriedadeId =
    propriedadeCtx?.selectedPropriedadeId ??
    propriedadeCtx?.propriedadeId ??
    propriedadeCtx?.selectedPropertyId ??
    null;

  // descobrir o setter disponível (vários nomes possíveis)
  const _rawSetter =
    propriedadeCtx?.setSelectedPropriedadeId ??
    propriedadeCtx?.setPropriedadeId ??
    propriedadeCtx?.setSelectedPropertyId ??
    propriedadeCtx?.setPropertyId ??
    null;

  // setter seguro: chama o setter do contexto se existir, senão grava em localStorage e emite evento
  const setSelectedPropriedadeId = React.useCallback((id) => {
    try {
      if (typeof _rawSetter === "function") {
        _rawSetter(id);
        return;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedPropriedadeId", id);
        // emitir evento simples para que outros listeners possam reagir (fallback)
        window.dispatchEvent(
          new CustomEvent("selectedPropriedadeIdChanged", { detail: id })
        );
      }
    } catch (e) {
      // noop
    }
  }, [_rawSetter]);

  const [propriedades, setPropriedades] = useState([]);
  const [loadingPropriedade, setLoadingPropriedade] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoadingPropriedade(true);
      try {
        const list = await propriedadeService.listarPropriedades();
        if (!ignore) setPropriedades(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!ignore) setPropriedades([]);
      } finally {
        if (!ignore) setLoadingPropriedade(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  // Auto-seleção com respeito ao localStorage:
  // - se existir um id salvo, restaura ele;
  // - se o id salvo não existir na lista, seleciona a primeira e sobrescreve;
  // - se não houver id salvo (primeiro acesso), seleciona a primeira.
  useEffect(() => {
    if (loadingPropriedade) return;
    if (!Array.isArray(propriedades) || propriedades.length === 0) return;

    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("selectedPropriedadeId") : null;

      const selectedExists = selectedPropriedadeId && propriedades.some((p) => p.id_propriedade === selectedPropriedadeId);
      const savedExists = saved && propriedades.some((p) => p.id_propriedade === saved);

      if (saved && !selectedPropriedadeId) {
        // restaura do saved
        setSelectedPropriedadeId(saved);
        return;
      }

      if (saved && !savedExists) {
        // saved stale -> escolhe a primeira e sobrescreve
        setSelectedPropriedadeId(propriedades[0].id_propriedade);
        return;
      }

      // sem saved (primeiro acesso) ou selected não existe na lista
      if (!saved && (!selectedPropriedadeId || !selectedExists)) {
        setSelectedPropriedadeId(propriedades[0].id_propriedade);
      }
    } catch (e) {
      // fallback simples: se algo deu errado, seleciona a primeira se necessário
      if (!selectedPropriedadeId) {
        setSelectedPropriedadeId(propriedades[0].id_propriedade);
      }
    }
  }, [loadingPropriedade, propriedades, selectedPropriedadeId, setSelectedPropriedadeId]);

  const propriedadeSelecionada = useMemo(
    () => propriedades.find((p) => p.id_propriedade === selectedPropriedadeId) || null,
    [propriedades, selectedPropriedadeId]
  );

  const activeName =
    propriedadeSelecionada?.nome_fantasia ||
    propriedadeSelecionada?.nome ||
    "Selecionar";

  const filtered = useMemo(() => {
    const term = (searchTerm || "").toLowerCase().trim();
    if (!term) return propriedades || [];
    return (propriedades || []).filter((p) => {
      const nome = (p.nome_fantasia || p.nome || "").toLowerCase();
      const cnpj = (p.cnpj || "").toLowerCase();
      return nome.includes(term) || cnpj.includes(term);
    });
  }, [searchTerm, propriedades]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) setOpen(false);
  }, []);

  // Se não houver propriedades, não renderiza nada.
  if (!Array.isArray(propriedades) || propriedades.length === 0) return null;

  // Mostrar botão/modal apenas quando houver mais de uma propriedade.
  const showFloating = propriedades.length > 1;
  if (!showFloating) return null; // componente fica montado (effects já rodaram), mas UI não aparece quando só 1

  return (
    <>
      <button
        title="Selecionar Propriedade"
        onClick={() => setOpen(true)}
        disabled={loadingPropriedade}
        className="fixed bottom-6 right-6 z-[1000] bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
      >
        <Building2 size={20} />
        <span className="text-sm font-medium max-w-40 truncate">{activeName}</span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
          onClick={onOverlayClick}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Selecionar Propriedade</h3>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {propriedadeSelecionada && (
              <div className="p-4 bg-blue-50 border-b">
                <p className="text-sm text-gray-600 mb-1">Propriedade ativa:</p>
                <p className="font-semibold text-blue-900">{activeName}</p>
              </div>
            )}

            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Buscar propriedade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "Nenhuma propriedade encontrada" : "Nenhuma propriedade disponível"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((propriedade) => {
                    const isActive = propriedadeSelecionada?.id_propriedade === propriedade.id_propriedade;
                    const title = propriedade.nome_fantasia || propriedade.nome || "Nome não disponível";
                    const subtitle = propriedade.cnpj || "";

                    return (
                      <button
                        key={propriedade.id_propriedade}
                        onClick={() => {
                          setSelectedPropriedadeId(propriedade.id_propriedade);
                          setOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:bg-gray-50 ${
                          isActive ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Building2 size={16} className="text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900">{title}</p>
                              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                            </div>
                          </div>
                          {isActive && <Check size={16} className="text-blue-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
