// // context/AuthContext.jsx
// import React, {
//   createContext,
//   useState,
//   useEffect,
//   useContext,
//   useCallback,
// } from "react";
// import { apiUrl } from "../../api/api.js";
// import { setTokenProvider } from "./authToken.js";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   // Inicializa do localStorage
//   const [user, setUser] = useState(() =>
//     JSON.parse(localStorage.getItem("user")),
//   );
//   const [accessToken, setAccessToken] = useState(() =>
//     localStorage.getItem("accessToken"),
//   );
//   const [refreshToken, setRefreshToken] = useState(() =>
//     localStorage.getItem("refreshToken"),
//   );

//   const isAuthenticated = !!accessToken;

//   // LOGIN
//   const login = async (matricula, senha) => {
//     if (!matricula || !senha) throw new Error("Matrícula e senha obrigatórios");

//     const res = await fetch(`${apiUrl}/authentication/login`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ matricula, senha }),
//     });

//     if (!res.ok) {
//       const errData = await res.json();
//       throw new Error(errData.error || "Erro ao fazer login");
//     }

//     const data = await res.json();

//     setUser(data.usuario);
//     setAccessToken(data.accessToken);
//     setRefreshToken(data.refreshToken);

//     localStorage.setItem("user", JSON.stringify(data.usuario));
//     localStorage.setItem("accessToken", data.accessToken);
//     localStorage.setItem("refreshToken", data.refreshToken);

//     return data;
//   };

//   const register = async ({ matricula, nome, sobrenome, area }) => {
//     if (!matricula || !nome || !sobrenome || !area) {
//       throw new Error("Todos os campos são obrigatórios");
//     }

//     // 1️⃣ Primeiro, registra o usuário
//     const res = await fetch(`${apiUrl}/authentication/register`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ matricula, nome, sobrenome, area }),
//     });

//     if (!res.ok) {
//       const errData = await res.json();
//       throw new Error(errData.error || "Erro ao cadastrar usuário");
//     }

//     // 2️⃣ Depois, faz login automático usando a matrícula como senha
//     const loginRes = await fetch(`${apiUrl}/authentication/login`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ matricula, senha: matricula }),
//     });

//     if (!loginRes.ok) {
//       const errData = await loginRes.json();
//       throw new Error(errData.error || "Erro ao fazer login após cadastro");
//     }

//     const data = await loginRes.json();

//     // Atualiza estado global / localStorage
//     setUser(data.usuario);
//     setAccessToken(data.accessToken);
//     setRefreshToken(data.refreshToken);

//     localStorage.setItem("user", JSON.stringify(data.usuario));
//     localStorage.setItem("accessToken", data.accessToken);
//     localStorage.setItem("refreshToken", data.refreshToken);

//     return data;
//   };

//   // LOGOUT
//   const logout = async () => {
//     setUser(null);
//     setAccessToken(null);
//     setRefreshToken(null);
//     localStorage.removeItem("user");
//     localStorage.removeItem("accessToken");
//     localStorage.removeItem("refreshToken");

//     try {
//       await fetch(`${apiUrl}/authentication/logout`, {
//         method: "POST",
//         headers: { Authorization: `Bearer ${accessToken}` },
//       });
//     } catch (err) {
//       console.warn("Logout no backend falhou:", err.message);
//     }
//   };

//   // REFRESH TOKEN
//   const refreshAccessToken = async () => {
//     if (!refreshToken) return null;

//     try {
//       const res = await fetch(`${apiUrl}/authentication/refresh-token`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ refreshToken }),
//       });

//       if (!res.ok) throw new Error("Refresh token inválido");

//       const data = await res.json();
//       setAccessToken(data.accessToken);
//       localStorage.setItem("accessToken", data.accessToken);

//       return data.accessToken;
//     } catch (err) {
//       console.error("Falha ao renovar access token:", err.message);
//       logout();
//       return null;
//     }
//   };

//   const isTokenExpired = (token) => {
//     try {
//       const payload = JSON.parse(atob(token.split(".")[1]));
//       const now = Date.now() / 1000; // em segundos
//       return payload.exp < now;
//     } catch {
//       return true;
//     }
//   };

//   const getValidToken = useCallback(async () => {
//     console.log("🔄 getValidToken chamado, accessToken atual:", !!accessToken);

//     if (!accessToken) {
//       if (!refreshToken) {
//         console.log("❌ Sem tokens, fazendo logout");
//         logout();
//         throw new Error("Sessão expirada");
//       }
//       console.log("🔄 Sem accessToken, tentando refresh");
//       await refreshAccessToken();
//       return localStorage.getItem("accessToken");
//     }

//     if (isTokenExpired(accessToken)) {
//       console.log("⏰ Token expirado, renovando...");
//       await refreshAccessToken();
//       return localStorage.getItem("accessToken");
//     }

//     console.log("✅ Token válido");
//     return accessToken;
//   }, [accessToken, refreshToken]);

//   // Chama setTokenProvider sempre que getValidToken mudar
//   useEffect(() => {
//     console.log("📡 Atualizando token provider");
//     setTokenProvider(getValidToken);
//   }, [getValidToken]);

//   // Ao iniciar, tenta renovar token se existir refreshToken
//   useEffect(() => {
//     if (!accessToken && refreshToken) {
//       refreshAccessToken();
//     }
//   }, []);

//   useEffect(() => {
//     setTokenProvider(getValidToken);
//   }, [accessToken, refreshToken]);

//   // Refresh automático a cada 10 minutos
//   // useEffect(() => {
//   //   if (!accessToken) return;

//   //   const interval = setInterval(
//   //     () => {
//   //       refreshAccessToken();
//   //     },
//   //     10 * 60 * 1000,
//   //   ); // 10 min

//   //   return () => clearInterval(interval);
//   // }, [accessToken, refreshToken]);

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         isAuthenticated,
//         accessToken,
//         login,
//         logout,
//         register,
//         getValidToken,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Hook para consumir contexto
// export const useAuth = () => useContext(AuthContext);

// context/AuthContext.jsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import { apiUrl } from "../../api/api.js";
import { setTokenProvider } from "./authToken.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user")),
  );
  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem("accessToken"),
  );
  const [refreshToken, setRefreshToken] = useState(() =>
    localStorage.getItem("refreshToken"),
  );

  const isAuthenticated = !!accessToken;

  // Usar ref para ter acesso aos valores mais recentes
  const accessTokenRef = useRef(accessToken);
  const refreshTokenRef = useRef(refreshToken);

  useEffect(() => {
    accessTokenRef.current = accessToken;
    refreshTokenRef.current = refreshToken;
  }, [accessToken, refreshToken]);

  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Date.now() / 1000;
      return payload.exp < now;
    } catch {
      return true;
    }
  };

  const refreshAccessToken = async () => {
    const currentRefreshToken = refreshTokenRef.current;

    if (!currentRefreshToken) return null;

    try {
      const res = await fetch(`${apiUrl}/authentication/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      if (!res.ok) throw new Error("Refresh token inválido");

      const data = await res.json();
      setAccessToken(data.accessToken);
      localStorage.setItem("accessToken", data.accessToken);

      return data.accessToken;
    } catch (err) {
      console.error("Falha ao renovar access token:", err.message);
      logout();
      return null;
    }
  };

  // Função getValidToken usando refs
  const getValidToken = async () => {
    // console.log("🔄 getValidToken chamado");
    const currentAccessToken = accessTokenRef.current;
    const currentRefreshToken = refreshTokenRef.current;

    // console.log("Token status:", {
    //   hasAccessToken: !!currentAccessToken,
    //   hasRefreshToken: !!currentRefreshToken,
    // });

    if (!currentAccessToken) {
      if (!currentRefreshToken) {
        console.log("❌ Sem tokens, erro");
        throw new Error("Sessão expirada");
      }

      console.log("🔄 Sem accessToken, fazendo refresh");
      const newToken = await refreshAccessToken();
      return newToken;
    }

    if (isTokenExpired(currentAccessToken)) {
      console.log("⏰ Token expirado, renovando...");
      const newToken = await refreshAccessToken();
      return newToken;
    }

    // console.log("✅ Token válido");
    return currentAccessToken;
  };

  // LOGIN - ATUALIZAR PROVIDER APÓS LOGIN
  const login = async (matricula, senha) => {
    if (!matricula || !senha) throw new Error("Matrícula e senha obrigatórios");

    const res = await fetch(`${apiUrl}/authentication/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula, senha }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Erro ao fazer login");
    }

    const data = await res.json();

    setUser(data.usuario);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);

    localStorage.setItem("user", JSON.stringify(data.usuario));
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    // ✅ ATUALIZAR O PROVIDER APÓS LOGIN
    setTokenProvider(getValidToken);
    console.log("✅ Token provider atualizado após login");

    return data;
  };

  const register = async ({ matricula, nome, sobrenome, area }) => {
    if (!matricula || !nome || !sobrenome || !area) {
      throw new Error("Todos os campos são obrigatórios");
    }

    const res = await fetch(`${apiUrl}/authentication/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula, nome, sobrenome, area }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Erro ao cadastrar usuário");
    }

    const loginRes = await fetch(`${apiUrl}/authentication/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula, senha: matricula }),
    });

    if (!loginRes.ok) {
      const errData = await loginRes.json();
      throw new Error(errData.error || "Erro ao fazer login após cadastro");
    }

    const data = await loginRes.json();

    setUser(data.usuario);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);

    localStorage.setItem("user", JSON.stringify(data.usuario));
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    // ✅ ATUALIZAR O PROVIDER APÓS REGISTER
    setTokenProvider(getValidToken);
    console.log("✅ Token provider atualizado após register");

    return data;
  };

  const logout = async () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    try {
      await fetch(`${apiUrl}/authentication/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessTokenRef.current}` },
      });
    } catch (err) {
      console.warn("Logout no backend falhou:", err.message);
    }
  };

  // ✅ INICIALIZAR PROVIDER UMA ÚNICA VEZ
  useEffect(() => {
    console.log("Inicializando token provider");
    setTokenProvider(getValidToken);
  }, []); // Array vazio = executa só uma vez

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        accessToken,
        login,
        logout,
        register,
        getValidToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
