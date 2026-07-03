import { Camera, RefreshCcw, Send, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

const VISION_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm';
const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const GESTURE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

export default function CameraBooth({ capturedUrl, loading, onCapture, onApply, onReset }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const visionRef = useRef({ faceLandmarker: null, gestureRecognizer: null, frameId: 0 });
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState('');
  const [faceLandmarks, setFaceLandmarks] = useState([]);
  const [handGesture, setHandGesture] = useState('None');
  const [visionReady, setVisionReady] = useState(false);
  const [visionError, setVisionError] = useState('');

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
      cancelAnimationFrame(visionRef.current.frameId);
      visionRef.current.faceLandmarker?.close();
      visionRef.current.gestureRecognizer?.close();
    };
  }, []);

  useEffect(() => {
    if (!cameraOn || !visionReady || capturedUrl) return undefined;

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
  }, [cameraOn, visionReady, capturedUrl]);

  async function startCamera() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 960, height: 720 }, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      setError('Không mở được webcam. Kiểm tra quyền camera trên browser.');
    }
  }

  function capture() {
    if (!videoRef.current || !cameraOn) {
      setError('Hãy bấm Start Camera trước khi chụp.');
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => onCapture(blob, URL.createObjectURL(blob)), 'image/png');
  }

  function resetAll() {
    setError('');
    onReset();
  }

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
          <img src={capturedUrl} alt="Ảnh vừa chụp" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted />
        )}
        {!cameraOn && !capturedUrl && <div className="empty-state">Webcam preview</div>}
      </div>
      {error && <p className="message error">{error}</p>}
      <div className="vision-status" aria-live="polite">
        <span className={visionError ? 'status-pill error' : visionReady ? 'status-pill live' : 'status-pill'}>
          {visionError ? 'Vision error' : visionReady ? 'Vision ready' : 'Vision loading'}
        </span>
        <span>Gesture: {handGesture}</span>
        <span>Landmarks: {faceLandmarks.flat().length}</span>
      </div>
      {visionError && <p className="message error">{visionError}</p>}
      <div className="toolbar">
        <button type="button" onClick={startCamera}>
          <Video size={18} /> Start Camera
        </button>
        <button type="button" onClick={capture}>
          <Camera size={18} /> Capture
        </button>
        <button type="button" disabled={!capturedUrl || loading} onClick={onApply}>
          <Send size={18} /> {loading ? 'Đang xử lý...' : 'Apply Filter'}
        </button>
        <button type="button" className="ghost" onClick={resetAll}>
          <RefreshCcw size={18} /> Reset
        </button>
      </div>
      <canvas ref={canvasRef} hidden />
    </section>
  );
}

