import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./styles/SideBarMenu.css";
import andonIcon from "../assets/images/sidebar-icons/icon_andon.png";
import lancamentoIcon from "../assets/images/sidebar-icons/icon_lancamento.png";
import relatorioIcon from "../assets/images/sidebar-icons/icon_relatorio.png";
import tempoCicloIcon from "../assets/images/sidebar-icons/icon_tempociclo.png";
// import startstopIcon1 from "../assets/images/sidebar-icons/icon_startstop1.png";
// import savisionIcon from "../assets/images/sidebar-icons/icon_savision.png";
import andonIcon2 from "../assets/images/sidebar-icons/icon_andon2.png";
import pcmIcon from "../assets/images/sidebar-icons/icon_pcm.png";
import weldIcon from "../assets/images/sidebar-icons/icon_weld.png";

const SidebarMenu = ({ menuAberto, fecharMenu }) => {
  const sidebarRef = useRef(null);
  const location = useLocation();
  const [capAberto, setCapAberto] = useState(false);
  const [submenuAberto, setSubmenuAberto] = useState(null);

  // Fecha o menu ao pressionar Esc ou clicar fora
  useEffect(() => {
    const handleInteraction = (e) => {
      if (e.key === "Escape") fecharMenu();
      if (sidebarRef.current && !sidebarRef.current.contains(e.target))
        fecharMenu();
    };

    if (menuAberto) {
      document.addEventListener("keydown", handleInteraction);
      document.addEventListener("mousedown", handleInteraction);
    }

    return () => {
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("mousedown", handleInteraction);
    };
  }, [menuAberto, fecharMenu]);

  useEffect(() => {
    const currentSubmenu = menuItems.find(
      (item) =>
        item.type === "submenu" &&
        item.submenuItems.some((sub) =>
          location.pathname.startsWith(sub.to.split("/")[1]),
        ),
    );

    if (currentSubmenu) {
      setSubmenuAberto(currentSubmenu.id);
    }
  }, [location.pathname]);

  const toggleSubmenu = (id) => {
    setSubmenuAberto((prev) => (prev === id ? null : id));
  };

  const menuItems = [
    {
      to: "/",
      text: "Trend Produtivo",
      icon: andonIcon,
      alt: "Ícone Andon",
    },
    {
      type: "submenu",
      id: "cap",
      text: "CAP",
      icon: lancamentoIcon,
      submenuItems: [
        { to: "/cap/justificar/SCC", text: "Justificar" },
        { to: "/cap/pendencias", text: "Pendências" },
        { to: "/cap/historico", text: "Histórico" },
      ],
    },
    {
      type: "submenu",
      id: "bordero",
      text: "Borderô",
      icon: andonIcon,
      submenuItems: [
        { to: "/bordero/scc", text: "Individual" },
        { to: "/dashboardgeral", text: "Geral" },
      ],
    },

    // {
    //   to: "/bordero/scc",
    //   text: "Borderô de Linha",
    //   icon: andonIcon,
    //   alt: "Ícone Borderô",
    // },

    {
      type: "submenu",
      id: "tempociclo",
      text: "Tempo Ciclo",
      icon: tempoCicloIcon,
      submenuItems: [
        { to: "/tempociclo/live", text: "Live" },
        { to: "/tempociclo/relatorio", text: "Relatório 24 horas" },
        { to: "/tempociclo/dashboard", text: "Dashboard" },
      ],
    },
    // {
    //   to: "/tempociclo",
    //   text: "Tempo de Ciclo",
    //   icon: tempoCicloIcon,
    //   alt: "Ícone Tempo de Ciclo",
    // },

    // {
    //   to: "/savision",
    //   text: "SAVision",
    //   icon: savisionIcon,
    //   alt: "Ícone SAVision",
    // },
    // {
    //   to: "/relatorioprodutivo",
    //   text: "Relatório Produtivo",
    //   icon: relatorioIcon,
    //   alt: "Ícone Relatório Produtivo",
    // },
    {
      to: "/monitoramentodefalhas",
      text: "Falhas",
      icon: andonIcon,
      alt: "Ícone Falhas",
    },
    {
      to: "/sinoptico",
      text: "Andon",
      icon: andonIcon2,
      alt: "Ícone Andon",
    },
    {
      type: "submenu",
      id: "pcm",
      text: "PCM",
      icon: pcmIcon,
      submenuItems: [{ to: "/pcm/programacao", text: "Programação" }],
    },
    {
      type: "submenu",
      id: "weld",
      text: "Welding",
      icon: weldIcon,
      submenuItems: [
        {
          to: "/welding/monitoramento/medicao-corrente",
          text: "Medição de Corrente",
        },
      ],
    },
    {
      type: "submenu",
      id: "defeitos",
      text: "Defeitos",
      icon: andonIcon2,
      submenuItems: [
        { to: "/defeitos/lancamento", text: "Lançamento" },
  
      ],
    },
  ];

  return (
    <>
      <div
        className={`sidebar-overlay ${menuAberto ? "visible" : ""}`}
        onClick={fecharMenu}
        aria-hidden="true"
      />

      <nav
        ref={sidebarRef}
        className={`sidebar ${menuAberto ? "open" : ""}`}
        aria-label="Menu principal"
      >
        <button
          className="sidebar__close-btn"
          onClick={fecharMenu}
          aria-label="Fechar menu"
          type="button"
        >
          &times;
        </button>

        <ul className="sidebar__menu" role="menu">
          {menuItems.map((item, index) => {
            if (item.type === "submenu") {
              const isAnySubmenuActive = item.submenuItems.some(
                (subItem) => location.pathname === subItem.to,
              );

              return (
                <li key={`submenu-${index}`} role="none">
                  <button
                    className={`sidebar__link sidebar__submenu-trigger ${isAnySubmenuActive ? "sidebar__link--active" : ""}`}
                    onClick={() => toggleSubmenu(item.id)}
                    role="menuitem"
                    aria-expanded={submenuAberto === item.id}
                  >
                    <span className="sidebar__icon">
                      <img
                        src={item.icon}
                        alt=""
                        className="sidebar__icon-img"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="sidebar__label">{item.text}</span>
                    <span
                      className={`sidebar__arrow ${
                        submenuAberto === item.id ? "sidebar__arrow--open" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  <ul
                    className={`sidebar__submenu ${
                      submenuAberto === item.id ? "sidebar__submenu--open" : ""
                    }`}
                  >
                    {item.submenuItems.map((subItem) => {
                      const isActive = location.pathname === subItem.to;
                      return (
                        <li key={subItem.to} role="none">
                          <NavLink
                            to={subItem.to}
                            className={`sidebar__link sidebar__sublink ${isActive ? "sidebar__link--active" : ""}`}
                            onClick={fecharMenu}
                            role="menuitem"
                            aria-current={isActive ? "page" : undefined}
                          >
                            <span className="sidebar__label">
                              {subItem.text}
                            </span>
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            }

            const isActive = location.pathname === item.to;

            return (
              <li key={item.to} role="none">
                <NavLink
                  to={item.to}
                  className={`sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
                  onClick={fecharMenu}
                  role="menuitem"
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="sidebar__icon">
                    <img
                      src={item.icon}
                      alt=""
                      className="sidebar__icon-img"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="sidebar__label">{item.text}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        <footer className="sidebar__footer">
          <p className="sidebar__footer-text">Borderô BiW</p>
        </footer>
      </nav>
    </>
  );
};

export default SidebarMenu;
