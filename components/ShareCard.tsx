import React, { useRef, useState } from 'react';
import { TravelRecord } from '../types';
import { X, Download, Loader2 } from 'lucide-react';
import { WEATHER_OPTIONS } from '../constants';

declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
  }
}

interface ShareCardProps {
  record: TravelRecord;
  onClose: () => void;
}

const ShareCard: React.FC<ShareCardProps> = ({ record, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current || !window.html2canvas) {
      alert("生成组件未就绪");
      return;
    }
    setGenerating(true);
    try {
      const canvas = await window.html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#F3E9DF', // Force paper color
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `绘行中华_${record.city}_${record.date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert("生成图片失败，请重试");
    } finally {
      setGenerating(false);
    }
  };

  const weatherLabel = WEATHER_OPTIONS.find(o => o.value === record.weather)?.label;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white"
      >
        <X size={32} />
      </button>

      <div className="flex flex-col items-center gap-6">
        {/* The Card to be Captured */}
        <div 
          ref={cardRef} 
          className="w-[320px] bg-paper relative shadow-2xl overflow-hidden"
          style={{
             backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjRjNFOURGIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNkYWQyYzciIG9wYWNpdHk9IjAuNSIvPgo8L3N2Zz4=')",
             padding: '24px'
          }}
        >
          {/* Border Frame */}
          <div className="absolute inset-2 border-2 border-double border-indigo/20 pointer-events-none"></div>

          {/* Header */}
          <div className="flex justify-between items-end mb-6 pt-2 px-2">
            <h1 className="text-3xl font-calligraphy text-ink">{record.city}</h1>
            <div className="flex flex-col items-end">
              <span className="text-xs font-serif text-cinnabar border border-cinnabar px-1 py-0.5 rounded-sm">
                足迹 · 珍藏
              </span>
            </div>
          </div>

          {/* Photo Area */}
          <div className="w-full aspect-square bg-gray-200 mb-6 relative overflow-hidden p-1 border border-indigo/10 shadow-inner">
             {record.imageUrl ? (
               <img src={record.imageUrl} className="w-full h-full object-cover filter sepia-[0.3]" alt="Memory" />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-paper text-ashes text-sm font-serif">
                 未存影像
               </div>
             )}
             {/* "Torn Paper" effect bottom mask via CSS could go here, keeping it simple for canvas compatibility */}
          </div>

          {/* Description Vertical */}
          <div className="flex gap-4 min-h-[120px]">
             <div className="w-[1px] bg-indigo/20 h-full mx-2"></div>
             <div className="flex-1 font-serif text-sm text-ink/80 leading-7 vertical-text text-left max-h-[150px]">
                {record.description || "暂无随笔..."}
             </div>
             
             {/* Stamp & Date */}
             <div className="flex flex-col justify-end items-center gap-2 pb-2">
                <span className="text-[10px] font-serif text-ashes vertical-text">{record.date}</span>
                <span className="text-[10px] font-serif text-ashes vertical-text">{weatherLabel}</span>
                <div className="w-8 h-8 bg-cinnabar/90 rounded-sm text-paper text-[10px] flex items-center justify-center font-serif shadow-sm mt-2 border border-dashed border-paper/50">
                  {record.city.substring(0,1)}<br/>印
                </div>
             </div>
          </div>
          
          <div className="text-center mt-6 pt-4 border-t border-indigo/10">
             <p className="text-[10px] text-ashes/50 font-serif tracking-[0.3em]">HUIXING ZHONGHUA</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDownload}
          disabled={generating}
          className="flex items-center gap-2 bg-cinnabar text-paper px-6 py-3 rounded-full font-bold shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {generating ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
          <span>保存锦书</span>
        </button>
      </div>
    </div>
  );
};

export default ShareCard;