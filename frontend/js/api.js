// js/api.js
import { API_URL, APP_ID } from './config.js';
import { showLoader, showError } from './utils.js';

// ... (handleResponse и request остаются такими же, как в js_api_v3)
async function handleResponse(response) {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            throw new Error(response.statusText || `Ошибка сервера: ${response.status}`);
        }
        throw new Error(errorData.message || errorData.error || `Ошибка сервера: ${response.status}`);
    }
    if (response.status === 204) {
        return {};
    }
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
        return {};
    }
    try {
        return await response.json();
    } catch (e) {
        console.warn('API response was OK, but JSON parsing failed.', e);
        return {};
    }
}

async function request(endpoint, method, body = null, isFormData = false) {
    const token = localStorage.getItem('userToken');
    const headers = {};

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: method,
        headers: headers,
    };

    if (body) {
        config.body = isFormData ? body : JSON.stringify(body);
    }

    showLoader(true);
    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        return await handleResponse(response);
    } catch (error) {
        console.error(`Ошибка API запроса к ${endpoint}:`, error.message);
        showError(null, error.message || 'Произошла сетевая ошибка или ошибка обработки ответа.');
        throw error;
    } finally {
        showLoader(false);
    }
}


// --- Auth ---
export const loginUser = (email, password) => request('/auth/login', 'POST', { email, password, app_id: APP_ID });
export const registerUser = (username, email, password) => request('/auth/register', 'POST', {
    app_id: APP_ID,
    username,
    email,
    password
});

// --- User Profile ---
export const getUserProfile = () => request('/keeper/profile', 'GET');

// Обновленная функция updateUserProfile
// userData должен приходить уже с app_id и всеми полями, которые нужно обновить.
// Пароль включается только если он действительно есть в userData.
export const updateUserProfile = (userData) => {
    const payload = { ...userData }; // userData уже содержит app_id

    // Если password не предоставлен или пустой, не отправляем его.
    // API ожидает поле password только если оно меняется.
    if (!payload.password) {
        delete payload.password;
    }
    // Убедимся, что birth_date в формате ДД-ММ-ГГГГ если передается
    if (payload.birth_date && !/^\d{2}-\d{2}-\d{4}$/.test(payload.birth_date)) {
        console.warn('Birth date for API is not in DD-MM-YYYY format. Attempting to send as is:', payload.birth_date);
    }

    return request('/keeper/user', 'PUT', payload);
};
export const uploadUserAvatar = (formData) => request('/keeper/user/avatar', 'POST', formData, true);

// --- Collections ---
export const getAllUserCollections = () => request('/keeper/collections', 'GET');
export const getCollectionById = (collectionId) => request(`/keeper/collection/${collectionId}`, 'GET');
export const createCollection = (collectionData) => request('/keeper/collection', 'POST', collectionData);
export const updateCollection = (collectionDataWithId) => request('/keeper/collection', 'PUT', collectionDataWithId);
export const deleteCollection = (collectionId) => request(`/keeper/collection/${collectionId}`, 'DELETE');

// --- Collection Items ---
export const getCollectionItems = (collectionId) => request(`/keeper/collection/${collectionId}/items`, 'GET');
export const createCollectionItem = (itemData) => request('/keeper/item', 'POST', itemData);
export const getCollectionItem = (itemId) => request(`/keeper/item/${itemId}`, 'GET');
export const updateCollectionItem = (itemId, itemData) => request(`/keeper/item/${itemId}`, 'PUT', itemData);
export const deleteCollectionItemApi = (itemId) => request(`/keeper/item/${itemId}`, 'DELETE');
