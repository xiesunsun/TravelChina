import { TravelRecord } from '../types';
import { BackendRecord, toBackendPayload, toFrontendRecord } from './recordAdapter';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const AUTH_TOKEN_KEY = 'huixing_auth_token';
const AUTH_USERNAME_KEY = 'huixing_auth_username';
const AUTH_PASSWORD_KEY = 'huixing_auth_password';

const getFromStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
};

const setToStorage = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
};

const randomId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  }
  return `${Date.now()}`;
};

const ensureAuthToken = async (): Promise<string> => {
  const cachedToken = getFromStorage(AUTH_TOKEN_KEY);
  if (cachedToken) return cachedToken;

  let username = getFromStorage(AUTH_USERNAME_KEY);
  let password = getFromStorage(AUTH_PASSWORD_KEY);

  if (!username) {
    username = `traveler_${randomId()}`;
    setToStorage(AUTH_USERNAME_KEY, username);
  }
  if (!password) {
    password = `pass_${randomId()}!`;
    setToStorage(AUTH_PASSWORD_KEY, password);
  }

  const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!registerResponse.ok && registerResponse.status !== 409) {
    throw new Error('Failed to bootstrap auth identity');
  }

  const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!loginResponse.ok) {
    throw new Error('Failed to obtain auth token');
  }

  const loginData = await loginResponse.json();
  const token = loginData.access_token as string;
  setToStorage(AUTH_TOKEN_KEY, token);
  return token;
};

const authorizedFetch = async (url: string, init: RequestInit = {}): Promise<Response> => {
  const token = await ensureAuthToken();
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    const refreshed = await ensureAuthToken();
    headers.set('Authorization', `Bearer ${refreshed}`);
    return fetch(url, { ...init, headers });
  }

  return response;
};

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await authorizedFetch(`${API_BASE_URL}/upload/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  try {
    return await Promise.all(files.map((file) => uploadImage(file)));
  } catch (error) {
    console.error('Batch Upload Error:', error);
    throw error;
  }
};

export const fetchRecords = async (): Promise<TravelRecord[]> => {
  try {
    const response = await authorizedFetch(`${API_BASE_URL}/records/`);
    if (!response.ok) throw new Error('Failed to fetch records');

    const backendData: BackendRecord[] = await response.json();
    return backendData.map(toFrontendRecord);
  } catch (error) {
    console.error('Fetch API Error', error);
    return [];
  }
};

export const createRecord = async (record: Omit<TravelRecord, 'id' | 'timestamp'>): Promise<TravelRecord> => {
  const payload = toBackendPayload(record);

  const response = await authorizedFetch(`${API_BASE_URL}/records/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Failed to create record');

  const newItem: BackendRecord = await response.json();
  return toFrontendRecord(newItem);
};

export const updateRecord = async (id: string, record: Partial<TravelRecord>): Promise<TravelRecord> => {
  const payload = toBackendPayload(record);

  const response = await authorizedFetch(`${API_BASE_URL}/records/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Failed to update record');

  const newItem: BackendRecord = await response.json();
  return toFrontendRecord(newItem);
};

export const deleteRecord = async (id: string): Promise<void> => {
  try {
    const response = await authorizedFetch(`${API_BASE_URL}/records/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete record');
    }
  } catch (error) {
    console.error('Delete Error:', error);
    throw error;
  }
};
