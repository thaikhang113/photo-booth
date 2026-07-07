import { Cherry, Flower2, Landmark } from "lucide-react";

const FALLBACK = [
  { type: "dong_ho", name: "Tranh Đông Hồ" },
  { type: "landmark", name: "Địa Danh Việt Nam", opts: ["hoi_an", "hue", "ho_guom", "ha_long"] },
  { type: "tet", name: "Tết Việt Nam", tetLocations: ["home", "street", "flower_market"] },
];

const DESC = {
  dong_ho: "Giấy điệp, nét khắc gỗ",
  landmark: "Ghép nền địa danh",
  tet: "Khung đỏ hoa Tết",
};

const ICON = { dong_ho: Flower2, landmark: Landmark, tet: Cherry };

const LBL = {
  landmark: { hoi_an: "Hội An", hue: "Huế", ho_guom: "Hồ Gươm", ha_long: "Hạ Long" },
  tetLocation: { home: "Nhà", street: "Phố Tết", flower_market: "Chợ hoa" },
};

export default function FilterPanel({ filters, selected, filterOptions, onSelect, onFilterOptions }) {
  const list = (filters.length ? filters : FALLBACK).map((f) => ({
    ...FALLBACK.find((x) => x.type === f.type),
    ...f,
  }));
  const opts = filterOptions || {};
  const cur = list.find((f) => f.type === selected);

  return (
    <aside className="filter-panel">
      <div className="panel-heading compact">
        <div>
          <p className="panel-kicker">Filter set</p>
          <h2>Bộ lọc văn hóa</h2>
        </div>
      </div>
      <div className="filter-list">
        {list.map((f) => {
          const Ic = ICON[f.type] || Flower2;
          return (
            <button key={f.type} className={selected === f.type ? "filter-card active" : "filter-card"} type="button" onClick={() => onSelect(f.type)}>
              <span className="filter-icon" aria-hidden="true"><Ic size={20} /></span>
              <span className="filter-copy"><span>{f.name}</span><small>{DESC[f.type]}</small></span>
            </button>
          );
        })}
      </div>
      {selected === "landmark" && (
        <div className="filter-options">
          <label>Địa danh:</label>
          <div className="option-row">
            {FALLBACK.find((f) => f.type === "landmark").opts.map((o) => (
              <button key={o} className={opts.landmark === o ? "opt-btn active" : "opt-btn"} onClick={() => onFilterOptions?.({ ...opts, landmark: o })}>
                {LBL.landmark[o] || o}
              </button>
            ))}
          </div>
        </div>
      )}
      {selected === "tet" && (
        <div className="filter-options">
          <label>Đón Tết:</label>
          <div className="option-row">
            {(cur?.tetLocations || []).map((o) => (
              <button key={o} className={(opts.tetLocation || cur.tetLocations[0]) === o ? "opt-btn active" : "opt-btn"} onClick={() => onFilterOptions?.({ ...opts, tetLocation: o })}>
                {LBL.tetLocation[o] || o}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
