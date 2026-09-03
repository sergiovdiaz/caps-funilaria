// SelectField.js
import React from "react";
import Select from "react-select";
import "./styles/SelectField.css";

const SelectField = ({
  label,
  options,
  value,
  onChange,
  isMulti = false,
  isClearable = true,
  placeholder = "Selecione...",
  className = "",
  required = false,
  disabled = false,
  loading = false,
  noOptionsMessage = "Nenhuma opção encontrada",
}) => {
  return (
    <div className={`selectfield ${className}`}>
      {label && (
        <label className="selectfield__label">
          {label}
          {required && <span className="selectfield__required">*</span>}
        </label>
      )}

      <Select
        options={options}
        value={value}
        onChange={onChange}
        isMulti={isMulti}
        isClearable={isClearable}
        placeholder={placeholder}
        isDisabled={disabled}
        isLoading={loading}
        noOptionsMessage={() => noOptionsMessage}
        className="selectfield__container"
        classNamePrefix="selectfield"
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: "32px",
            borderColor: state.isFocused
              ? "var(--blue-standard, #243782)"
              : "var(--border-color, #e2e8f0)",
            borderWidth: "1.5px",
            borderRadius: "var(--radius-sm, 4px)",
            backgroundColor: disabled ? "var(--bg-disabled, #f1f5f9)" : "white",
            boxShadow: state.isFocused
              ? "0 0 0 3px rgba(36, 55, 130, 0.1)"
              : "none",
            "&:hover": {
              borderColor: state.isFocused
                ? "var(--blue-standard, #243782)"
                : "var(--blue-standard-light, #3a52a8)",
            },
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: "var(--blue-standard, #243782)",
            borderRadius: "4px",
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: "white",
            fontSize: "var(--font-xs, 0.75rem)",
            padding: "2px 6px",
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: "white",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "var(--blue-standard-dark, #1a2961)",
              color: "white",
            },
          }),
          option: (base, { isFocused, isSelected }) => ({
            ...base,
            fontSize: "var(--font-xs, 0.75rem)",
            fontFamily: "var(--font-family)",
            backgroundColor: isSelected
              ? "var(--blue-standard, #243782)"
              : isFocused
                ? "rgba(36, 55, 130, 0.1)"
                : "white",
            color: isSelected ? "white" : "var(--text-primary, #1e293b)",
            cursor: "pointer",
            "&:active": {
              backgroundColor: "var(--blue-standard, #243782)",
              color: "white",
            },
          }),
          menu: (base) => ({
            ...base,
            borderRadius: "var(--radius-sm, 4px)",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            border: "1px solid var(--border-color, #e2e8f0)",
            zIndex: 1000,
          }),
          menuList: (base) => ({
            ...base,
            padding: 0,
          }),
          placeholder: (base) => ({
            ...base,
            fontSize: "var(--font-xs, 0.75rem)",
            color: "var(--text-tertiary, #94a3b8)",
          }),
          input: (base) => ({
            ...base,
            fontSize: "var(--font-xs, 0.75rem)",
            fontFamily: "var(--font-family)",
            margin: 0,
            padding: 0,
          }),
          singleValue: (base) => ({
            ...base,
            fontSize: "var(--font-xs, 0.75rem)",
            color: "var(--text-primary, #1e293b)",
          }),
          indicatorSeparator: (base) => ({
            ...base,
            backgroundColor: "var(--border-color, #e2e8f0)",
          }),
          dropdownIndicator: (base) => ({
            ...base,
            color: "var(--text-secondary, #64748b)",
            padding: "4px",
            "&:hover": {
              color: "var(--blue-standard, #243782)",
            },
          }),
          clearIndicator: (base) => ({
            ...base,
            color: "var(--text-secondary, #64748b)",
            padding: "4px",
            "&:hover": {
              color: "var(--error-color, #dc2626)",
            },
          }),
        }}
      />
    </div>
  );
};

export default SelectField;
