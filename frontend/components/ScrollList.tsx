import React, { useState } from 'react';
import { TravelRecord } from '../types';
import { WEATHER_OPTIONS } from '../constants';
import ShareCard from './ShareCard';
import { Share2 } from 'lucide-react';

interface ScrollListProps {
  records: TravelRecord[];
}

const ScrollList: React.FC<ScrollListProps> = ({ records }) => {
  const [selectedForShare, setSelectedForShare] = useState<TravelRecord | null>(null);

  const getWeatherLabel = (val: string) => WEATHER_OPTIONS.find(o => o.value === val)?.label || '未知';

  if (records.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-ashes opacity-60">
        <span className="text-6xl font-serif mb-4 opacity-30">空</span>
        <p className="font-serif tracking-widest">暂无足迹，请执笔绘行。</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full pt-28 pb-32 px-4 overflow-hidden bg-paper bg-paper-pattern">
      <div className="h-full overflow-x-auto flex items-center gap-12 px-12 pb-4 scrollbar-hide">
        
        {/* Start of Scroll Decoration */}
        <div className="shrink-0 w-8 h-[80%] bg-indigo/80 rounded-l-md shadow-2xl flex flex-col items-center justify-center border-r-4 border-wood-800 relative">
          <div className="vertical-text text-paper/50 font-serif tracking-widest text-xs">
            足迹长卷 · {new Date().getFullYear()}
          </div>
        </div>

        {records.map((record, index) => (
          <div 
            key={record.id} 
            className="group relative shrink-0 w-[300px] h-[70vh] bg-paper shadow-lg border border-indigo/10 flex flex-col overflow-hidden transition-transform hover:-translate-y-2 hover:shadow-2xl"
            style={{
              boxShadow: '10px 10px 20px rgba(0,0,0,0.1), inset 0 0 40px rgba(243, 233, 223, 0.8)'
            }}
          >
            {/* Stamp decoration */}
            <div className="absolute top-4 right-4 z-10 opacity-80 mix-blend-multiply">
              <div className="w-12 h-12 border-2 border-cinnabar rounded-sm flex items-center justify-center rotate-12">
                <span className="text-cinnabar font-serif text-xs font-bold block p-1 border border-cinnabar leading-tight">
                  {record.city.substring(0, 2)}<br/>印记
                </span>
              </div>
            </div>

            {/* Image Section */}
            <div className="h-1/2 w-full overflow-hidden relative bg-indigo/5">
              {record.imageUrl ? (
                <img 
                  src={record.imageUrl} 
                  alt={record.city} 
                  className="w-full h-full object-cover filter sepia-[0.3] contrast-[1.1] transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200/50">
                  <span className="text-ashes/30 font-serif">未存照</span>
                </div>
              )}
              
              {/* Vertical Date Line connecting image to text */}
              <div className="absolute -bottom-6 left-8 w-[1px] h-12 bg-indigo/30 z-20"></div>
            </div>

            {/* Text Section */}
            <div className="flex-1 p-6 relative">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-4xl font-calligraphy text-ink mb-1">{record.city}</span>
                  <span className="text-xs font-serif text-ashes">{record.date} · {getWeatherLabel(record.weather)}</span>
                </div>
              </div>

              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-indigo/20 to-transparent mb-4"></div>

              <p className="font-serif text-ink/80 text-sm leading-7 tracking-wide vertical-text-safe h-32 overflow-hidden text-ellipsis line-clamp-4">
                 {record.description || "此处无声胜有声..."}
              </p>

              <div className="absolute bottom-4 right-4">
                <button 
                  onClick={() => setSelectedForShare(record)}
                  className="p-2 rounded-full hover:bg-indigo/10 text-indigo transition-colors"
                  title="生成赠言"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* End of Scroll Decoration */}
        <div className="shrink-0 w-8 h-[80%] bg-indigo/80 rounded-r-md shadow-2xl border-l-4 border-wood-800"></div>
      </div>

      {selectedForShare && (
        <ShareCard 
          record={selectedForShare} 
          onClose={() => setSelectedForShare(null)} 
        />
      )}
    </div>
  );
};

export default ScrollList;