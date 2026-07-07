import { useCallback, useEffect, useRef, useState } from "react";
import CameraBooth from "./components/CameraBooth.jsx";
import FilterPanel from "./components/FilterPanel.jsx";
import Header from "./components/Header.jsx";
import ResultPreview from "./components/ResultPreview.jsx";
import { acceptSlot, allSlotsReady, boothTemplates, contactSheetLayout, createBoothSlots, defaultCrop, normalizeCrop, retakeSlot } from "./boothUtils.mjs";
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
  const [selectedTemplate,setSelectedTemplate]=useState("grid-2x2");
  const [frameColor,setFrameColor]=useState("#8b1f23");
  const [dragCrop,setDragCrop]=useState(null);
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
      crop: defaultCrop(),
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
    setSelectedTemplate(target===6?"grid-3x2":"grid-2x2");
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

  function updateShotCrop(index, patch){
    setBoothShots((prev)=>prev.map((shot,i)=>i===index?{...shot,crop:normalizeCrop({...shot.crop,...patch})}:shot));
    setContactSheetUrl((prev)=>{if(prev)URL.revokeObjectURL(prev);return "";});
  }

  function startCropDrag(event){
    if(!boothShots[selectedShotIndex]?.url)return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const crop=boothShots[selectedShotIndex].crop||defaultCrop();
    setDragCrop({pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,crop});
  }

  function moveCropDrag(event){
    if(!dragCrop||dragCrop.pointerId!==event.pointerId)return;
    updateShotCrop(selectedShotIndex,{
      x:dragCrop.crop.x+(event.clientX-dragCrop.startX)/4,
      y:dragCrop.crop.y+(event.clientY-dragCrop.startY)/4,
    });
  }

  function endCropDrag(){
    setDragCrop(null);
  }

  function startBoothSession(){
    revokeShotUrls(boothShots);
    clearPendingShot();
    setBoothShots(createBoothSlots(boothMode));
    setSelectedTemplate(boothMode===6?"grid-3x2":"grid-2x2");
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
    setBoothShots(nextShots);
    setPendingShot(null);
    setResultUrl("");
    setContactSheetUrl((prev)=>{if(prev)URL.revokeObjectURL(prev);return "";});
    setSelectedShotIndex(currentSlotIndex);
    setBoothActive(false);
    setReviewMode(true);
  }

  function goToNextSlot(){
    const nextIndex=boothShots.findIndex((shot)=>shot.status==="empty");
    if(nextIndex===-1){
      finishSession();
      return;
    }
    clearPendingShot();
    setCurrentSlotIndex(nextIndex);
    setSelectedShotIndex(nextIndex);
    setCapturedUrl("");
    setCaptureBlob(null);
    setResultUrl("");
    setBoothActive(true);
    setReviewMode(false);
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

  function drawCroppedImage(ctx,img,x,y,w,h,crop=defaultCrop()){
    const c=normalizeCrop(crop);
    const scale=Math.max(w/img.width,h/img.height)*c.zoom;
    const dw=img.width*scale, dh=img.height*scale;
    const dx=x+(w-dw)/2+(c.x/100)*(w/2);
    const dy=y+(h-dh)/2+(c.y/100)*(h/2);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x,y,w,h);
    ctx.clip();
    ctx.drawImage(img,dx,dy,dw,dh);
    ctx.restore();
  }

  const buildContactSheet=useCallback(async(shots=boothShots)=>{
    if(!allSlotsReady(shots))return "";
    const {cols,rows}=contactSheetLayout(shots.length,selectedTemplate);
    const cellW=selectedTemplate==="vertical"||selectedTemplate==="classic"?360:420;
    const cellH=selectedTemplate==="vertical"||selectedTemplate==="classic"?270:315;
    const gap=selectedTemplate==="classic"?16:22, pad=34;
    const canvas=document.createElement("canvas");
    canvas.width=cols*cellW+(cols-1)*gap+pad*2;
    canvas.height=rows*cellH+(rows-1)*gap+pad*2+72;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle=selectedTemplate==="classic"?"#fffdf7":"#fffaf1";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle=frameColor;
    ctx.font="700 34px Arial";
    ctx.fillText("Photo Booth Văn Hóa Việt Nam",pad,48);
    const images=await Promise.all(shots.map((shot)=>loadImage(shot.resultUrl||shot.url)));
    images.forEach((img,i)=>{
      const col=i%cols, row=Math.floor(i/cols);
      const x=pad+col*(cellW+gap), y=pad+72+row*(cellH+gap);
      ctx.fillStyle="#ffffff";
      ctx.fillRect(x,y,cellW,cellH);
      drawCroppedImage(ctx,img,x,y,cellW,cellH,shots[i].crop);
      ctx.strokeStyle=frameColor;
      ctx.lineWidth=selectedTemplate==="classic"?10:6;
      ctx.strokeRect(x+3,y+3,cellW-6,cellH-6);
    });
    const blob=await new Promise((resolve)=>canvas.toBlob(resolve,"image/png"));
    if(!blob)return "";
    const url=URL.createObjectURL(blob);
    setContactSheetUrl((prev)=>{if(prev)URL.revokeObjectURL(prev);return url;});
    return url;
  },[boothShots, frameColor, selectedTemplate]);

  const printStrip=useCallback(async()=>{
    const url=contactSheetUrl||await buildContactSheet();
    if(!url)return;
    requestAnimationFrame(()=>window.print());
  },[buildContactSheet, contactSheetUrl]);

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
  const templateOptions=boothTemplates(boothShots.length||boothMode);
  const selectedShot=boothShots[selectedShotIndex];
  const selectedCrop=selectedShot?.crop||defaultCrop();
  const currentShotProcessed=selectedShot?.status==="processed";
  const nextSlotAvailable=boothShots.some((shot)=>shot.status==="empty");

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
        currentShotProcessed={currentShotProcessed} nextSlotAvailable={nextSlotAvailable}
        onBoothMode={changeBoothMode} onBoothStart={startBoothSession} onUsePhoto={usePendingShot}
        onRetake={retakeCurrentShot} onNextSlot={goToNextSlot} onFinishSession={finishSession}
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
          <button type="button" className="ghost" onClick={printStrip} disabled={loading||!slotsReady}>Print Strip</button>
          <a className={!contactSheetUrl?"download disabled":"download"} href={contactSheetUrl||"#"} download="photo-booth-strip.png">Download Strip</a>
        </div>
      </div>
      <div className="strip-tools">
        <label>Frame
          <select value={selectedTemplate} onChange={(event)=>{setSelectedTemplate(event.target.value);setContactSheetUrl((prev)=>{if(prev)URL.revokeObjectURL(prev);return "";});}}>
            {templateOptions.map((template)=><option key={template.id} value={template.id}>{template.label}</option>)}
          </select>
        </label>
        <label>Color
          <input type="color" value={frameColor} onChange={(event)=>{setFrameColor(event.target.value);setContactSheetUrl((prev)=>{if(prev)URL.revokeObjectURL(prev);return "";});}} />
        </label>
      </div>
      <div className="shot-grid">
        {boothShots.map((shot,i)=><button type="button" key={shot.id} className={`${selectedShotIndex===i?"shot-thumb active":"shot-thumb"} ${shot.status==="empty"?"empty":""}`} onClick={()=>selectShot(i)}>
          {shot.url?<img src={shot.resultUrl||shot.url} alt={`Booth shot ${i+1}`} />:<div className="slot-placeholder">Slot {i+1}</div>}
          <span>{i+1}</span>
        </button>)}
      </div>
      {selectedShot?.url&&<div className="crop-panel">
        <div className="crop-preview" onPointerDown={startCropDrag} onPointerMove={moveCropDrag} onPointerUp={endCropDrag} onPointerCancel={endCropDrag}>
          <img src={selectedShot.resultUrl||selectedShot.url} alt={`Crop slot ${selectedShotIndex+1}`} style={{transform:`translate(${selectedCrop.x}%, ${selectedCrop.y}%) scale(${selectedCrop.zoom})`}} draggable="false" />
        </div>
        <label>Zoom
          <input type="range" min="1" max="3" step="0.05" value={selectedCrop.zoom} onChange={(event)=>updateShotCrop(selectedShotIndex,{zoom:Number(event.target.value)})} />
        </label>
      </div>}
      {contactSheetUrl&&<img className="print-strip" src={contactSheetUrl} alt="Printable photo strip" />}
    </section>}
    <ResultPreview resultUrl={resultUrl} loading={loading}/>
  </main>);
}
