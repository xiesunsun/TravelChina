import { describe, expect, it } from 'vitest';
import { toBackendPayload, toFrontendRecord } from './recordAdapter';

describe('record adapter', () => {
  it('maps backend record into frontend shape', () => {
    const record = toFrontendRecord({
      id: '1',
      province: '浙江省',
      city: '杭州市',
      spot_name: '西湖',
      travel_date: '2026-03-05',
      weather: 'rainy',
      thoughts: '很好',
      images: ['https://img/1.jpg'],
      created_at: '2026-03-05T00:00:00Z',
    });

    expect(record.region).toBe('浙江省');
    expect(record.imageUrl).toBe('https://img/1.jpg');
    expect(record.weather).toBe('rainy');
    expect(record.description).toBe('很好');
  });

  it('normalizes unexpected weather to sunny', () => {
    const record = toFrontendRecord({
      id: '2',
      province: '江苏省',
      city: null,
      spot_name: null,
      travel_date: '2026-03-05',
      weather: 'windy',
      thoughts: null,
      images: null,
      created_at: '2026-03-05T00:00:00Z',
    });

    expect(record.city).toBe('未知城市');
    expect(record.weather).toBe('sunny');
    expect(record.images).toEqual([]);
  });

  it('maps frontend record into backend payload', () => {
    const payload = toBackendPayload({
      region: '四川省',
      city: '成都市',
      date: '2026-03-05',
      weather: 'cloudy',
      description: '宽窄巷子',
      imageUrl: 'https://img/2.jpg',
    });

    expect(payload.province).toBe('四川省');
    expect(payload.spot_name).toBe('成都市');
    expect(payload.images).toEqual(['https://img/2.jpg']);
    expect(payload.thoughts).toBe('宽窄巷子');
  });
});
