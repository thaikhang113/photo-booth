import { useCallback, useEffect, useState } from 'react';
import CameraBooth from './components/CameraBooth.jsx';
import FilterPanel from './components/FilterPanel.jsx';
import Header from './components/Header.jsx';
import ResultPreview from './components/ResultPreview.jsx';
import { fetchFilters, processImage } from './services/api.js';

export default function App() {
  const [filters, setFilters] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('dong_ho');
  const [captureBlob, setCaptureBlob] = useState(null);
  const [capturedUrl, setCapturedUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [faceLandmarks, setFaceLandmarks] = useState([]);
  const [handGesture, setHandGesture] = useState('None');
  const [visionReady, setVisionReady] = useState(false);
  const [visionError, setVisionError] = useState('');

  useEffect(() => {
    fetchFilters()
      .then((data) => setFilters(data.filters || []))
      .catch(() => {
        setError('Backend chưa sẵn sàng. Vẫn có thể chụp ảnh, nhưng Apply Filter cần FastAPI.');
      });
  }, []);

  function handleCapture(blob, url) {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCaptureBlob(blob);
    setCapturedUrl(url);
    setResultUrl('');
    setError('');
  }

  async function handleApply() {
    if (!captureBlob) {
      setError('Hãy chụp ảnh trước khi áp dụng bộ lọc.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resultBlob = await processImage(captureBlob, selectedFilter);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(resultBlob));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setCaptureBlob(null);
    setCapturedUrl('');
    setResultUrl('');
    setError('');
  }

  const handleVisionUpdate = useCallback((state) => {
    setFaceLandmarks(state.faceLandmarks);
    setHandGesture(state.handGesture);
    setVisionReady(state.visionReady);
    setVisionError(state.visionError);
  }, []);

  return (
    <main className="app-shell">
      <Header />
      {error && <p className="message error global">{error}</p>}
      <section className="demo-strip" aria-label="Trạng thái demo">
        <span className={captureBlob ? 'step-chip done' : 'step-chip'}>1. Camera</span>
        <span className={selectedFilter ? 'step-chip done' : 'step-chip'}>2. Bộ lọc</span>
        <span className={resultUrl ? 'step-chip done' : 'step-chip'}>3. Kết quả</span>
      </section>
      <div className="booth-layout">
        <CameraBooth
          capturedUrl={capturedUrl}
          faceLandmarks={faceLandmarks}
          handGesture={handGesture}
          loading={loading}
          visionReady={visionReady}
          visionError={visionError}
          onCapture={handleCapture}
          onApply={handleApply}
          onReset={reset}
          onVisionUpdate={handleVisionUpdate}
        />
        <FilterPanel filters={filters} selected={selectedFilter} onSelect={setSelectedFilter} />
      </div>
      <ResultPreview resultUrl={resultUrl} loading={loading} />
    </main>
  );
}

