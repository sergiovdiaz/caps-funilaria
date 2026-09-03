export default function MainPerformanceCard({ data = {} }) {
  const payload = data || {};
  2;
  // console.log(window.innerWidth, window.innerHeight);

  const delta = payload.delta ?? 0;
  const eficiencia = payload.eficiencia ?? 0;

  const stats = [
    { label: "Impostado", value: payload.impostado ?? 0, type: "neutral" },
    { label: "Teórico", value: payload.teorico ?? 0, type: "neutral" },

    {
      label: "Realizado",
      value: payload.realizado ?? 0,
      type: eficiencia < 85 ? "danger" : "success",
      // highlight: true,
    },

    {
      label: "Delta",
      value: delta,
      type: eficiencia < 85 ? "danger" : "success",
      // highlight: true,
    },

    {
      label: "Eficiência",
      value: <>{eficiencia}%</>,
      type: eficiencia < 85 ? "danger" : "success",
    },

    { label: "JPH", value: payload.jph ?? 0, type: "neutral" },
    {
      label: "TC Médio",
      value: (
        <>
          {payload.tcStBottleneck && (
            <div className="stat__note">ESTAÇÃO: {payload.tcStBottleneck}</div>
          )}
          <div>{Number(payload.tc ?? 0).toFixed(1)}</div>

          <div className="stat__note">
            Meta: {Number(payload.tcTarget ?? 0).toFixed(0)}
          </div>
        </>
      ),
      type:
        payload.tcTarget > 0 && payload.tc > payload.tcTarget
          ? "danger"
          : "success",
    },
  ];

  return (
    <div className="cardandon card--performance">
      <div className="performance__header">
        <span className="performance__title">Performance do Turno</span>
      </div>

      <div className="stats__grid">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`stat__item 
              stat__item--${stat.type} 
              ${stat.highlight ? "stat__item--highlight" : ""}`}
          >
            <div className="stat__label">{stat.label}</div>
            <div className="stat__value">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
