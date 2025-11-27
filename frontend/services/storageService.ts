import { TravelRecord } from '../types';

const STORAGE_KEY = 'huixing_zhonghua_records';

export const loadRecords = (): TravelRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load records", e);
    return [];
  }
};

export const saveRecords = (records: TravelRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("Failed to save records", e);
  }
};