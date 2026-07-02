import { Camera, RefreshCcw, Send, Video } from 'lucide-react';
import { useRef, useState } from 'react';

export default function CameraBooth({ capturedUrl, loading, onCapture, onApply, onReset }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState('');

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

