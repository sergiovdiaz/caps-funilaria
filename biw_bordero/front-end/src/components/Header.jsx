import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logoStellantis from "../assets/images/stellantis-icon2.png";
import menuIconLight from "../assets/images/menu-icon-light.svg";
import menuIconDark from "../assets/images/menu-icon-dark.png";
import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./styles/Header.css";

const Header = ({ setMenuAberto, setShowLoginModal }) => {
  const location = useLocation();
  const { user, logout } = useAuth(); // consumo direto do AuthContext
  const navigate = useNavigate();

  const alternarMenu = () => {
    setMenuAberto((prev) => !prev);
  };

  const pageTitles = {
    "/andon": "ANDON",
    "/relatoriodeperdas": "RELATÓRIO DE PERDAS",
    "/tempociclo/aovivo": "TEMPO DE CICLO - LIVE",
    "/tempociclo/relatorio": "TEMPO DE CICLO - RELATÓRIO 24 HORAS",
    "/startstop": "START STOP - AR COMPRIMIDO",
    "/startstoptrend": "START STOP - HISTÓRICO",
    "/startstopsupervisorio": "START STOP - SUPERVISÓRIO",
    "/savision": "SAVision",
    "/relatorioprodutivo": "RELATÓRIO PRODUTIVO",
    "/cap": "CAP - CONTROLE DO AVANÇAMENTO PRODUTIVO",
    "/defeitos": "Defeitos",
    "/": "TREND PRODUTIVO",
    "/sinoptico": "Sinóptico",
    "/machineledger": "Machine Ledger",
    "/dashboardgeral": "BORDERÔ - DASHBOARD GERAL",
    "/welding/monitoramento/medicao-corrente": "Medição de Corrente - Pinças",
    "/lda": "LDA ·  GESTÃO E CONTROLE DE CARROCERIAIS FORA DE FLUXO",
  };

  const isDark = ["/savision", "/savision/puntone"].includes(location.pathname);
  let currentTitle = pageTitles[location.pathname] || "ANDON";

  if (location.pathname.includes("/cap")) {
    currentTitle = "CAP - CONTROLE DO AVANÇAMENTO PRODUTIVO";
  } else {
    currentTitle = pageTitles[location.pathname] || "ANDON";
  }

  if (location.pathname.includes("bordero")) {
    currentTitle = "BORDERO";
  }

  if (location.pathname.includes("monitoramentodefalhas")) {
    currentTitle = "MONITORAMENTO DE FALHAS";
  }

  if (location.pathname.includes("tempociclo/historico")) {
    currentTitle = "TEMPO DE CICLO - HISTÓRICO";
  }

  if (location.pathname.includes("programacao")) {
    currentTitle = "PLANEJAMENTO E CONTROLE DE MANUTENÇÃO";
  }

  if (location.pathname.includes("defeitos")) {
    currentTitle = "LANÇAMENTO DE DEFEITOS - FUNILARIA";
  }

  return (
    <div className={`header ${isDark ? "header--dark" : "header--light"}`}>
      <div className="header__left">
        <button
          className="header__menu-icon"
          onClick={alternarMenu}
          aria-label="Abrir menu"
        >
          <img
            className="header__menu-icon-img"
            src={isDark ? menuIconDark : menuIconLight}
            alt=""
            role="presentation"
          />
        </button>

        <h1 className="header__title">{currentTitle}</h1>
      </div>

      {/* Parte direita: usuário + ícone Stellantis */}
      <div className="header__right">
        <div className="header__user">
          {user ? (
            <>
              <div className="header__user-info">
                <span className="user-name">
                  {" "}
                  {user?.nome?.split(" ").slice(0, 2).join(" ")}
                </span>
                <span className="user-area">{user.area}</span>
              </div>

              <button className="logout" onClick={logout}>
                Sair
              </button>
            </>
          ) : (
            <button className="login" onClick={() => setShowLoginModal(true)}>
              Login
            </button>
          )}
        </div>

        {user?.role === "admin" && (
          <button
            className="header__settings-btn"
            onClick={() => navigate("/admin")}
            title="Configurações"
          >
            <Settings size={22} />
          </button>
        )}

        <img
          className="header__stellantis-icon"
          src={logoStellantis}
          alt="Logo Stellantis"
        />
      </div>
    </div>
  );
};

export default Header;
