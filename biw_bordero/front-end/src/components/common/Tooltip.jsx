import "./styles/Tooltip.css";
import { useState } from "react";

const Tooltip = ({ text, children, disabled }) => {
  const [show, setShow] = useState(false);

  if (disabled) {
    return (
      <div
        style={{ position: "relative", display: "contents" }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
        {show && <div className="custom-tooltip">{text}</div>}
      </div>
    );
  }

  return children;
};

export default Tooltip;
