import React from "react";

const EventsTable = ({ events }) => {
  return (
    <div className="card">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Turno</th>
              <th>Estação</th>
              <th>Máquina</th>
              <th>Alarme</th>
              <th>Status</th>
              <th>Cluster</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty">
                  Nenhum alarme encontrado
                </td>
              </tr>
            ) : (
              events.map((a) => (
                <tr key={a.id}>
                  <td>{a.hour}</td>
                  <td>Turno {a.turno}</td>
                  <td>{a.station}</td>
                  <td>{a.element}</td>
                  <td>{a.alarm}</td>
                  <td>
                    <span className={`status ${a.status.toLowerCase()}`}>
                      {a.status}
                    </span>
                  </td>
                  <td>{a.tipo_maquina}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventsTable;
