import "./styles/BiWLayout.css";

function lightenColor(hex, amount = 60) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function BiWLayout({ areas, visuals, onAreaClick }) {
  return (
    <div className="biwlayout">
      {areas.map((area) => {
        const visual = visuals?.[area.id];
        const rawColor = visual?.color || "#b1b0b0";
        const lightColor = lightenColor(rawColor, 10);

        return (
          <div
            key={area.id}
            className={`biwlayout__block biwlayout__${area.style}`}
            style={{ backgroundColor: lightColor }}
            onClick={() => onAreaClick?.(area)}
          >
            <span className="biwlayout__label">{area.name}</span>

            {visual?.label && (
              <div className="block-tooltip">{visual.label}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
