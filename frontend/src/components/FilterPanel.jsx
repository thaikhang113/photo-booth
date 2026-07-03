import { Cherry, Clock3, Drama, Flower2, Landmark, Shirt } from "lucide-react";

const FALLBACK = [
  { type: "dong_ho", name: "Tranh Đông Hồ" },
  { type: "time_travel", name: "Du Hành Thời Gian", modes: ["1980","modern","future"] },
  { type: "landmark", name: "Địa Danh Việt Nam", opts: ["hoi_an","hue","ho_guom","ha_long"] },
  { type: "costume", name: "Trang Phục Truyền Thống", opts: ["non_la","khan_dong","khan_ran"] },
  { type: "tet", name: "Tết Việt Nam" },
  { type: "tuong", name: "Nghệ Thuật Tuồng" },
];
const DESC = {
  dong_ho:"Màu phẳng, nét viền dân gian", time_travel:"Chọn thời kỳ",
  landmark:"Ghép nền địa danh", costume:"Nón, khăn, khăn rằn",
  tet:"Khung đỏ hoa Tết", tuong:"Pattern mặt Tuồng",
};
const ICON = { dong_ho:Flower2, time_travel:Clock3, landmark:Landmark, costume:Shirt, tet:Cherry, tuong:Drama };
const LBL = {
  timeTravelMode:{"1980":"1980",modern:"Hiện đại",future:"Tương lai"},
  landmark:{hoi_an:"Hội An",hue:"Huế",ho_guom:"Hồ Gươm",ha_long:"Hạ Long"},
  costume:{non_la:"Nón lá",khan_dong:"Khăn đóng",khan_ran:"Khăn rằn"},
};

export default function FilterPanel({filters,selected,filterOptions,onSelect,onFilterOptions}) {
  const list=filters.length?filters:FALLBACK;
  const opts=filterOptions||{};
  const cur=list.find(f=>f.type===selected);
  return (<aside className="filter-panel"><div className="panel-heading compact"><div><p className="panel-kicker">Filter set</p><h2>Bộ lọc văn hóa</h2></div></div>
    <div className="filter-list">{list.map(f=>{const Ic=ICON[f.type]||Flower2;return(
      <button key={f.type} className={selected===f.type?"filter-card active":"filter-card"} type="button" onClick={()=>onSelect(f.type)}>
        <span className="filter-icon" aria-hidden="true"><Ic size={20}/></span>
        <span className="filter-copy"><span>{f.name}</span><small>{DESC[f.type]}</small></span>
      </button>);
    })}</div>
    {cur?.modes&&<div className="filter-options"><label>Thời kỳ:</label><div className="option-row">{cur.modes.map(m=>(
      <button key={m} className={opts.timeTravelMode===m?"opt-btn active":"opt-btn"} onClick={()=>onFilterOptions?.({...opts,timeTravelMode:m})}>{LBL.timeTravelMode[m]||m}</button>
    ))}</div></div>}
    {selected==="landmark"&&<div className="filter-options"><label>Địa danh:</label><div className="option-row">{FALLBACK.find(f=>f.type==="landmark").opts.map(o=>(
      <button key={o} className={opts.landmark===o?"opt-btn active":"opt-btn"} onClick={()=>onFilterOptions?.({...opts,landmark:o})}>{LBL.landmark[o]||o}</button>
    ))}</div></div>}
    {selected==="costume"&&<div className="filter-options"><label>Phụ kiện:</label><div className="option-row">{FALLBACK.find(f=>f.type==="costume").opts.map(o=>(
      <button key={o} className={opts.costume===o?"opt-btn active":"opt-btn"} onClick={()=>onFilterOptions?.({...opts,costume:o})}>{LBL.costume[o]||o}</button>
    ))}</div></div>}
  </aside>);
}
