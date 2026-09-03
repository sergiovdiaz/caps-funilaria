// api.methods.js
import { getToken } from "../src/contexts/authToken";

const API_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_URL) {
  console.warn("VITE_API_BASE_URL não definida");
}

async function handleResponse(res) {
  let data = null;

  try {
    data = await res.json();
    console.log("📦 Resposta da API:", {
      status: res.status,
      ok: res.ok,
      data: data,
    });
  } catch (err) {
    console.error("❌ Erro ao parsear JSON da resposta:", err);
    try {
      const text = await res.text();
      console.log("Texto da resposta (não JSON):", text.substring(0, 500));
    } catch (textErr) {
      console.error("Não foi possível ler o texto da resposta:", textErr);
    }
  }

  // Se for 401 (Unauthorized) ou 403 (Forbidden), redireciona para login
  if (res.status === 401 || res.status === 403) {
    console.error(`🔒 Erro ${res.status} - Não autorizado`);

    // Dispara evento para o monitor de token
    window.dispatchEvent(new CustomEvent("token-expired"));

    // Limpa tokens
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    // Redireciona para login
    if (window.location.pathname !== "/") {
      window.location.href = "/";
    }

    const error = new Error("Sessão expirada. Faça login novamente.");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  if (!res.ok) {
    console.error(`❌ Requisição falhou com status ${res.status}`);
    const errorMessage =
      data?.error || data?.message || `Erro HTTP ${res.status}`;
    const error = new Error(errorMessage);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function apiPost(path, body) {
  const url = `${API_URL}${path}`;
  const token = await getToken();

  const isFormData = body instanceof FormData;
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: isFormData ? body : JSON.stringify(body),
  });

  return handleResponse(res);
}

export async function apiGet(path, params = {}, token = null) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) => value != null && value !== "",
    ),
  );

  const query = new URLSearchParams(cleanParams).toString();
  const url = `${API_URL}${path}${query ? `?${query}` : ""}`;

  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { method: "GET", headers });
  return handleResponse(res);
}
