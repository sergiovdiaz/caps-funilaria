// DashboardHeader.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardHeader({ line = "SCE" }) {
  const [dateTime, setDateTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="dashboard__header">
      <div
        className="dashboard__header-left"
        onClick={() => navigate("/sinoptico")}
      >
        <svg
          className="header__back"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </div>

      <div className="dashboard__header-center">
        <h1 className="dashboard__header-title">{line}</h1>
      </div>

      <div className="dashboard__header-right">
        <div className="dashboard__header-time">
          {dateTime.toLocaleTimeString()}
        </div>
        <div className="dashboard__header-date">
          {dateTime
            .toLocaleDateString("pt-BR", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            .replace(".", "")
            .toUpperCase()}
        </div>
      </div>
    </header>
  );
}
