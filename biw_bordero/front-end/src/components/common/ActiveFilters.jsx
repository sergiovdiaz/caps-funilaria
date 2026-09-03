// ActiveFilters.js
import React from "react";

const ActiveFilters = ({
  filters,
  onRemoveFilter,
  onClearAll,
  getFilterLabel,
  excludedKeys = ["startDate", "endDate"], // Chaves que não devem aparecer
  showClearAll = true,
  className = "",
}) => {
  // Filtra os filtros ativos (excluindo chaves e valores vazios)
  const activeFilters = Object.entries(filters).filter(
    ([key, value]) =>
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !excludedKeys.includes(key),
  );

  const hasFilters = activeFilters.length > 0;

  if (!hasFilters && !showClearAll) {
    return null;
  }

  return (
    <div className={`active-filters ${className}`}>
      {activeFilters.map(([key, value]) => (
        <div key={key} className="filter-chip">
          <span className="chip-key">
            {getFilterLabel ? getFilterLabel(key) : key}
          </span>
          <span className="chip-sep">·</span>
          <span className="chip-val">{value}</span>
          <button onClick={() => onRemoveFilter(key)}>×</button>
        </div>
      ))}

      {hasFilters && showClearAll && (
        <button className="clear-all-btn" onClick={onClearAll}>
          Limpar todos
        </button>
      )}
    </div>
  );
};

export default ActiveFilters;
