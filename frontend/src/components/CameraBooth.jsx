import { Camera, Check, RefreshCcw, RotateCcw, Send, Timer, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { boothShotTargets, timerOptions } from '../boothUtils.mjs';

const VISION_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm';
const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const GESTURE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';
const POSE_GUIDES = ['Nhìn thẳng', 'Nghiêng nhẹ', 'Tay chữ V', 'Cười lớn', 'Tạo dáng tự do', 'Kết thúc tự nhiên'];

export default function CameraBooth({
  capturedUrl,
  faceLandmarks: parentFaceLandmarks,
  handGesture: parentHandGesture,
  loading,
  visionReady: parentVisionReady,
  visionError: parentVisionError,
  boothMode,
  boothShotCount,
  currentSlotIndex,
  pendingShot,
  boothActive,
  reviewMode,
  slotsReady,
  currentShotProcessed,
  nextSlotAvailable,
  onBoothMode,
  onBoothStart,
  onUsePhoto,
  onRetake,
  onNextSlot,
  onFinishSession,
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
  const timerRef = useRef({ cancelled: false });
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState('');
  const [livePreview, setLivePreview] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(10);
  const [faceLandmarks, setFaceLandmarks] = useState([]);
  const [handGesture, setHandGesture] = useState('None');
  const [visionReady, setVisionReady] = useState(false);
  const [visionError, setVisionError] = useState('');
  const displayFaceLandmarks = parentFaceLandmarks ?? faceLandmarks;
  const displayHandGesture = parentHandGesture ?? handGesture;
  const displayVisionReady = parentVisionReady ?? visionReady;
  const displayVisionError = parentVisionError ?? visionError;
  const inMultiMode = boothMode > 1;
  const canCapture = cameraOn && !timerRunning && !pendingShot && (!inMultiMode || boothActive);

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
      timerRef.current.cancelled = true;
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
    if (!cameraOn || !visionReady || (capturedUrl && !boothActive)) return undefined;

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
  }, [cameraOn, visionReady, capturedUrl, boothActive]);

  useEffect(() => {
    if (!handGesture || !visionReady || timerRunning || pendingShot) return undefined;
    const timer = setTimeout(() => {
      if (['Pointing_Up', 'Thumb_Up'].includes(handGesture)) {
        window.dispatchEvent(new CustomEvent('gesture-next'));
      } else if (['Open_Palm', 'Victory'].includes(handGesture)) {
        gestureActionsRef.current.onApply?.();
      } else if (handGesture === 'Closed_Fist') {
        gestureActionsRef.current.onReset?.();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [handGesture, visionReady, timerRunning, pendingShot]);

  useEffect(() => {
    if (!livePreview || !cameraOn || capturedUrl || loading || boothActive || timerRunning || !onLivePreviewFrame) return undefined;
    let cancelled = false;
    const timer = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || cancelled) return;
      drawCameraFrame(video, canvas);
      canvas.toBlob((blob) => {
        if (!cancelled && blob) onLivePreviewFrame(blob);
      }, 'image/png');
    }, 650);
    return () => { cancelled = true; clearInterval(timer); };
  }, [livePreview, cameraOn, capturedUrl, loading, boothActive, timerRunning, onLivePreviewFrame]);

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
      setError(`Cannot open webcam (${err?.name || 'Error'}). Close other camera apps/tabs, then Start Camera again.`);
    }
  }

  function drawCameraFrame(video, canvas) {
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function captureFrame() {
    if (!videoRef.current || !cameraOn) {
      setError('Start Camera before capture.');
      return Promise.resolve(false);
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    drawCameraFrame(video, canvas);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        onCapture(blob, URL.createObjectURL(blob), {
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

  function startSession() {
    if (!cameraOn) {
      setError('Start Camera before Start Session.');
      return;
    }
    setError('');
    onBoothStart?.();
  }

  async function captureWithTimer() {
    if (!canCapture || timerRunning || timerSeconds <= 0) return;
    timerRef.current.cancelled = false;
    setTimerRunning(true);
    setError('');
    for (let t = timerSeconds; t > 0; t -= 1) {
      if (timerRef.current.cancelled) {
        setCountdown(null);
        setTimerRunning(false);
        return;
      }
      setCountdown(t);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setCountdown(0);
    await captureFrame();
    setCountdown(null);
    setTimerRunning(false);
  }

  function resetAll() {
    setError('');
    setCountdown(null);
    setTimerRunning(false);
    timerRef.current.cancelled = true;
    onReset();
  }

  const flatLandmarks = displayFaceLandmarks.flat().length;
  const faceDetected = flatLandmarks > 0;
  const poseGuide = POSE_GUIDES[currentSlotIndex % POSE_GUIDES.length];
  const progressLabel = inMultiMode ? `Slot ${Math.min(currentSlotIndex + 1, boothMode)}/${boothMode} · ${boothShotCount}/${boothMode} OK` : '';

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
        {capturedUrl ? (
          <img src={capturedUrl} alt="Captured preview" />
        ) : (
          <video ref={videoRef} aria-label="Webcam preview" autoPlay playsInline muted />
        )}
        {countdown !== null && <div className="countdown-overlay">{countdown || 'Capture'}</div>}
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
          <button key={target} type="button" className={boothMode === target ? 'opt-btn active' : 'opt-btn'} disabled={timerRunning || boothActive} onClick={() => onBoothMode?.(target)}>
            {target === 1 ? 'Single' : `${target} shots`}
          </button>
        ))}
        {inMultiMode && <span className="booth-progress">{progressLabel}</span>}
        {inMultiMode && <span className="booth-progress">Pose: {poseGuide}</span>}
      </div>
      <div className="booth-controls" aria-label="Timer options">
        {timerOptions().map((option) => (
          <button key={option.seconds} type="button" className={timerSeconds === option.seconds ? 'opt-btn active' : 'opt-btn'} disabled={timerRunning} onClick={() => setTimerSeconds(option.seconds)}>
            {option.label}
          </button>
        ))}
      </div>
      <div className="toolbar">
        <button type="button" onClick={startCamera} disabled={timerRunning}>
          <Video size={18} /> Start Camera
        </button>
        <button type="button" onClick={capture} disabled={!canCapture}>
          <Camera size={18} /> Capture
        </button>
        <button type="button" onClick={captureWithTimer} disabled={!canCapture || loading || timerSeconds <= 0}>
          <Timer size={18} /> {timerSeconds > 0 ? `Timer ${timerSeconds}s` : 'Timer Off'}
        </button>
        {inMultiMode && (
          <button type="button" onClick={startSession} disabled={!cameraOn || timerRunning || loading || boothActive}>
            <Timer size={18} /> Start Session
          </button>
        )}
        {pendingShot && (
          <>
            <button type="button" onClick={onUsePhoto} disabled={loading}>
              <Check size={18} /> Use Photo / OK
            </button>
            <button type="button" className="ghost" onClick={onRetake} disabled={loading}>
              <RotateCcw size={18} /> Retake
            </button>
          </>
        )}
        {inMultiMode && capturedUrl && !pendingShot && (
          <button type="button" className="ghost" onClick={onRetake} disabled={loading}>
            <RotateCcw size={18} /> Retake
          </button>
        )}
        {inMultiMode && currentShotProcessed && nextSlotAvailable && (
          <button type="button" onClick={onNextSlot} disabled={loading}>
            <Check size={18} /> Next Photo
          </button>
        )}
        {inMultiMode && reviewMode && (
          <button type="button" className="ghost" onClick={onFinishSession} disabled={!slotsReady || loading}>
            Finish
          </button>
        )}
        <button type="button" disabled={!capturedUrl || loading || timerRunning || pendingShot} onClick={onApply}>
          <Send size={18} /> {loading ? 'Processing...' : 'Apply Filter'}
        </button>
        <button type="button" className={livePreview ? 'ghost active' : 'ghost'} disabled={boothActive || timerRunning} onClick={() => setLivePreview(!livePreview)}>
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
