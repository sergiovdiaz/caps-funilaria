import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "./styles/LoginModal.css";

const areas = [
  "PRODUÇÃO",
  "MANUTENÇÃO",
  "PROCESSO/QUALIDADE",
  "LOGÍSTICA",
  "VPE",
  "PINTURA/PRENSAS",
];

const LoginModal = ({ show = true, onClose = () => {} }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Login
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");

  // Cadastro
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [area, setArea] = useState(areas[0]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setMatricula("");
    setSenha("");
    setNome("");
    setSobrenome("");
    setArea(areas[0]);
    setError("");
    setSuccess("");
  };

  const handleLogin = async () => {
    if (!matricula || !senha) {
      setError("Preencha matrícula e senha");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(matricula, senha);
      setSuccess("Login realizado com sucesso!");
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!matricula || !nome || !sobrenome || !area) {
      setError("Preencha todos os campos");
      return;
    }

    if (!/^\d+$/.test(matricula)) {
      setError("A matrícula deve conter apenas números");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register({ matricula, nome, sobrenome, area });

      setSuccess(
        "Cadastro realizado com sucesso! A senha inicial é sua matrícula."
      );

      setTimeout(() => {
        setIsRegister(false);
        resetForm();
      }, 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      isRegister ? handleRegister() : handleLogin();
    }
  };

  const toggleMode = () => {
    resetForm();
    setIsRegister((prev) => !prev);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* HEADER */}
        <div className="modal-header">
          <div className="header-icon">{isRegister ? "👤" : "🔐"}</div>

          <h2 className="modal-title">
            {isRegister ? "Criar Conta" : "Bem-vindo"}
          </h2>

          <p className="modal-subtitle">
            {isRegister
              ? "Preencha os dados para criar sua conta"
              : "Entre com suas credenciais"}
          </p>

          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="form">
            {isRegister ? (
              <>
                <div className="form-row">
                  <input
                    className="form-input"
                    placeholder="Nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={loading}
                  />
                  <input
                    className="form-input"
                    placeholder="Sobrenome"
                    value={sobrenome}
                    onChange={(e) => setSobrenome(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <input
                  className="form-input"
                  placeholder="Matrícula"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  disabled={loading}
                />

                <select
                  className="form-select"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  disabled={loading}
                >
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <input
                  className="form-input"
                  placeholder="Matrícula"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={loading}
                />
              </>
            )}

            <button
              className="submit-button"
              onClick={isRegister ? handleRegister : handleLogin}
              disabled={loading}
            >
              {loading ? "Processando..." : isRegister ? "Cadastrar" : "Entrar"}
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <span className="footer-text">
            {isRegister ? "Já tem conta?" : "Não tem conta?"}
          </span>
          <button className="toggle-button" onClick={toggleMode}>
            {isRegister ? "Entrar" : "Cadastrar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
