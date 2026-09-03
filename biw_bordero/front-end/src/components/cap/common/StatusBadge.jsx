import { getStatusColor } from "../utils/capUtils";

const StatusBadge = ({ textstatus, status }) => {
  const color = getStatusColor(textstatus);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "20px",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.3px",
        whiteSpace: "normal",
        color: "#fff",
        backgroundColor: color, // ✅ aqui é o certo
        textAlign: "center",
      }}
    >
      {/* bolinha */}
      {/* <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: "currentColor",
          opacity: 0.7,
          flexShrink: 0,
          display: "inline-block",
        }}
      /> */}

      {status || "-"}
    </span>
  );
};

export default StatusBadge;
