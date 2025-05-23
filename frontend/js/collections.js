// js/collections.js
import * as api from './api.js';
import { showLoader, showError, showSuccess, navigateTo } from './utils.js';

/**
 * Инициализирует страницу "Мои коллекции".
 * API GET /api/keeper/collections возвращает массив Collection:
 * [{ "name": "...", "description": "...", "category_id": ..., "is_public": ..., "id": ..., "image_url": "..." (опционально) }]
 */
export async function initCollectionsPage() {
    const myCollectionsSection = document.querySelector('body.my-collections');
    if (!myCollectionsSection) return;

    await loadUserCollections();
    setupAddCollectionButton();
}

async function loadUserCollections() {
    const collectionsContainer = document.querySelector('.my-collections .collections');
    if (!collectionsContainer) {
        console.error('Контейнер для коллекций (.my-collections .collections) не найден.');
        return;
    }
    try {
        showLoader(true);
        const collections = await api.getAllUserCollections();
        collectionsContainer.innerHTML = '';

        if (!collections || collections.length === 0) {
            collectionsContainer.innerHTML = '<p style="text-align: center; padding: 20px;">У вас пока нет коллекций. Нажмите "Создать коллекцию", чтобы добавить первую!</p>';
            return;
        }

        collections.forEach(collection => {
            const collectionElement = document.createElement('div');
            collectionElement.className = 'collection-preview';

            let imageUrl = collection.image_url || 'img/default-collection.png';
            const itemsCount = collection.items_count !== undefined ? collection.items_count : (Array.isArray(collection.items) ? collection.items.length : 0);

            collectionElement.innerHTML = `
                <img class="mask-group" src="${imageUrl}" alt="${collection.name || 'Коллекция'}" onerror="this.onerror=null;this.src='img/default-collection.png';" />
                <div class="text-wrapper-6">${collection.name || 'Без названия'}</div>
                <div class="number-of-elements">
                    <div class="text-wrapper-7">Количество лотов:</div>
                    <div class="text-wrapper-7">${itemsCount}</div>
                </div>
                `;
            collectionElement.addEventListener('click', () => {
                navigateTo('in_collection_index.html', { collection_id: collection.id });
            });
            collectionsContainer.appendChild(collectionElement);
        });
    } catch (error) {
        showError(collectionsContainer, 'Не удалось загрузить коллекции: ' + error.message);
    } finally {
        showLoader(false);
    }
}

function setupAddCollectionButton() {
    const addCollectionBtn = document.querySelector('.add-collection');
    if (addCollectionBtn) {
        addCollectionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleCreateNewCollection();
        });
    }
}

/**
 * Обрабатывает создание новой коллекции.
 * API POST /api/keeper/collection ожидает Collection:
 * { "name": "...", "description": "...", "category_id": ..., "is_public": ... }
 */
async function handleCreateNewCollection() {
    const name = prompt('Введите название коллекции:');
    if (!name || name.trim() === '') {
        showError(document.body, 'Название коллекции не может быть пустым.');
        return;
    }

    const description = prompt('Описание коллекции (необязательно):', '');

    const categoryIdInput = prompt('ID категории (число, например, 1):', '1');
    const categoryId = parseInt(categoryIdInput);
    if (isNaN(categoryId) || categoryId <= 0) {
        showError(document.body, 'ID категории должен быть положительным числом.');
        return;
    }

    const isPublic = confirm('Сделать коллекцию публичной?');

    const collectionData = {
        name: name.trim(),
        description: description ? description.trim() : "", // Пустая строка если null или только пробелы
        category_id: categoryId,
        is_public: isPublic,
    };

    try {
        showLoader(true);
        await api.createCollection(collectionData);
        showSuccess('Коллекция успешно создана!');
        await loadUserCollections(); // Обновляем список
    } catch (error) {
        showError(document.body, 'Не удалось создать коллекцию: ' + error.message);
    } finally {
        showLoader(false);
    }
}
