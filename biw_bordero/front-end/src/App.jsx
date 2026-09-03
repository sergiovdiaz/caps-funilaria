import React, { useState, Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useParams,
  Navigate,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Header from "./components/Header";
import SidebarMenu from "./components/SidebarMenu";
import LoginModal from "./components/LoginModal";

import { ActualShiftProvider } from "./components/ActualShiftContext";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import useSilentUpdate from "./hooks/useSilentUpdate";
import { useTokenMonitor } from "./contexts/useTokenMonitor"; // ← NOVO

import { ToastProvider } from "./contexts/ToastContext";

import "./App.css";

/* ==========================
   Lazy imports (ROTAS)
========================== */
const Main = lazy(() => import("./pages/Main"));
const CycleTime = lazy(() => import("./pages/CycleTime"));
const FaultMonitoringSystem = lazy(
  () => import("./pages/FaultMonitoringSystem"),
);
const Teladados = lazy(() => import("./components/savision/teladados"));
const Cap = lazy(() => import("./pages/Cap"));
const CapResumoPendencias = lazy(
  () => import("./components/cap/CapResumoPendencias"),
);
const CapHistorico = lazy(() => import("./components/cap/CapHistorico"));
const DefectsPage = lazy(() => import("./components/DefectsPage"));
const Bordero = lazy(() => import("./pages/Bordero"));
const SinopticoProdutivo = lazy(() => import("./pages/SinopticoProdutivo"));
const SinopticoAndon = lazy(
  () => import("./components/sinopticoprodutivo/SinopticoAndon"),
);
const SinopticoHistoryTc = lazy(
  () => import("./components/sinopticoprodutivo/SinopticoHistoryTc"),
);
const PCMProgramacao = lazy(() => import("./pages/PCMProgramacao"));
const MachineLedgerPage = lazy(() => import("./pages/MachineLedgerPage"));
const DashboardGeral = lazy(
  () => import("./components/bordero/geral/page/DashboardGeral"),
);
const RelatorioTC = lazy(() => import("./components/tc/page/RelatorioTC"));
const StatusMedicao = lazy(
  () => import("./components/weldingreport/page/StatusMedicao"),
);
const LdaRelatorio = lazy(() => import("./components/lda/page/LdaRelatorio"));

/* ==========================
   Layout
========================== */
const Layout = ({ children, menuAberto, fecharMenu }) => (
  <div className="App__content">
    <SidebarMenu menuAberto={menuAberto} fecharMenu={fecharMenu} />
    {children}
  </div>
);

/* ==========================
   Protected Route
========================== */
const ProtectedRoute = ({ children, onRequestLogin }) => {
  const { user } = useAuth();

  if (!user) {
    onRequestLogin?.();
    return null;
  }

  return children;
};

/* ==========================
   App Content
========================== */
const AppContent = () => {
  const [menuAberto, setMenuAberto] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const location = useLocation();
  const isAndonRoute = location.pathname.startsWith("/andon");

  // NOVO: Inicia o monitoramento de token (a cada 1 minuto)
  useTokenMonitor(60000); // 60 segundos

  useEffect(() => {
    // Listener para eventos de token expirado
    const handleTokenExpired = () => {
      console.log("🔒 Token expirado, redirecionando para login...");
      setShowLoginModal(true);
    };

    window.addEventListener("token-expired", handleTokenExpired);

    return () => {
      window.removeEventListener("token-expired", handleTokenExpired);
    };
  }, []);

  return (
    <div className="app">
      <ToastProvider>
        {!isAndonRoute && (
          <Header
            setMenuAberto={setMenuAberto}
            setShowLoginModal={setShowLoginModal}
          />
        )}
        {showLoginModal && (
          <LoginModal
            show={showLoginModal}
            onClose={() => setShowLoginModal(false)}
          />
        )}

        <Suspense
          fallback={
            <div className="page-loading">
              <div className="loader" />
              <span>Carregando…</span>
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    <ActualShiftProvider>
                      <Main />
                    </ActualShiftProvider>
                  </Layout>
                }
              />

              <Route
                path="/Trend"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    <ActualShiftProvider>
                      <Main />
                    </ActualShiftProvider>
                  </Layout>
                }
              />

              <Route
                path="/TempoCiclo/live"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    <CycleTime />
                  </Layout>
                }
              />

              <Route
                path="/TempoCiclo/relatorio"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    <RelatorioTC />
                  </Layout>
                }
              />

              <Route
                path="/dados"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    <Teladados />
                  </Layout>
                }
              />

              <Route
                path="/cap/justificar/:line?"
                element={
                  <ProtectedRoute
                    onRequestLogin={() => setShowLoginModal(true)}
                  >
                    <Layout
                      menuAberto={menuAberto}
                      fecharMenu={() => setMenuAberto(false)}
                    >
                      <Cap line="SCC" />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/cap/pendencias"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    <CapResumoPendencias />
                  </Layout>
                }
              />

              <Route
                path="/cap/historico"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    <CapHistorico />
                  </Layout>
                }
              />

              <Route
                path="/defeitos/lancamento"
                element={
                  <ProtectedRoute
                    onRequestLogin={() => setShowLoginModal(true)}
                  >
                    <Layout
                      menuAberto={menuAberto}
                      fecharMenu={() => setMenuAberto(false)}
                    >
                      <DefectsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bordero/:line?"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    <Bordero />
                  </Layout>
                }
              />

              <Route
                path="/dashboardgeral"
                element={
                  <ProtectedRoute
                    onRequestLogin={() => setShowLoginModal(true)}
                  >
                    <Layout
                      menuAberto={menuAberto}
                      fecharMenu={() => setMenuAberto(false)}
                    >
                      <DashboardGeral />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/monitoramentodefalhas"
                element={
                  <ProtectedRoute
                    onRequestLogin={() => setShowLoginModal(true)}
                  >
                    <Layout
                      menuAberto={menuAberto}
                      fecharMenu={() => setMenuAberto(false)}
                    >
                      <FaultMonitoringSystem />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/andon/:line"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    {(() => {
                      const { line } = useParams();
                      return <SinopticoAndon line={line} />;
                    })()}
                  </Layout>
                }
              />

              <Route
                path="/sinoptico"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    <SinopticoProdutivo />
                  </Layout>
                }
              />
              <Route
                path="/tempociclo/dashboard"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    <SinopticoHistoryTc />
                  </Layout>
                }
              />

              <Route
                path="/pcm/programacao"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    <PCMProgramacao
                      onRequestLogin={() => setShowLoginModal(true)}
                    />
                  </Layout>
                }
              />

              <Route
                path="/machineledger"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    <MachineLedgerPage />
                  </Layout>
                }
              />
              <Route
                path="/welding/monitoramento/medicao-corrente"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    <StatusMedicao />
                  </Layout>
                }
              />
              <Route
                path="/lda"
                element={
                  <Layout
                    menuAberto={menuAberto}
                    fecharMenu={() => setMenuAberto(false)}
                  >
                    <LdaRelatorio />
                  </Layout>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </ToastProvider>
    </div>
  );
};

/* ==========================
   App
========================== */
const App = () => {
  useSilentUpdate();
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
