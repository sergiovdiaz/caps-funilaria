import React from "react";
import { useState, useEffect } from "react";
import JSZip from "jszip";
import FileSaver from "file-saver";
import * as XLSX from "xlsx";
import SavisionModalImage from "./SavisionModalImage";
// import rawImage from "../../assets/savision/dataset/raw/image.png";
// import predictImage from "../../assets/savision/dataset/predict/image.png";
import exportIcon from "../../assets/savision/export-icon.png";
import "./styles/SavisionCase.css";
import {
  listenSavision,
  listenSavisionLastRows,
  listenSavisionOverview,
  unlistenSavision,
  baseUrl,
} from "../../../api/api";
import SavisionOverview from "./SavisionOverview";

const SavisionCase = ({ title = "Puntone", onClick }) => {
  // Mock data

  const usecase = "puntone";

  const [data, setData] = useState({
    rawImage: null,
    predictImage: null,
    CIS: null,
    Label: null,
    timestamp: null,
    info: { total: 0, ok: 0, ko: 0 },
  });

  const [filters, setFilters] = React.useState({
    dia_produtivo: "",
    turno: "",
    cis: "",
    status: "",
  });

  const [tableData, settableData] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);
  const [selectedCis, setSelectedCis] = useState(null);
  const [overviewData, setOverviewData] = useState({});

  const filteredData = tableData.filter((item) => {
    const dia = item.dia_produtivo?.toLowerCase() || "";
    const turno = item.turno?.toString() || "";
    const cis = item.cis?.toLowerCase() || "";
    const status = item.status?.toLowerCase() || "";

    const filtroDia = filters.dia_produtivo?.toLowerCase() || "";
    const filtroTurno = filters.turno?.toString() || "";
    const filtroCis = filters.cis?.toLowerCase() || "";
    const filtroStatus = filters.status?.toLowerCase() || "";

    return (
      dia.includes(filtroDia) &&
      turno.includes(filtroTurno) &&
      cis.includes(filtroCis) &&
      status.includes(filtroStatus)
    );
  });

  useEffect(() => {
    const handleNewData = (newData) => {
      setData({
        rawImage: newData.rawImage,
        predictImage: newData.predictImage,
        CIS: newData.CIS,
        Label: newData.Label,
        timestamp: newData.timestamp,
        info: newData.info,
      });
    };

    listenSavision(usecase, handleNewData);
    console.log("data é: ", data);

    return () => {
      unlistenSavision(usecase);
    };
  }, [usecase]);

  useEffect(() => {
    listenSavisionLastRows(usecase, (data) => {
      settableData(data);
    });
  }, [usecase]);

  useEffect(() => {
    listenSavisionOverview(usecase, (data) => {
      setOverviewData(data);
    });
  }, [usecase]);

  const handleRowClick = (item) => {
    if (selectedRowId === item.id) {
      setSelectedRowId(null);
      setSelectedImage(null);
      setSelectedTimestamp(null);
      setSelectedCis(null);
    } else {
      setSelectedRowId(item.id);
      setSelectedImage(`${baseUrl}/${item.image}`);
      setSelectedTimestamp(item.timestamp);
      setSelectedCis(item.cis);
    }
  };

  const handleExportZip = async () => {
    // Criar um novo ZIP
    const zip = new JSZip();

    // Criar pasta para as imagens
    const imgFolder = zip.folder("imagens");

    // Processar cada item da tabela
    const exportData = await Promise.all(
      filteredData.map(async (item) => {
        // Adicionar imagem ao ZIP (se existir)
        if (item.image) {
          // Pegar a URL completa da imagem
          const imageUrl = `${baseUrl}/${item.image}`;

          // Baixar a imagem como Blob
          const response = await fetch(imageUrl);
          const imageBlob = await response.blob();

          // Adicionar imagem com nome baseado no CIS
          const fileName = `${item.cis}.jpg`;
          imgFolder.file(fileName, imageBlob);
        }

        // Retornar dados para Excel (sem a imagem)
        return {
          Timestamp: item.timestamp,
          CIS: item.cis,
          Status: item.status,
        };
      })
    );

    // Criar planilha Excel
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");

    // Gerar Excel como buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Adicionar Excel ao ZIP
    zip.file("dados_tabela.xlsx", excelBuffer);

    // Gerar ZIP
    const zipContent = await zip.generateAsync({ type: "blob" });

    alert("Arquivos exportados com sucesso!");
    // Fazer download do ZIP
    FileSaver.saveAs(zipContent, "dados_savision.zip");
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value.toUpperCase(),
    }));
  };

  return (
    <div className="savisioncase">
      <div className="savisioncase__header" onClick={onClick}>
        <h3 className="savisioncase__title">{title}</h3>
        <span className="savisioncase__total">
          Nº de carros avaliados hoje: <span>{data.info.total}</span>
        </span>

        {data.info?.total > 0 && (
          <div className="savisioncase__progress">
            <div
              className="savisioncase__progress-ok"
              style={{ width: `${data.info.okPercentage}%` }}
              title={`${data.info.ok} OK`}
            >
              <span className="savisioncase__progress-text">
                {data.info.ok} OK
              </span>
            </div>
            <div
              className="savisioncase__progress-ko"
              style={{ width: `${data.info.koPercentage}%` }}
              title={`${data.info.ko} KO`}
            >
              <span className="savisioncase__progress-text">
                {data.info.ko} KO
              </span>
            </div>
          </div>
        )}
      </div>

      {/* wrapper lado a lado */}
      <div className="savisioncase__body">
        <div className="savisioncase__content">
          <div className="savisioncase__subtitle">
            ÚLTIMO REGISTRO: {data.timestamp}
          </div>

          <div className="savisioncase__photos">
            <div className="savisioncase__photo-container">
              <h4 className="savisioncase__photo-title">CIS {data.CIS}</h4>
              <img
                src={`${data.rawImage}?t=${data.timestamp}`}
                alt="Imagem original"
                className="savisioncase__photo"
              />
            </div>
            <div className="savisioncase__photo-container">
              <h4 className="savisioncase__photo-title">Análise Savision</h4>
              <img
                src={`${data.predictImage}?t=${data.timestamp}`}
                style={{ filter: "brightness(1.2)" }}
                alt="Resultado da análise Savision"
                className="savisioncase__photo"
              />
            </div>
          </div>
        </div>

        <div className="savisioncase__content-table">
          <div className="savisioncase__subtitle">HISTÓRICO</div>
          <div className="savisioncase__content-container">
            {/* Tabela */}
            <div className="savisioncase__table-container">
              <button
                className="savisioncase__export-btn"
                onClick={handleExportZip}
                disabled={tableData.length === 0}
                title="Exportar tabela e imagens"
              >
                <img
                  src={exportIcon}
                  alt="Ícone de exportação"
                  className="savisioncase__export-icon"
                />
              </button>

              <div className="savisioncase__table-wrapper">
                <table className="savisioncase__table">
                  <thead>
                    <tr>
                      <th>
                        Data
                        <br />
                        <input
                          type="text"
                          name="dia_produtivo"
                          value={filters.dia_produtivo}
                          onChange={handleFilterChange}
                          placeholder="Filtrar Data"
                          style={{ width: "90%" }}
                        />
                      </th>
                      <th>
                        Turno
                        <br />
                        <input
                          type="text"
                          name="turno"
                          value={filters.turno}
                          onChange={handleFilterChange}
                          placeholder="Filtrar Turno"
                          style={{ width: "90%" }}
                        />
                      </th>
                      <th>Timestamp</th>
                      <th>
                        CIS
                        <br />
                        <input
                          type="text"
                          name="cis"
                          value={filters.cis}
                          onChange={handleFilterChange}
                          placeholder="Filtrar CIS"
                          style={{ width: "90%" }}
                        />
                      </th>
                      <th>
                        Status
                        <br />
                        <input
                          type="text"
                          name="status"
                          value={filters.status}
                          onChange={handleFilterChange}
                          placeholder="Filtrar Status"
                          style={{ width: "90%" }}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => handleRowClick(item)}
                        style={{ cursor: "pointer" }}
                        className={
                          selectedRowId === item.id ? "selected-row" : ""
                        }
                      >
                        <td>{item.dia_produtivo}</td>
                        <td>{item.turno}</td>
                        <td>{item.timestamp}</td>
                        <td>{item.cis}</td>
                        <td
                          className={`savisioncase__status--${item.status.toLowerCase()}`}
                        >
                          {item.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Imagem selecionada */}
            {selectedImage && (
              <div className="savisioncase__selected-image">
                <SavisionModalImage
                  image={selectedImage}
                  timestamp={selectedTimestamp}
                  cis={selectedCis}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <SavisionOverview data={overviewData} />
    </div>
  );
};

export default SavisionCase;
