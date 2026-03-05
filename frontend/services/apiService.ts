// frontend/services/apiService.ts

import { TravelRecord } from '../types'; // 引用你原来的类型定义

// 指向你的 FastAPI 地址 (注意端口 8000)
export const API_BASE_URL = 'http://localhost:8000/api/v1';

// --- 1. 图片上传 (Upload) ---
export const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file); // 对应后端 upload.py 的字段名

    try {
        const response = await fetch(`${API_BASE_URL}/upload/`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Image upload failed');
        }

        const data = await response.json();
        return data.url; // 返回阿里云 OSS 的 URL
    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
    try {
        const uploadPromises = files.map(file => uploadImage(file));
        const urls = await Promise.all(uploadPromises);
        return urls;
    } catch (error) {
        console.error('Batch Upload Error:', error);
        throw error;
    }
};

// --- 2. 获取列表 (Read) ---
export const fetchRecords = async (): Promise<TravelRecord[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/records/`);
        if (!response.ok) throw new Error('Failed to fetch records');

        const backendData = await response.json();

        // 【核心适配器】：后端数据 -> 前端格式
        return backendData.map((item: any) => ({
            id: item.id,
            region: item.province,
            province: item.province,
            city: item.city || '未知城市',

            // 【新】把后端的新字段也带上
            spot_name: item.spot_name,

            date: item.travel_date,
            description: item.thoughts || '',
            weather: (['sunny', 'rainy', 'cloudy', 'snowy', 'unknown'].includes(item.weather) ? item.weather : 'sunny') as any,

            // 【兼容】旧 UI 用这个
            imageUrl: (item.images && item.images.length > 0) ? item.images[0] : undefined,
            // 【新】未来 UI 用这个
            images: item.images || [],

            timestamp: new Date(item.created_at).getTime()
        }));
    } catch (error) {
        console.error("Fetch API Error", error);
        return [];
    }
};

// --- 3. 新增记录 (Create) ---
export const createRecord = async (record: Omit<TravelRecord, 'id' | 'timestamp'>): Promise<TravelRecord> => {
    // 【核心适配器】：前端格式 -> 后端格式
    const payload = {
        province: record.region || record.province || '未知省份',
        city: record.city,
        spot_name: record.spot_name || record.city, // 优先使用 spot_name
        travel_date: record.date,
        weather: record.weather,
        thoughts: record.description,
        images: record.images && record.images.length > 0 ? record.images : (record.imageUrl ? [record.imageUrl] : [])
    };

    const response = await fetch(`${API_BASE_URL}/records/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to create record');

    const newItem = await response.json();

    // 把后端返回的新对象再转回前端格式，以便立刻更新 UI
    return {
        id: newItem.id,
        region: newItem.province,
        province: newItem.province,
        city: newItem.city,
        spot_name: newItem.spot_name, // 确保返回 spot_name
        date: newItem.travel_date,
        description: newItem.thoughts,
        weather: newItem.weather,
        imageUrl: (newItem.images && newItem.images.length > 0) ? newItem.images[0] : undefined,
        images: newItem.images || [],
        timestamp: new Date(newItem.created_at).getTime()
    };
};

// --- 3.5 更新记录 (Update) ---
export const updateRecord = async (id: string, record: Partial<TravelRecord>): Promise<TravelRecord> => {
    const payload = {
        province: record.region || record.province || '未知省份',
        city: record.city,
        spot_name: record.spot_name || record.city,
        travel_date: record.date,
        weather: record.weather,
        thoughts: record.description,
        images: record.images && record.images.length > 0 ? record.images : (record.imageUrl ? [record.imageUrl] : [])
    };

    const response = await fetch(`${API_BASE_URL}/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to update record');

    const newItem = await response.json();

    return {
        id: newItem.id,
        region: newItem.province,
        province: newItem.province,
        city: newItem.city,
        spot_name: newItem.spot_name,
        date: newItem.travel_date,
        description: newItem.thoughts,
        weather: newItem.weather,
        imageUrl: (newItem.images && newItem.images.length > 0) ? newItem.images[0] : undefined,
        images: newItem.images || [],
        timestamp: new Date(newItem.created_at).getTime()
    };
};

// --- 4. 删除记录 (Delete) ---
export const deleteRecord = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/records/${id}`, {
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