import { useCallback, useEffect, useRef, useState } from "react";
import CameraBooth from "./components/CameraBooth.jsx";
import FilterPanel from "./components/FilterPanel.jsx";
import Header from "./components/Header.jsx";
import ResultPreview from "./components/ResultPreview.jsx";
import { fetchFilters, processImage } from "./services/api.js";

const FILTER_DEFAULTS = [
  { type: "dong_ho", name: "Tranh Đông Hồ" },
  { type: "time_travel", name: "Du Hành Thời Gian", modes: ["1980", "modern", "future"] },
  { type: "landmark", name: "Địa Danh Việt Nam", opts: ["hoi_an", "hue", "ho_guom", "ha_long"] },
  { type: "costume", name: "Trang Phục Truyền Thống", opts: ["non_la", "khan_dong", "khan_ran"] },
  { type: "tet", name: "Tết Việt Nam", tetLocations: ["home", "street", "flower_market"] },
  { type: "tuong", name: "Nghệ Thuật Tuồng" },
];

function withFallbackMeta(filters) {
  const source = filters?.length ? filters : FILTER_DEFAULTS;
  return source.map((f) => ({ ...(FILTER_DEFAULTS.find((x) => x.type === f.type) || {}), ...f }));
}

export default function App() {
  const [filters,setFilters]=useState([]);
  const [selectedFilter,setSelectedFilter]=useState("dong_ho");
  const [captureBlob,setCaptureBlob]=useState(null);
  const [capturedUrl,setCapturedUrl]=useState("");
  const [resultUrl,setResultUrl]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [faceLandmarks,setFaceLandmarks]=useState([]);
  const [handGesture,setHandGesture]=useState("None");
  const [visionReady,setVisionReady]=useState(false);
  const [visionError,setVisionError]=useState("");
  const [filterOptions,setFilterOptions]=useState({});
  const livePreviewSeq = useRef(0);

  useEffect(()=>{fetchFilters().then(d=>setFilters(withFallbackMeta(d.filters))).catch(()=>{setFilters(FILTER_DEFAULTS);setError("Backend chưa sẵn sàng. Vẫn có thể chụp ảnh, nhưng Apply Filter cần FastAPI.");});},[]);

  const handleCapture=useCallback((blob,url)=>{setCapturedUrl(prev=>{if(prev)URL.revokeObjectURL(prev);return url;});setCaptureBlob(blob);setResultUrl("");setError("");},[]);
  const handleApply=useCallback(async ()=>{
    if(!captureBlob){setError("Hãy chụp ảnh trước khi áp dụng bộ lọc.");return;}
    setLoading(true);setError("");
    try{
      const meta={faceLandmarks,handGesture,filterOptions};
      const blob=await processImage(captureBlob,selectedFilter,meta);
      if(resultUrl)URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
    }catch(err){setError(err.message);}finally{setLoading(false);}
  },[captureBlob, faceLandmarks, filterOptions, handGesture, resultUrl, selectedFilter]);
  const reset=useCallback(()=>{setCapturedUrl(prev=>{if(prev)URL.revokeObjectURL(prev);return "";});setResultUrl(prev=>{if(prev)URL.revokeObjectURL(prev);return "";});setCaptureBlob(null);setError("");setFilterOptions({});},[]);
  const handleVisionUpdate=useCallback((s)=>{setFaceLandmarks(s.faceLandmarks);setHandGesture(s.handGesture);setVisionReady(s.visionReady);setVisionError(s.visionError);},[]);
  useEffect(() => {
    function h() {
      const list=withFallbackMeta(filters);
      if(!list.length)return;
      if(selectedFilter==="tet"){
        const tet=list.find(f=>f.type==="tet");
        const locations=tet?.tetLocations||[];
        const current=filterOptions.tetLocation||locations[0];
        const idx=locations.indexOf(current);
        setFilterOptions({...filterOptions,tetLocation:locations[(idx+1)%locations.length]});
        return;
      }
      const idx=list.findIndex(f=>f.type===selectedFilter);
      setSelectedFilter(list[(idx+1)%list.length].type);
      setFilterOptions({});
    }
    window.addEventListener('gesture-next',h);
    return ()=>window.removeEventListener('gesture-next',h);
  }, [filterOptions, filters, selectedFilter]);
  function changeFilter(t){setSelectedFilter(t);setFilterOptions({});}
  function onChangeFilterOptions(o){setFilterOptions(o);}


  const handleLivePreviewFrame = useCallback(async (blob) => {
    const seq = ++livePreviewSeq.current;
    try {
      const meta = { faceLandmarks, handGesture, filterOptions };
      const result = await processImage(blob, selectedFilter, meta);
      if (seq !== livePreviewSeq.current) return;
      setResultUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(result); });
    } catch {
      // Live preview is opportunistic; manual Apply remains authoritative.
    }
  }, [faceLandmarks, handGesture, filterOptions, selectedFilter]);

  return (<main className="app-shell">
    <Header/>
    {error&&<p className="message error global">{error}</p>}
    <section className="demo-strip" aria-label="Trạng thái demo">
      <span className={captureBlob?"step-chip done":"step-chip"}>1. Camera</span>
      <span className={selectedFilter?"step-chip done":"step-chip"}>2. Bộ lọc</span>
      <span className={resultUrl?"step-chip done":"step-chip"}>3. Kết quả</span>
    </section>
    <div className="booth-layout">
      <CameraBooth capturedUrl={capturedUrl} faceLandmarks={faceLandmarks} handGesture={handGesture}
        loading={loading} visionReady={visionReady} visionError={visionError}
        onCapture={handleCapture} onApply={handleApply} onReset={reset} onVisionUpdate={handleVisionUpdate} onLivePreviewFrame={handleLivePreviewFrame}/>
      <FilterPanel filters={filters} selected={selectedFilter} filterOptions={filterOptions}
        onSelect={changeFilter} onFilterOptions={onChangeFilterOptions}/>
    </div>
    <ResultPreview resultUrl={resultUrl} loading={loading}/>
  </main>);
}
