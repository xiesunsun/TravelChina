
export interface TravelRecord {
  id: string;
  city: string; // The display name or specific city entered by user
  region?: string; // The map feature name (e.g., Province name "Sichuan")
  province?: string;
  date: string; // ISO string
  description: string;
  imageUrl?: string;
  weather: 'sunny' | 'rainy' | 'cloudy' | 'snowy';
  timestamp: number;
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
