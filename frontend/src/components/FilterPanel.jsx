import { Cherry, Clock3, Drama, Flower2, Landmark, Shirt } from 'lucide-react';

const FALLBACK_FILTERS = [
  { type: 'dong_ho', name: 'Tranh Đông Hồ' },
  { type: 'time_travel', name: 'Du Hành Thời Gian' },
  { type: 'landmark', name: 'Địa Danh Việt Nam' },
  { type: 'costume', name: 'Trang Phục Truyền Thống' },
  { type: 'tet', name: 'Tết Việt Nam' },
  { type: 'tuong', name: 'Nghệ Thuật Tuồng' },
];

const DESCRIPTIONS = {
  dong_ho: 'Màu phẳng, nét viền dân gian.',
  time_travel: 'Sepia, hạt phim, vignette cổ điển.',
  landmark: 'Ghép nền địa danh Việt Nam.',
  costume: 'Nón lá, khăn đóng demo.',
  tet: 'Khung đỏ vàng, hoa Tết.',
  tuong: 'Pattern mặt Tuồng sân khấu.',
};

const ICONS = {
  dong_ho: Flower2,
  time_travel: Clock3,
  landmark: Landmark,
  costume: Shirt,
  tet: Cherry,
  tuong: Drama,
};

export default function FilterPanel({ filters, selected, onSelect }) {
  const list = filters.length ? filters : FALLBACK_FILTERS;
  return (
    <aside className="filter-panel">
      <div className="panel-heading compact">
        <div>
          <p className="panel-kicker">Filter set</p>
          <h2>Bộ lọc văn hóa</h2>
        </div>
      </div>
      <div className="filter-list">
        {list.map((filter) => {
          const Icon = ICONS[filter.type] || Flower2;
          return (
            <button
              key={filter.type}
              className={selected === filter.type ? 'filter-card active' : 'filter-card'}
              type="button"
              onClick={() => onSelect(filter.type)}
            >
              <span className="filter-icon" aria-hidden="true">
                <Icon size={20} />
              </span>
              <span className="filter-copy">
                <span>{filter.name}</span>
                <small>{DESCRIPTIONS[filter.type]}</small>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

