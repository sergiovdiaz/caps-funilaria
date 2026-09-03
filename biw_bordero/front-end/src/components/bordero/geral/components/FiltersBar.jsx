// components/DashboardFilters.jsx
import React from "react";
import DateField from "../../../common/DateField";
import Button from "../../../common/Button";
import SelectField from "../../../common/SelectField";
import { UTE_OPTIONS, LINE_TYPE_OPTIONS } from "../utils/constants.js";

export const FiltersBar = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  filters,
  onUteChange,
  onLineTypeChange,
  onBuscarData,
  linhaInput,
  onLinhaInputChange,
  onBuscarLinha,
  onKeyDown,
  loading,
}) => {
  return (
    <div className="dg__filters">
      <div className="dg__date-fields">
        <DateField
          label="Data Inicial"
          value={startDate}
          onChange={onStartDateChange}
        />
        <DateField
          label="Data Final"
          value={endDate}
          onChange={onEndDateChange}
        />
      </div>

      <SelectField
        label="UTE"
        options={UTE_OPTIONS}
        value={UTE_OPTIONS.filter((opt) => filters.ute?.includes(opt.value))}
        onChange={(selected) =>
          onUteChange(selected ? selected.map((s) => s.value) : [])
        }
        isMulti
        isClearable
        placeholder="Selecionar UTE..."
      />

      <SelectField
        label="Tipo de Linha"
        options={LINE_TYPE_OPTIONS}
        value={
          LINE_TYPE_OPTIONS.find((opt) => opt.value === filters.line_type) ||
          null
        }
        onChange={(selected) =>
          onLineTypeChange(selected ? selected.value : null)
        }
        isClearable
        placeholder="Tipo de Linha..."
      />

      <Button onClick={onBuscarData} loading={loading}>
        Buscar
      </Button>

      <div className="search-box">
        <input
          type="text"
          placeholder="Digite a linha..."
          value={linhaInput}
          onChange={onLinhaInputChange}
          onKeyDown={onKeyDown}
        />
        <button onClick={onBuscarLinha}>Buscar</button>
      </div>
    </div>
  );
};
