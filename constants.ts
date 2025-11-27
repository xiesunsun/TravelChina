
export const COLORS = {
  paper: '#F3E9DF',
  ink: '#2B2B2B',
  cinnabar: '#C02C38',
  indigo: '#475164',
  gold: '#EEDEB0',
  // 青绿山水配色
  mineralGreen: '#408376', // 石绿
  mineralBlue: '#284E68',  // 石青
  paleGreen: '#9DB6A8',    // 豆绿
  mist: 'rgba(243, 233, 223, 0.8)',
};

export const WEATHER_OPTIONS = [
  { value: 'sunny', label: '晴方好', icon: '☀️' },
  { value: 'rainy', label: '雨亦奇', icon: '🌧️' },
  { value: 'cloudy', label: '云深处', icon: '☁️' },
  { value: 'snowy', label: '雪初霁', icon: '❄️' },
];

// Fallback or utility to find coordinates for major cities if GeoJSON lookups fail
// Using Aliyun DataV CDN for reliable China GeoJSON
export const CHINA_GEOJSON_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';
