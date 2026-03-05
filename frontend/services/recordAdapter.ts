import { TravelRecord } from '../types';

export interface BackendRecord {
  id: string;
  province: string;
  city?: string | null;
  spot_name?: string | null;
  travel_date: string;
  weather?: string | null;
  thoughts?: string | null;
  images?: string[] | null;
  created_at: string;
}

export interface BackendRecordPayload {
  province: string;
  city?: string;
  spot_name?: string;
  travel_date: string;
  weather: TravelRecord['weather'];
  thoughts: string;
  images: string[];
}

const allowedWeather = new Set(['sunny', 'rainy', 'cloudy', 'snowy', 'unknown']);

function normalizeWeather(input?: string | null): TravelRecord['weather'] {
  return allowedWeather.has(input ?? '')
    ? (input as TravelRecord['weather'])
    : 'sunny';
}

export function toFrontendRecord(item: BackendRecord): TravelRecord {
  const images = item.images ?? [];
  return {
    id: item.id,
    region: item.province,
    province: item.province,
    city: item.city || '未知城市',
    spot_name: item.spot_name || undefined,
    date: item.travel_date,
    description: item.thoughts || '',
    weather: normalizeWeather(item.weather),
    imageUrl: images.length > 0 ? images[0] : undefined,
    images,
    timestamp: new Date(item.created_at).getTime(),
  };
}

export function toBackendPayload(record: Partial<TravelRecord>): BackendRecordPayload {
  const images =
    record.images && record.images.length > 0
      ? record.images
      : record.imageUrl
        ? [record.imageUrl]
        : [];

  return {
    province: record.region || record.province || '未知省份',
    city: record.city,
    spot_name: record.spot_name || record.city,
    travel_date: record.date || new Date().toISOString().split('T')[0],
    weather: (record.weather || 'unknown') as TravelRecord['weather'],
    thoughts: record.description || '',
    images,
  };
}
