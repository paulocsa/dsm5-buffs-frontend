import React, { createContext, useContext, useState } from "react";
import { useRouter } from "next/router";
import { AuthProvider } from "@/contexts/authContext";
import Layout from "@/layout/Layout";

const PropriedadeContext = createContext(null);

export function PropriedadeProvider({ children }) {
  // estado simples para id da propriedade e token (se precisar)
  const [propriedadeId, setPropriedadeId] = useState(null);
  const [token, setToken] = useState(null);

  // helper opcional para inicializar (por exemplo ao logar ou escolher fazenda)
  const init = (id, tok) => {
    setPropriedadeId(id);
    if (tok !== undefined) setToken(tok);
  };

  return (
    <PropriedadeContext.Provider
      value={{ propriedadeId, setPropriedadeId, token, setToken, init }}
    >
      {children}
    </PropriedadeContext.Provider>
  );
}

export function usePropriedade() {
  const ctx = useContext(PropriedadeContext);
  if (!ctx) {
    throw new Error("usePropriedade must be used within PropriedadeProvider");
  }
  return ctx;
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  // Rotas que não devem usar o layout global
  const noLayoutRoutes = ["/auth/login", "/auth/register", "/complete-profile"];
  const useLayout = !noLayoutRoutes.includes(router.pathname);
  return (
    <AuthProvider>
      <PropriedadeProvider initialId={null}>
        {useLayout ? (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        ) : (
          <Component {...pageProps} />
        )}
      </PropriedadeProvider>
    </AuthProvider>
  );
}