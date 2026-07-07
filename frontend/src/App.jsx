import { useCallback, useEffect, useRef, useState } from "react";
import CameraBooth from "./components/CameraBooth.jsx";
import FilterPanel from "./components/FilterPanel.jsx";
import Header from "./components/Header.jsx";
import ResultPreview from "./components/ResultPreview.jsx";
import { acceptSlot, allSlotsReady, contactSheetLayout, createBoothSlots, retakeSlot } from "./boothUtils.mjs";
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
  const [boothMode,setBoothMode]=useState(1);
  const [boothShots,setBoothShots]=useState([]);
  const [selectedShotIndex,setSelectedShotIndex]=useState(0);
  const [currentSlotIndex,setCurrentSlotIndex]=useState(0);
  const [pendingShot,setPendingShot]=useState(null);
  const [boothActive,setBoothActive]=useState(false);
  const [reviewMode,setReviewMode]=useState(false);
  const [contactSheetUrl,setContactSheetUrl]=useState("");
  const livePreviewSeq = useRef(0);

  useEffect(()=>{fetchFilters().then(d=>setFilters(withFallbackMeta(d.filters))).catch(()=>{setFilters(FILTER_DEFAULTS);setError("Backend chưa sẵn sàng. Vẫn có thể chụp ảnh, nhưng Apply Filter cần FastAPI.");});},[]);

  const revokeShotUrls = useCallback((shots) => {
    shots.forEach((shot) => {
      if (shot.url) URL.revokeObjectURL(shot.url);
      if (shot.resultUrl) URL.revokeObjectURL(shot.resultUrl);
    });
  }, []);

  const clearPendingShot = useCallback(() => {
    setPendingShot((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  const handleCapture=useCallback((blob,url,info={})=>{
    const shot = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      blob,
      url,
      resultUrl: "",
      meta: {
        faceLandmarks: info.faceLandmarks ?? faceLandmarks,
        handGesture: info.handGesture ?? handGesture,
      },
      status: "pending_ok",
    };
    setCapturedUrl(url);
    setCaptureBlob(blob);
    setResultUrl("");
    setContactSheetUrl((prev)=>{if(prev)URL.revokeObjectURL(prev);return "";});
    setError("");
    if(boothMode>1&&boothActive){
      clearPendingShot();
      setPendingShot(shot);
      setSelectedShotIndex(currentSlotIndex);
      return;
    }
    clearPendingShot();
    revokeShotUrls(boothShots);
    setBoothShots([]);
    setBoothActive(false);
    setReviewMode(false);
    setSelectedShotIndex(0);
  },[boothActive, boothMode, boothShots, clearPendingShot, currentSlotIndex, faceLandmarks, handGesture, revokeShotUrls]);
  const handleApply=useCallback(async ()=>{
    if(!captureBlob){setError("Hãy chụp ảnh trước khi áp dụng bộ lọc.");return;}
    setLoading(true);setError("");
    try{
      const shotMeta = boothShots[selectedShotIndex]?.meta || { faceLandmarks, handGesture };
      const meta={...shotMeta,filterOptions};
      const blob=await processImage(captureBlob,selectedFilter,meta);
      const url = URL.createObjectURL(blob);
      if(resultUrl)URL.revokeObjectURL(resultUrl);
      setResultUrl(url);
      setBoothShots((prev)=>prev.map((shot,i)=>{
        if(i!==selectedShotIndex)return shot;
        if(shot.resultUrl)URL.revokeObjectURL(shot.resultUrl);
        return {...shot,resultUrl:url,status:"processed"};
      }));
    }catch(err){setError(err.message);}finally{setLoading(false);}
  },[boothShots, captureBlob, faceLandmarks, filterOptions, handGesture, resultUrl, selectedFilter, selectedShotIndex]);
  const reset=useCallback(()=>{
    revokeShotUrls(boothShots);
    clearPendingShot();
    setCapturedUrl("");
    setResultUrl("");
    setContactSheetUrl((prev)=>{if(prev)URL.revokeObjectURL(prev);return "";});
    setBoothShots([]);
    setSelectedShotIndex(0);
    setCurrentSlotIndex(0);
    setBoothActive(false);
    setReviewMode(false);
    setCaptureBlob(null);
    setError("");
    setFilterOptions({});
  },[boothShots, clearPendingShot, revokeShotUrls]);
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

  function changeBoothMode(target){
    revokeShotUrls(boothShots);
    clearPendingShot();
    setBoothMode(target);
    setBoothShots([]);
    setSelectedShotIndex(0);
    setCurrentSlotIndex(0);
    setBoothActive(false);
    setReviewMode(false);
    setCapturedUrl("");
    setCaptureBlob(null);
    setResultUrl("");
    setContactSheetUrl((prev)=>{if(prev)URL.revokeObjectURL(prev);return "";});
  }

  function startBoothSession(){
    revokeShotUrls(boothShots);
    clearPendingShot();
    setBoothShots(createBoothSlots(boothMode));
    setSelectedShotIndex(0);
    setCurrentSlotIndex(0);
    setBoothActive(true);
    setReviewMode(false);
    setCapturedUrl("");
    setCaptureBlob(null);
    setResultUrl("");
    setContactSheetUrl((prev)=>{if(prev)URL.revokeObjectURL(prev);return "";});
    setError("");
  }

  function selectShot(index){
    const shot=boothShots[index];
    if(!shot)return;
    setSelectedShotIndex(index);
    setCurrentSlotIndex(index);
    setBoothActive(false);
    setReviewMode(true);
    clearPendingShot();
    setCaptureBlob(shot.blob);
    setCapturedUrl(shot.url);
    setResultUrl(shot.resultUrl||"");
  }

  function usePendingShot(){
    if(!pendingShot){setError("Hãy chụp ảnh trước khi bấm OK.");return;}
    const nextShots=acceptSlot(boothShots,currentSlotIndex,pendingShot);
    const nextIndex=nextShots.findIndex((shot)=>shot.status==="empty");
    setBoothShots(nextShots);
    setPendingShot(null);
    setResultUrl("");
    setContactSheetUrl((prev)=>{if(prev)URL.revokeObjectURL(prev);return "";});
    if(nextIndex!==-1){
      setCurrentSlotIndex(nextIndex);
      setSelectedShotIndex(nextIndex);
      setCapturedUrl("");
      setCaptureBlob(null);
      setBoothActive(true);
      setReviewMode(false);
      return;
    }
    setSelectedShotIndex(currentSlotIndex);
    setBoothActive(false);
    setReviewMode(true);
  }

  function retakeCurrentShot(){
    clearPendingShot();
    const shot=boothShots[currentSlotIndex];
    if(shot?.url)URL.revokeObjectURL(shot.url);
    if(shot?.resultUrl)URL.revokeObjectURL(shot.resultUrl);
    setBoothShots((prev)=>retakeSlot(prev,currentSlotIndex));
    setCapturedUrl("");
    setCaptureBlob(null);
    setResultUrl("");
    setBoothActive(boothMode>1);
    setReviewMode(false);
    setContactSheetUrl((prev)=>{if(prev)URL.revokeObjectURL(prev);return "";});
  }

  function finishSession(){
    if(!allSlotsReady(boothShots)){setError("Cần OK đủ slot trước khi Finish.");return;}
    clearPendingShot();
    setBoothActive(false);
    setReviewMode(true);
  }

  async function loadImage(url){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=reject;
      img.src=url;
    });
  }

  const buildContactSheet=useCallback(async(shots=boothShots)=>{
    if(!allSlotsReady(shots))return "";
    const {cols,rows}=contactSheetLayout(shots.length);
    const cellW=420, cellH=315, gap=22, pad=34;
    const canvas=document.createElement("canvas");
    canvas.width=cols*cellW+(cols-1)*gap+pad*2;
    canvas.height=rows*cellH+(rows-1)*gap+pad*2+72;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#fffaf1";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#8b1f23";
    ctx.font="700 34px Arial";
    ctx.fillText("Photo Booth Văn Hóa Việt Nam",pad,48);
    const images=await Promise.all(shots.map((shot)=>loadImage(shot.resultUrl||shot.url)));
    images.forEach((img,i)=>{
      const col=i%cols, row=Math.floor(i/cols);
      const x=pad+col*(cellW+gap), y=pad+72+row*(cellH+gap);
      ctx.fillStyle="#ffffff";
      ctx.fillRect(x,y,cellW,cellH);
      const scale=Math.max(cellW/img.width,cellH/img.height);
      const dw=img.width*scale, dh=img.height*scale;
      ctx.drawImage(img,x+(cellW-dw)/2,y+(cellH-dh)/2,dw,dh);
      ctx.strokeStyle="#d9b870";
      ctx.lineWidth=6;
      ctx.strokeRect(x+3,y+3,cellW-6,cellH-6);
    });
    const blob=await new Promise((resolve)=>canvas.toBlob(resolve,"image/png"));
    if(!blob)return "";
    const url=URL.createObjectURL(blob);
    setContactSheetUrl((prev)=>{if(prev)URL.revokeObjectURL(prev);return url;});
    return url;
  },[boothShots]);

  const applyAllShots=useCallback(async()=>{
    if(!allSlotsReady(boothShots))return;
    setLoading(true);setError("");
    try{
      const processed=[];
      for(const shot of boothShots){
        const blob=await processImage(shot.blob,selectedFilter,{...shot.meta,filterOptions});
        processed.push({...shot,resultUrl:URL.createObjectURL(blob),status:"processed"});
      }
      revokeShotUrls(boothShots.map((shot)=>({url:"",resultUrl:shot.resultUrl})));
      setBoothShots(processed);
      setSelectedShotIndex(0);
      setCapturedUrl(processed[0].url);
      setCaptureBlob(processed[0].blob);
      setResultUrl(processed[0].resultUrl);
      await buildContactSheet(processed);
    }catch(err){setError(err.message);}finally{setLoading(false);}
  },[boothShots, buildContactSheet, filterOptions, revokeShotUrls, selectedFilter]);


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

  const slotsReady=allSlotsReady(boothShots);
  const acceptedCount=boothShots.filter((shot)=>shot.status==="accepted"||shot.status==="processed").length;

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
        boothMode={boothMode} boothShotCount={acceptedCount} currentSlotIndex={currentSlotIndex}
        pendingShot={pendingShot} boothActive={boothActive} reviewMode={reviewMode} slotsReady={slotsReady}
        onBoothMode={changeBoothMode} onBoothStart={startBoothSession} onUsePhoto={usePendingShot}
        onRetake={retakeCurrentShot} onFinishSession={finishSession}
        onCapture={handleCapture} onApply={handleApply} onReset={reset} onVisionUpdate={handleVisionUpdate} onLivePreviewFrame={handleLivePreviewFrame}/>
      <FilterPanel filters={filters} selected={selectedFilter} filterOptions={filterOptions}
        onSelect={changeFilter} onFilterOptions={onChangeFilterOptions}/>
    </div>
    {boothShots.length>0&&<section className="shot-strip" aria-label="Booth shots">
      <div className="shot-strip-head">
        <div><p className="panel-kicker">Booth strip</p><h2>{acceptedCount}/{boothShots.length} ảnh đã OK</h2></div>
        <div className="shot-actions">
          <button type="button" onClick={applyAllShots} disabled={loading||!slotsReady}>Apply All</button>
          <button type="button" className="ghost" onClick={()=>buildContactSheet()} disabled={loading||!slotsReady}>Make Strip</button>
          <a className={!contactSheetUrl?"download disabled":"download"} href={contactSheetUrl||"#"} download="photo-booth-strip.png">Download Strip</a>
        </div>
      </div>
      <div className="shot-grid">
        {boothShots.map((shot,i)=><button type="button" key={shot.id} className={`${selectedShotIndex===i?"shot-thumb active":"shot-thumb"} ${shot.status==="empty"?"empty":""}`} onClick={()=>selectShot(i)}>
          {shot.url?<img src={shot.resultUrl||shot.url} alt={`Booth shot ${i+1}`} />:<div className="slot-placeholder">Slot {i+1}</div>}
          <span>{i+1}</span>
        </button>)}
      </div>
    </section>}
    <ResultPreview resultUrl={resultUrl} loading={loading}/>
  </main>);
}
