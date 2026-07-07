import { Camera, RefreshCcw, Send, Timer, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { boothShotTargets } from '../boothUtils.mjs';

const VISION_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm';
const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const GESTURE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

export default function CameraBooth({
  capturedUrl,
  faceLandmarks: parentFaceLandmarks,
  handGesture: parentHandGesture,
  loading,
  visionReady: parentVisionReady,
  visionError: parentVisionError,
  boothMode,
  boothShotCount,
  onBoothMode,
  onBoothStart,
  onCapture,
  onApply,
  onReset,
  onVisionUpdate,
  onLivePreviewFrame,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const gestureActionsRef = useRef({ onApply, onReset });
  const visionPublishRef = useRef({ key: '', time: 0 });
  const visionRef = useRef({ faceLandmarker: null, gestureRecognizer: null, frameId: 0 });
  const sessionRef = useRef({ cancelled: false });
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState('');
  const [livePreview, setLivePreview] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [sessionRunning, setSessionRunning] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(0);
  const [faceLandmarks, setFaceLandmarks] = useState([]);
  const [handGesture, setHandGesture] = useState('None');
  const [visionReady, setVisionReady] = useState(false);
  const [visionError, setVisionError] = useState('');
  const displayFaceLandmarks = parentFaceLandmarks ?? faceLandmarks;
  const displayHandGesture = parentHandGesture ?? handGesture;
  const displayVisionReady = parentVisionReady ?? visionReady;
  const displayVisionError = parentVisionError ?? visionError;

  useEffect(() => {
    let cancelled = false;

    async function loadVision() {
      setVisionError('');
      try {
        const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL);
        const [faceLandmarker, gestureRecognizer] = await Promise.all([
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: FACE_MODEL_URL },
            runningMode: 'VIDEO',
          }),
          GestureRecognizer.createFromOptions(vision, {
            baseOptions: { modelAssetPath: GESTURE_MODEL_URL },
            runningMode: 'VIDEO',
          }),
        ]);
        if (cancelled) {
          faceLandmarker.close();
          gestureRecognizer.close();
          return;
        }
        visionRef.current.faceLandmarker = faceLandmarker;
        visionRef.current.gestureRecognizer = gestureRecognizer;
        setVisionReady(true);
      } catch (err) {
        setVisionError(err?.message || 'MediaPipe vision failed to load.');
      }
    }

    loadVision();

    return () => {
      cancelled = true;
      sessionRef.current.cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      cancelAnimationFrame(visionRef.current.frameId);
      visionRef.current.faceLandmarker?.close();
      visionRef.current.gestureRecognizer?.close();
    };
  }, []);

  useEffect(() => {
    const flatCount = faceLandmarks.flat().length;
    const key = `${visionReady}|${visionError}|${handGesture}|${flatCount}`;
    const now = performance.now();
    if (visionPublishRef.current.key === key && now - visionPublishRef.current.time < 300) return;
    visionPublishRef.current = { key, time: now };
    onVisionUpdate?.({ faceLandmarks, handGesture, visionReady, visionError });
  }, [faceLandmarks, handGesture, visionReady, visionError, onVisionUpdate]);

  useEffect(() => {
    gestureActionsRef.current = { onApply, onReset };
  }, [onApply, onReset]);

  useEffect(() => {
    if (!cameraOn || !visionReady || (capturedUrl && !sessionRunning)) return undefined;

    function detectFrame() {
      const video = videoRef.current;
      const { faceLandmarker, gestureRecognizer } = visionRef.current;
      if (video?.readyState >= 2 && faceLandmarker && gestureRecognizer) {
        try {
          const now = performance.now();
          const faceResult = faceLandmarker.detectForVideo(video, now);
          const gestureResult = gestureRecognizer.recognizeForVideo(video, now);
          setFaceLandmarks(faceResult.faceLandmarks || []);
          setHandGesture(gestureResult.gestures?.[0]?.[0]?.categoryName || 'None');
        } catch (err) {
          setVisionError(err?.message || 'MediaPipe vision failed during detection.');
        }
      }
      visionRef.current.frameId = requestAnimationFrame(detectFrame);
    }

    visionRef.current.frameId = requestAnimationFrame(detectFrame);
    return () => cancelAnimationFrame(visionRef.current.frameId);
  }, [cameraOn, visionReady, capturedUrl, sessionRunning]);


  useEffect(() => {
    if (!handGesture || !visionReady || sessionRunning) return undefined;
    const timer = setTimeout(() => {
      if (["Pointing_Up", "Thumb_Up"].includes(handGesture)) {
        window.dispatchEvent(new CustomEvent("gesture-next"));
      } else if (["Open_Palm", "Victory"].includes(handGesture)) {
        gestureActionsRef.current.onApply?.();
      } else if (handGesture === "Closed_Fist") {
        gestureActionsRef.current.onReset?.();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [handGesture, visionReady, sessionRunning]);


  useEffect(() => {
    if (!livePreview || !cameraOn || capturedUrl || loading || sessionRunning || !onLivePreviewFrame) return undefined;
    let cancelled = false;
    const timer = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || cancelled) return;
      canvas.width = video.videoWidth || 960;
      canvas.height = video.videoHeight || 720;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!cancelled && blob) onLivePreviewFrame(blob);
      }, 'image/png');
    }, 650);
    return () => { cancelled = true; clearInterval(timer); };
  }, [livePreview, cameraOn, capturedUrl, loading, sessionRunning, onLivePreviewFrame]);

  async function startCamera() {
    setError('');
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 960, height: 720 }, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch (err) {
      setCameraOn(false);
      setError(`Không mở được webcam (${err?.name || 'Error'}). Đóng app/tab khác đang dùng camera rồi bấm Start Camera lại.`);
    }
  }

  function captureFrame({ append = false } = {}) {
    if (!videoRef.current || !cameraOn) {
      setError('Hãy bấm Start Camera trước khi chụp.');
      return Promise.resolve(false);
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        onCapture(blob, URL.createObjectURL(blob), {
          append,
          faceLandmarks: displayFaceLandmarks,
          handGesture: displayHandGesture,
        });
        resolve(true);
      }, 'image/png');
    });
  }

  function capture() {
    captureFrame();
  }

  async function startBooth() {
    if (!cameraOn) {
      setError('Hãy bấm Start Camera trước khi chạy photobooth.');
      return;
    }
    if (sessionRunning) return;
    sessionRef.current.cancelled = false;
    setError('');
    setSessionRunning(true);
    setSessionProgress(0);
    onBoothStart?.();
    for (let shot = 1; shot <= boothMode; shot += 1) {
      for (let t = 10; t > 0; t -= 1) {
        if (sessionRef.current.cancelled) return;
        setCountdown(t);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setCountdown(0);
      const ok = await captureFrame({ append: true });
      if (!ok) break;
      setSessionProgress(shot);
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    setCountdown(null);
    setSessionRunning(false);
  }

  function resetAll() {
    setError('');
    setCountdown(null);
    setSessionRunning(false);
    setSessionProgress(0);
    sessionRef.current.cancelled = true;
    onReset();
  }

  const flatLandmarks = displayFaceLandmarks.flat().length;
  const faceDetected = flatLandmarks > 0;

  return (
    <section className="camera-card">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Live booth</p>
          <h2>Camera preview</h2>
        </div>
        <span className={cameraOn ? 'status-pill live' : 'status-pill'}>{cameraOn ? 'Live' : 'Idle'}</span>
      </div>
      <div className="preview-frame">
        {capturedUrl && !sessionRunning ? (
          <img src={capturedUrl} alt="Ảnh vừa chụp" />
        ) : (
          <video ref={videoRef} aria-label="Webcam preview" autoPlay playsInline muted />
        )}
        {countdown !== null && <div className="countdown-overlay">{countdown || 'Chụp'}</div>}
        {!cameraOn && !capturedUrl && <div className="empty-state">Webcam preview</div>}
      </div>
      {error && <p className="message error">{error}</p>}
      <div className="vision-status" aria-live="polite">
        <span className={displayVisionError ? 'status-pill error' : displayVisionReady ? 'status-pill live' : 'status-pill'}>
          {displayVisionError ? 'Vision error' : displayVisionReady ? 'Vision ready' : 'Vision loading'}
        </span>
        <span>Gesture: {displayHandGesture}</span>
        <span className={faceDetected ? 'status-pill live' : 'status-pill error'}>{faceDetected ? 'Face detected' : 'No face'}</span>
        <span>Landmarks: {flatLandmarks}</span>
      </div>
      {displayVisionError && <p className="message error">{displayVisionError}</p>}
      <div className="booth-controls" aria-label="Photo booth mode">
        {boothShotTargets().map((target) => (
          <button key={target} type="button" className={boothMode === target ? 'opt-btn active' : 'opt-btn'} disabled={sessionRunning} onClick={() => onBoothMode?.(target)}>
            {target === 1 ? 'Single' : `${target} shots`}
          </button>
        ))}
        {boothMode > 1 && <span className="booth-progress">{sessionProgress || boothShotCount}/{boothMode}</span>}
      </div>
      <div className="toolbar">
        <button type="button" onClick={startCamera} disabled={sessionRunning}>
          <Video size={18} /> Start Camera
        </button>
        <button type="button" onClick={capture} disabled={sessionRunning}>
          <Camera size={18} /> Capture
        </button>
        {boothMode > 1 && (
          <button type="button" onClick={startBooth} disabled={!cameraOn || sessionRunning || loading}>
            <Timer size={18} /> Start Booth
          </button>
        )}
        <button type="button" disabled={!capturedUrl || loading || sessionRunning} onClick={onApply}>
          <Send size={18} /> {loading ? 'Đang xử lý...' : 'Apply Filter'}
        </button>
        <button type="button" className={livePreview ? 'ghost active' : 'ghost'} disabled={sessionRunning} onClick={() => setLivePreview(!livePreview)}>
          Live Preview
        </button>
        <button type="button" className="ghost" onClick={resetAll}>
          <RefreshCcw size={18} /> Reset
        </button>
      </div>
      <canvas ref={canvasRef} hidden />
    </section>
  );
}

