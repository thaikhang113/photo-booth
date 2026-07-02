import { Download } from 'lucide-react';

export default function ResultPreview({ resultUrl, loading }) {
  return (
    <section className="result-section">
      <div className="section-title">
        <div>
          <p className="panel-kicker">Output</p>
          <h2>Ảnh kết quả</h2>
        </div>
        <a className={!resultUrl ? 'download disabled' : 'download'} href={resultUrl || '#'} download="photo-booth-vietnam.png">
          <Download size={18} /> Download Result
        </a>
      </div>
      <div className="result-frame">
        {loading && <div className="loader">Đang xử lý ảnh...</div>}
        {!loading && resultUrl && <img src={resultUrl} alt="Ảnh đã xử lý" />}
        {!loading && !resultUrl && <div className="empty-state">Kết quả sẽ hiển thị tại đây</div>}
      </div>
    </section>
  );
}

