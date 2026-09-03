import "./styles/SavisionModalImage.css";
const SavisionModalImage = ({ image, timestamp, cis }) => {
  if (!image) return null; // Não renderiza nada se não houver imagem

  return (
    <div
      className="savisionmodalimage__selected-image"
      style={{ marginTop: "20px", textAlign: "center" }}
    >
      <div className="savisionmodalimage__selected-info">
        <div>
          <strong>Timestamp:</strong> {timestamp}
        </div>
        <div>
          <strong>CIS:</strong> {cis}
        </div>
      </div>
      <img
        src={image}
        alt="Imagem selecionada"
        style={{
          maxWidth: "400px",
          width: "100%",
          height: "435px",
          // height: "auto",
          borderRadius: "8px",
          filter: "brightness(1.2)",
        }}
      />
    </div>
  );
};

export default SavisionModalImage;
