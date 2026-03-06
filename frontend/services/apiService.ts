import { TravelRecord } from '../types';
import { BackendRecord, toBackendPayload, toFrontendRecord } from './recordAdapter';
import { extractApiErrorDetail } from './apiError';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const AUTH_TOKEN_KEY = 'huixing_auth_token';

export class AuthRequiredError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

const getFromStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
};

const setToStorage = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
};

const removeFromStorage = (key: string): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
};

interface AuthPayload {
  username: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

const parseErrorDetail = async (
  response: Response,
  fallbackMessage: string,
): Promise<string> => {
  try {
    const data = await response.json();
    const detail = extractApiErrorDetail(data);
    if (detail) {
      return detail;
    }
  } catch {
    // keep fallback
  }
  return fallbackMessage;
};

const requestToken = async ({ username, password }: AuthPayload): Promise<string> => {
  const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!loginResponse.ok) {
    throw new Error(await parseErrorDetail(loginResponse, 'Failed to obtain auth token'));
  }

  const loginData: TokenResponse = await loginResponse.json();
  if (!loginData.access_token) {
    throw new Error('Login succeeded but did not return access token');
  }
  return loginData.access_token;
};

export const hasAuthToken = (): boolean => Boolean(getFromStorage(AUTH_TOKEN_KEY));

export const register = async ({ username, password }: AuthPayload): Promise<void> => {
  const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!registerResponse.ok) {
    throw new Error(await parseErrorDetail(registerResponse, 'Failed to register account'));
  }
};

export const login = async ({ username, password }: AuthPayload): Promise<void> => {
  const token = await requestToken({ username, password });
  setToStorage(AUTH_TOKEN_KEY, token);
};

export const registerAndLogin = async ({ username, password }: AuthPayload): Promise<void> => {
  await register({ username, password });
  await login({ username, password });
};

export const logout = (): void => {
  removeFromStorage(AUTH_TOKEN_KEY);
};

const authorizedFetch = async (url: string, init: RequestInit = {}): Promise<Response> => {
  const token = getFromStorage(AUTH_TOKEN_KEY);
  if (!token) {
    throw new AuthRequiredError();
  }

  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    removeFromStorage(AUTH_TOKEN_KEY);
    throw new AuthRequiredError('Session expired, please login again');
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
      throw new Error(await parseErrorDetail(response, 'Image upload failed'));
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
  const response = await authorizedFetch(`${API_BASE_URL}/records/`);
  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, 'Failed to fetch records'));
  }

  const backendData: BackendRecord[] = await response.json();
  return backendData.map(toFrontendRecord);
};

export const createRecord = async (record: Omit<TravelRecord, 'id' | 'timestamp'>): Promise<TravelRecord> => {
  const payload = toBackendPayload(record);

  const response = await authorizedFetch(`${API_BASE_URL}/records/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, 'Failed to create record'));
  }

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

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, 'Failed to update record'));
  }

  const newItem: BackendRecord = await response.json();
  return toFrontendRecord(newItem);
};

export const deleteRecord = async (id: string): Promise<void> => {
  try {
    const response = await authorizedFetch(`${API_BASE_URL}/records/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(await parseErrorDetail(response, 'Failed to delete record'));
    }
  } catch (error) {
    console.error('Delete Error:', error);
    throw error;
  }
};
