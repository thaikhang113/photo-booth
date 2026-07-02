import { Camera, Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          <Camera size={26} />
        </div>
        <div>
          <p className="eyebrow">Vietnam Culture Studio</p>
          <h1>Photo Booth Văn Hóa Việt Nam</h1>
        </div>
      </div>
      <div className="header-badge">
        <Sparkles size={18} />
        <span>OpenCV MVP</span>
      </div>
    </header>
  );
}

