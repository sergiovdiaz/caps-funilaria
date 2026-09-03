import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles/DateField.css";
import { ptBR } from "date-fns/locale";

registerLocale("pt-BR", ptBR);

export default function DateField({ label, value, onChange, className = "" }) {
  return (
    <div className={`datefield ${className}`}>
      <label className="datefield__label">{label}</label>

      <div className="datefield__wrapper">
        <DatePicker
          selected={value}
          onChange={onChange}
          className="datefield__input"
          dateFormat="dd/MM/yyyy"
          locale="pt-BR"
          popperPlacement="bottom-start"
          popperClassName="datefield__popper"
          todayButton="Hoje"
        />
      </div>
    </div>
  );
}
