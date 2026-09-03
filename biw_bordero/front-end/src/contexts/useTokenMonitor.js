// hooks/useTokenMonitor.js
import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const useTokenMonitor = (checkInterval = 60000) => {
  // 1 minuto
  const { user, accessToken, logout, getValidToken } = useAuth();
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  const isRefreshingRef = useRef(false);

  // Função para verificar se o token está expirado
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Date.now() / 1000;
      return payload.exp < now;
    } catch {
      return true;
    }
  };

  // Função para verificar e renovar token
  const checkAndRefreshToken = async () => {
    // Se já está processando, ignora
    if (isRefreshingRef.current) return;

    // Se não tem usuário, não faz nada
    if (!user) return;

    try {
      const currentToken = accessToken;

      // Se não tem token ou está expirado, tenta renovar
      if (!currentToken || isTokenExpired(currentToken)) {
        // console.log("🔍 Token expirado ou ausente, tentando renovar...");
        isRefreshingRef.current = true;

        try {
          const newToken = await getValidToken();

          // Se conseguiu renovar, mantém na página
          if (newToken) {
            // console.log("✅ Token renovado com sucesso");
          } else {
            // Se não conseguiu renovar, faz logout e redireciona
            // console.log("❌ Não foi possível renovar o token");
            await logout();
            navigate("/");
            window.location.reload(); // Força recarregar a página
          }
        } catch (error) {
          console.error("❌ Erro ao renovar token:", error);
          // Em caso de erro, faz logout
          await logout();
          navigate("/");
          window.location.reload();
        } finally {
          isRefreshingRef.current = false;
        }
      }
    } catch (error) {
      console.error("❌ Erro no monitoramento de token:", error);
      isRefreshingRef.current = false;
    }
  };

  // Inicia o monitoramento
  useEffect(() => {
    // Limpa intervalo anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Só inicia o monitoramento se tiver usuário logado
    if (user) {
      //   console.log(
      //     `🔄 Iniciando monitoramento de token (a cada ${checkInterval / 1000} segundos)`,
      //   );

      // Verifica imediatamente ao montar
      checkAndRefreshToken();

      // Configura intervalo
      intervalRef.current = setInterval(() => {
        checkAndRefreshToken();
      }, checkInterval);

      // Event listener para visibilidade da página (voltar de background)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          //   console.log("👁️ Página ficou visível, verificando token...");
          checkAndRefreshToken();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      // Cleanup
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      };
    } else {
      //   console.log("👤 Usuário não logado, monitoramento desativado");
    }
  }, [user, accessToken]); // Reexecuta quando user ou token mudam

  // Função para parar o monitoramento manualmente
  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      //   console.log("⏹️ Monitoramento de token parado");
    }
  };

  return { stopMonitoring };
};
