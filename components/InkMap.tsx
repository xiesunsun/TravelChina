
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { TravelRecord } from '../types';
import { COLORS, CHINA_GEOJSON_URL } from '../constants';

interface InkMapProps {
  records: TravelRecord[];
  onMapClick?: (name: string) => void;
}

const InkMap: React.FC<InkMapProps> = ({ records, onMapClick }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [geoJsonLoaded, setGeoJsonLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref for callback to avoid re-binding events or re-running effects
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Initialize Chart - Run ONCE
  useEffect(() => {
    if (!chartRef.current) return;

    // Check if instance already exists to prevent double initialization
    if (chartInstance.current) return;

    chartInstance.current = echarts.init(chartRef.current, null, {
      renderer: 'canvas',
    });

    const fetchMap = async () => {
      try {
        // Check if map is already registered to avoid re-fetching
        if (echarts.getMap('china')) {
           setGeoJsonLoaded(true);
           setLoading(false);
           return;
        }

        const response = await fetch(CHINA_GEOJSON_URL);
        if (!response.ok) throw new Error('Could not load map data');
        const chinaJson = await response.json();
        
        echarts.registerMap('china', chinaJson);
        setGeoJsonLoaded(true);
      } catch (error) {
        console.error("Failed to load map data:", error);
        setError("地图画卷展开失败，请检查网络");
      } finally {
        setLoading(false);
      }
    };

    fetchMap();

    // Click handler for interactions
    chartInstance.current.on('click', (params) => {
      if (params.name && onMapClickRef.current) {
        onMapClickRef.current(params.name);
      }
    });

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Update Chart Options when data changes
  useEffect(() => {
    if (!chartInstance.current || !geoJsonLoaded) return;

    // 1. Identify Visited Regions for Ink Effect
    const visitedRegionsSet = new Set<string>();
    records.forEach(r => {
      if (r.region) visitedRegionsSet.add(r.region);
    });

    // Create custom regions config for ECharts - The "Blue-Green Landscape" Style
    const regionsConfig = Array.from(visitedRegionsSet).map(regionName => ({
      name: regionName,
      itemStyle: {
        // Simulate ink wash gradient: Deep Mineral Blue/Green -> Lighter Pale Green
        areaColor: new echarts.graphic.LinearGradient(0, 0, 0.5, 1, [
          { offset: 0, color: COLORS.mineralBlue }, // Top-Left: Mountain Peak (Dark)
          { offset: 0.5, color: COLORS.mineralGreen }, // Middle: Forest (Green)
          { offset: 1, color: COLORS.paleGreen }    // Bottom-Right: Mist (Light)
        ]),
        opacity: 0.85,
        // The shadow mimics the water bleeding into Xuan paper
        shadowBlur: 12,
        shadowColor: 'rgba(64, 131, 118, 0.4)', // Soft green glow
        shadowOffsetX: 3,
        shadowOffsetY: 3,
        borderColor: COLORS.mineralBlue,
        borderWidth: 1
      },
      label: {
        show: true,
        color: COLORS.paper, // White text stands out on dark green
        fontFamily: '"Ma Shan Zheng", cursive',
        textShadowColor: COLORS.ink,
        textShadowBlur: 2
      }
    }));

    // 2. Coordinate mapping for scatter points (Stamps)
    const cityCoords: Record<string, [number, number]> = {
      '北京': [116.40, 39.90], 'Beijing': [116.40, 39.90],
      '上海': [121.47, 31.23], 'Shanghai': [121.47, 31.23],
      '西安': [108.93, 34.34], 'Xian': [108.93, 34.34],
      '成都': [104.06, 30.67], 'Chengdu': [104.06, 30.67],
      '杭州': [120.15, 30.28], 'Hangzhou': [120.15, 30.28],
      '广州': [113.26, 23.12], 'Guangzhou': [113.26, 23.12],
      '深圳': [114.05, 22.54], 'Shenzhen': [114.05, 22.54],
      '武汉': [114.30, 30.59], 'Wuhan': [114.30, 30.59],
      '重庆': [106.55, 29.57], 'Chongqing': [106.55, 29.57],
      '南京': [118.79, 32.06], 'Nanjing': [118.79, 32.06],
      '拉萨': [91.14, 29.65], 'Lhasa': [91.14, 29.65],
      '昆明': [102.83, 24.88], 'Kunming': [102.83, 24.88],
      '天津': [117.20, 39.08],
      '沈阳': [123.43, 41.80],
      '哈尔滨': [126.53, 45.80],
      '大连': [121.61, 38.91],
      '青岛': [120.38, 36.06],
      '济南': [117.00, 36.65],
      '郑州': [113.62, 34.74],
      '长沙': [112.93, 28.22],
      '福州': [119.29, 26.07],
      '厦门': [118.08, 24.47],
      '南宁': [108.36, 22.81],
      '海口': [110.19, 20.04],
      '三亚': [109.51, 18.25],
      '贵阳': [106.63, 26.64],
      '兰州': [103.83, 36.06],
      '西宁': [101.77, 36.61],
      '银川': [106.23, 38.48],
      '乌鲁木齐': [87.61, 43.82],
      '呼和浩特': [111.74, 40.84],
      '太原': [112.54, 37.87],
      '石家庄': [114.51, 38.04],
      '合肥': [117.22, 31.81],
      '南昌': [115.85, 28.68]
    };

    const scatterData = records
      .filter(r => cityCoords[r.city])
      .map(r => ({
        name: r.city,
        value: [...cityCoords[r.city], 10], // [lng, lat, size]
      }));

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(243, 233, 223, 0.95)',
        borderColor: COLORS.mineralGreen,
        borderWidth: 1,
        textStyle: {
          color: COLORS.ink,
          fontFamily: '"Noto Serif SC", serif'
        },
        formatter: (params: any) => {
          if (params.seriesType === 'effectScatter') {
            return `<div style="text-align:center; padding: 6px;">
              <strong style="font-size:16px; font-family: 'Ma Shan Zheng', cursive; color: ${COLORS.cinnabar};">${params.name}</strong><br/>
              <span style="font-size:12px; color:#666; font-family: 'Noto Serif SC', serif;">山河已阅</span>
            </div>`;
          }
          return `<div style="padding: 4px; font-family: 'Noto Serif SC', serif;">${params.name}</div>`;
        }
      },
      geo: {
        map: 'china',
        roam: true,
        center: [104.114129, 37.550339],
        zoom: 1.25,
        scaleLimit: {
          min: 1,
          max: 4
        },
        label: {
          show: false,
        },
        itemStyle: {
          // Unvisited areas: "White Sketch" style (Bai Miao)
          areaColor: 'rgba(243, 233, 223, 0.05)', 
          borderColor: 'rgba(127, 153, 163, 0.4)', // Faint contour
          borderWidth: 1,
          shadowColor: 'rgba(0,0,0,0)',
          shadowBlur: 0,
        },
        emphasis: {
          itemStyle: {
            areaColor: COLORS.gold, // Sunlight hit
            shadowBlur: 20,
            shadowColor: 'rgba(238, 222, 176, 0.5)'
          },
          label: {
             show: true,
             color: COLORS.ink,
             fontFamily: '"Noto Serif SC", serif'
          }
        },
        select: {
          itemStyle: {
            areaColor: COLORS.gold
          }
        },
        regions: regionsConfig 
      },
      series: [
        {
          name: 'Stamps',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: scatterData,
          symbol: 'rect', // Square seal shape
          symbolSize: 20,
          showEffectOn: 'render',
          rippleEffect: {
            brushType: 'fill', // Filled ripple looks more like water/ink spreading
            scale: 4,
            color: 'rgba(192, 44, 56, 0.2)', // Very faint red ripple
            period: 6 // Slower animation
          },
          label: {
            formatter: '{b}',
            position: 'right',
            show: true,
            fontFamily: '"Noto Serif SC", serif',
            color: COLORS.ink,
            fontSize: 12,
            backgroundColor: 'rgba(243,233,223,0.8)',
            padding: [4, 6],
            borderRadius: 2,
            borderColor: 'rgba(192, 44, 56, 0.3)',
            borderWidth: 1
          },
          itemStyle: {
            color: COLORS.cinnabar,
            shadowBlur: 2,
            shadowColor: COLORS.ink,
            opacity: 1
          },
          zlevel: 2
        }
      ]
    };

    chartInstance.current.setOption(option);

  }, [records, geoJsonLoaded]);

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      {loading && (
        <div className="absolute z-10 flex flex-col items-center animate-pulse">
           <div className="w-12 h-12 border-4 border-double border-indigo/30 rounded-full animate-spin mb-4 border-t-cinnabar"></div>
           <span className="font-serif text-indigo text-xl tracking-widest font-bold">画卷铺展中...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute z-10 flex flex-col items-center text-cinnabar">
           <span className="font-serif text-xl mb-2">⚠</span>
           <span className="font-serif tracking-widest">{error}</span>
        </div>
      )}

      <div ref={chartRef} className="w-full h-full opacity-0 transition-opacity duration-1000 cursor-pointer" style={{ opacity: geoJsonLoaded ? 1 : 0 }} />
      
      {/* Legend / Stats overlay - Improved Layout */}
      {geoJsonLoaded && (
        <div className="absolute bottom-8 right-8 pointer-events-none transition-all duration-1000 animate-fade-in-up">
           <div className="bg-paper/80 border-2 border-double border-indigo/20 px-4 py-5 font-serif backdrop-blur-sm shadow-md flex flex-row-reverse items-start gap-4 rounded-sm">
             
             {/* Main Counter (Vertical Text) */}
             <div className="vertical-text text-xl font-calligraphy text-ink h-24 tracking-widest border-l border-indigo/10 pl-2 ml-1">
                已阅 {records.length} 处山河
             </div>

             {/* Legend Item */}
             <div className="flex flex-col items-center justify-end h-24 pb-1">
               <div className="w-4 h-4 bg-gradient-to-br from-[#284E68] to-[#9DB6A8] rounded-full shadow-sm mb-2 border border-white/50"></div>
               <span className="vertical-text text-xs text-indigo/70 font-bold tracking-widest">青绿 · 足迹</span>
             </div>

           </div>
        </div>
      )}
    </div>
  );
};

export default InkMap;
