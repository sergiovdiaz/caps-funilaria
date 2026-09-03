// components/SavisionBackground.jsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./styles/SavisionBackground.css";

export default function SavisionBackground() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Mostra o background APENAS nas rotas específicas do savision
    const isSavisionRoute =
      location.pathname === "/savision" ||
      location.pathname.startsWith("/savision/");

    setIsVisible(isSavisionRoute);
  }, [location.pathname]);

  if (!isVisible) return null;

  return (
    <div className="savision-background">
      <div className="savision-bg-animation" />
    </div>
  );
}
