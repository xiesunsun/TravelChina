
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import InkMap from './components/InkMap';
import ScrollList from './components/ScrollList';
import RecordModal from './components/RecordModal';
import { TravelRecord } from './types';
import { loadRecords, saveRecords } from './services/storageService';
import { MapPin, ScrollText } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  const linkClass = (path: string) => `
    flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500 border
    ${isActive(path) 
      ? 'bg-cinnabar text-paper shadow-md border-cinnabar' 
      : 'bg-paper/80 text-ink border-indigo/20 hover:bg-indigo/5 hover:border-indigo/40'}
  `;

  return (
    <nav className="fixed top-8 right-8 z-50 flex gap-4 pointer-events-none">
      <div className="flex gap-3 pointer-events-auto">
        <Link to="/" className={linkClass('/')}>
          <MapPin size={18} strokeWidth={1.5} />
          <span className="text-sm font-bold font-serif tracking-widest">舆图</span>
        </Link>
        
        <Link to="/list" className={linkClass('/list')}>
          <ScrollText size={18} strokeWidth={1.5} />
          <span className="text-sm font-bold font-serif tracking-widest">画卷</span>
        </Link>
      </div>
    </nav>
  );
};

const Header = () => (
  <header className="fixed top-0 left-0 p-8 z-40 select-none pointer-events-none">
    <div className="flex flex-col items-start drop-shadow-md">
      <div className="bg-cinnabar w-8 h-8 rounded-sm mb-3 flex items-center justify-center text-paper text-sm font-serif shadow-sm pointer-events-auto hover:scale-105 transition-transform">
        绘
      </div>
      <h1 className="font-calligraphy text-5xl text-ink tracking-widest pointer-events-auto">
        绘行中华
      </h1>
      <p className="text-xs text-ashes mt-2 font-serif tracking-[0.3em] border-t border-ashes/30 pt-2 w-full text-center">
        INK FOOTPRINTS
      </p>
    </div>
  </header>
);

const AppContent = () => {
  const [records, setRecords] = useState<TravelRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  useEffect(() => {
    const data = loadRecords();
    setRecords(data);
  }, []);

  const handleSaveRecord = (record: TravelRecord) => {
    const updated = [record, ...records];
    setRecords(updated);
    saveRecords(updated);
    setIsModalOpen(false);
    setSelectedLocation('');
  };

  const handleMapClick = useCallback((locationName: string) => {
    // Check if this region already has records
    const hasVisited = records.some(r => r.region === locationName);
    
    setIsFirstVisit(!hasVisited);
    setSelectedLocation(locationName);
    setIsModalOpen(true);
  }, [records]);

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col">
      <Header />
      <Navigation />
      
      <main className="flex-1 relative">
        <Routes>
          <Route path="/" element={<InkMap records={records} onMapClick={handleMapClick} />} />
          <Route path="/list" element={<ScrollList records={records} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Conditional rendering ensures RecordModal is freshly mounted every time it opens */}
      {isModalOpen && (
        <RecordModal 
          isOpen={isModalOpen} 
          initialLocation={selectedLocation}
          isFirstVisit={isFirstVisit}
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveRecord} 
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
