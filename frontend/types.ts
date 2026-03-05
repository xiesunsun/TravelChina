export interface TravelRecord {
  id: string;

  // --- 核心兼容字段 ---
  city: string;         // 仍然保留，作为主要显示城市
  region?: string;      // 对应地图 Feature Name
  province?: string;    // 冗余字段，同上
  date: string;         // YYYY-MM-DD
  description: string;  // 对应后端的 thoughts

  // --- 图片处理 ---
  imageUrl?: string;    // 【旧】单图链接 (为了兼容现有UI，我们继续保留它，放第一张图)
  images?: string[];    // 【新】对应后端的 images 列表 (未来做轮播图可以用这个)

  // --- 新增字段 ---
  spot_name?: string;   // 【新】对应后端的 spot_name (具体景点)

  // --- 天气 ---
  // 注意：后端如果返回 'unknown'，apiService 里会转成 'sunny' 以匹配这个类型
  weather: 'sunny' | 'rainy' | 'cloudy' | 'snowy' | 'unknown';

  timestamp: number;    // 用于排序
}

export interface GeoJSONFeature {
  type: string;
  properties: {
    name: string;
    cp?: [number, number]; // Center point
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any[];
  };
}

export interface GeoJSON {
  type: string;
  features: GeoJSONFeature[];
}
