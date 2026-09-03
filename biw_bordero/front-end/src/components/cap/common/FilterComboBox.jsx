import { useState, useRef, useMemo, useEffect } from "react";
import "../styles/FilterComboBox.css";

export const FilterComboBox = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione ou digite...",
  hasError = false,
  showLabel = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const optionsRef = useRef([]);
  const inputRef = useRef(null); // Adicione esta ref

  const filteredOptions = useMemo(() => {
    if (!options?.length) return [];
    if (!searchTerm) return options;
    return options.filter(
      (opt) =>
        typeof opt === "string" &&
        opt.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm]);

  useEffect(() => {
    setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
  }, [filteredOptions]);

  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex].scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // REMOVA o useEffect que fecha ao clicar fora e use onBlur no input

  const handleSelect = (option) => {
    onChange(option);
    setSearchTerm("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur(); // Foca fora para fechar
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((p) =>
          p < filteredOptions.length - 1 ? p + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((p) =>
          p > 0 ? p - 1 : filteredOptions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0)
          handleSelect(filteredOptions[highlightedIndex]);
        break;
      case "Escape":
        setIsOpen(false);
        setSearchTerm("");
        inputRef.current?.blur();
        break;
    }
  };

  // Adicione onBlur para fechar quando sair do campo
  const handleBlur = (e) => {
    // Pequeno delay para permitir clique nas opções
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }, 25);
  };

  return (
    <div ref={containerRef} className="fcb" onBlur={handleBlur}>
      {showLabel && label && (
        <label htmlFor={id} className="fcb__label">
          {label}
        </label>
      )}
      <div className="fcb__control">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={`fcb__input${hasError ? " fcb__input--error" : ""}`}
          value={searchTerm || value}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            onChange(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />
        <span className="fcb__arrow" onClick={() => setIsOpen((p) => !p)}>
          {isOpen ? "▴" : "▾"}
        </span>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <ul className="fcb__options" role="listbox">
          {filteredOptions.map((opt, i) => (
            <li
              key={i}
              ref={(el) => (optionsRef.current[i] = el)}
              className={`fcb__option${i === highlightedIndex ? " fcb__option--active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault(); // Previne blur antes do clique
                handleSelect(opt);
              }}
              onMouseEnter={() => setHighlightedIndex(i)}
              role="option"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
