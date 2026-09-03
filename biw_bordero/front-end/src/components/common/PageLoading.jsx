import React from "react";

const PageLoading = ({ text = "Carregando…" }) => {
  return (
    <div className="page-loading">
      <div className="loader" />
      <span>{text}</span>
    </div>
  );
};

export default PageLoading;
