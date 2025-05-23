// js/items.js
import * as api from './api.js';
import { showLoader, showError, showSuccess, formatDate, navigateTo } from './utils.js';

let currentCollectionId = null;

/**
 * Инициализирует страницу с элементами коллекции.
 * API GET /api/keeper/collection/{id}/items возвращает массив Item:
 * [{ "collection_id": ..., "title": "...", "description": "...", "category_id": ...,
 * "item_images_url": ["..."], "is_public": ..., "country": "...", "year": "...", "id": ... }]
 */
export async function initCollectionItemsPage() {
    const inCollectionSection = document.querySelector('body.in-collection');
    if (!inCollectionSection) return;

    const urlParams = new URLSearchParams(window.location.search);
    const collectionIdParam = urlParams.get('collection_id');

    if (!collectionIdParam || isNaN(parseInt(collectionIdParam))) {
        showError(document.body, 'ID коллекции не найден или некорректен в URL.');
        navigateTo('my_collections_index.html');
        return;
    }
    currentCollectionId = parseInt(collectionIdParam);

    await loadCollectionDetails(currentCollectionId);
    setupAddItemButton(currentCollectionId);
    setupItemEventListeners(inCollectionSection.querySelector('.items'));
}

async function loadCollectionDetails(collectionId) {
    const itemsContainer = document.querySelector('.in-collection .items');
    if (!itemsContainer) return;

    try {
        showLoader(true);
        const [collectionInfo, items] = await Promise.all([
            api.getCollectionById(collectionId), // Загружаем инфо о самой коллекции
            api.getCollectionItems(collectionId)  // Загружаем айтемы
        ]);

        const collectionNameEl = document.querySelector('.text-wrapper-14'); // Название коллекции в шапке
        const itemCountEl = document.querySelector('.text-wrapper-12');     // Количество элементов

        if (collectionNameEl) collectionNameEl.textContent = collectionInfo.name || 'Название коллекции';
        if (itemCountEl) itemCountEl.textContent = items.length.toString() || '0';

        itemsContainer.innerHTML = '';
        if (items.length === 0) {
            itemsContainer.innerHTML = '<p style="padding:20px; text-align:center;">В этой коллекции пока нет предметов. Добавьте первый!</p>';
            return;
        }

        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item';

            const imageUrl = (Array.isArray(item.item_images_url) && item.item_images_url.length > 0 && item.item_images_url[0] !== "not found")
                             ? item.item_images_url[0]
                             : 'img/default-item.png';
            // Предполагаем, что API может вернуть category_name или объект category с полем name
            const categoryDisplay = item.category_name || item.category?.name || item.category_id || 'не указана';

            itemElement.innerHTML = `
                <img class="mask-group" src="${imageUrl}" alt="${item.title}" onerror="this.onerror=null;this.src='img/default-item.png';" />
                <div class="text-wrapper-6">${item.title || 'Без названия'}</div>
                <div class="year">
                    <div class="text-wrapper-7">Год:</div>
                    <div class="text-wrapper-8">${item.year || 'не указан'}</div>
                </div>
                <div class="country">
                    <div class="text-wrapper-7">Страна:</div>
                    <div class="text-wrapper-8">${item.country || 'не указана'}</div>
                </div>
                <div class="category">
                    <div class="text-wrapper-7">Категория ID:</div>
                    <div class="text-wrapper-8">${categoryDisplay}</div>
                </div>
                 <div class="item-actions">
                    <button class="edit-item" data-item-id="${item.id}" title="Редактировать">✏️</button>
                    <button class="delete-item" data-item-id="${item.id}" title="Удалить">🗑️</button>
                </div>
            `;
            itemsContainer.appendChild(itemElement);
        });

    } catch (error) {
        showError(itemsContainer, 'Не удалось загрузить данные коллекции: ' + error.message);
    } finally {
        showLoader(false);
    }
}

function setupAddItemButton(collectionId) {
    const addElementBtn = document.querySelector('.add-element');
    if (addElementBtn) {
        addElementBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleAddNewItem(collectionId);
        });
    }
}

/**
 * Обрабатывает добавление нового элемента в коллекцию.
 * API POST /api/keeper/item ожидает Item:
 * { "collection_id": ..., "title": "...", "description": "...", "category_id": ...,
 * "item_images_url": ["..."], "is_public": ..., "country": "...", "year": "..." }
 */
async function handleAddNewItem(collectionId) {
    const title = prompt('Название предмета:');
    if (!title || title.trim() === '') {
         showError(document.body, 'Название предмета не может быть пустым.');
         return;
    }

    const description = prompt('Описание предмета (необязательно):', '');

    const categoryIdInput = prompt('ID категории предмета (число, например, 1):', '1');
    const categoryId = parseInt(categoryIdInput);
    if (isNaN(categoryId) || categoryId <= 0) {
        showError(document.body, 'ID категории должен быть положительным числом.');
        return;
    }

    const country = prompt('Страна (необязательно):', '');
    const year = prompt('Год (необязательно, ГГГГ):', '');
    if (year && !/^\d{4}$/.test(year) && year.trim() !== '') {
        showError(document.body, 'Год должен быть в формате ГГГГ.');
        return;
    }

    const isPublic = confirm('Сделать предмет публичным?');

    // item_images_url: ["not found"] - как указано в структуре
    const itemImages = ["not found"];

    const itemData = {
        collection_id: collectionId,
        title: title.trim(),
        description: description ? description.trim() : "",
        category_id: categoryId,
        item_images_url: itemImages,
        is_public: isPublic,
        country: country ? country.trim() : "",
        year: year ? year.trim() : ""
    };

    try {
        showLoader(true);
        await api.createCollectionItem(itemData);
        showSuccess('Предмет успешно добавлен!');
        await loadCollectionDetails(collectionId); // Обновляем список
    } catch (error) {
        showError(document.body, 'Не удалось добавить предмет: ' + error.message);
    } finally {
        showLoader(false);
    }
}

function setupItemEventListeners(itemsContainer) {
    if (!itemsContainer) return;

    itemsContainer.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const itemId = button.dataset.itemId;
        if (!itemId) return;

        if (button.classList.contains('delete-item')) {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите удалить этот предмет?')) {
                try {
                    showLoader(true);
                    await api.deleteCollectionItemApi(itemId);
                    showSuccess('Предмет успешно удален.');
                    await loadCollectionDetails(currentCollectionId);
                } catch (error) {
                    showError(document.body, 'Ошибка удаления предмета: ' + error.message);
                } finally {
                    showLoader(false);
                }
            }
        } else if (button.classList.contains('edit-item')) {
            e.preventDefault();
            await handleEditItem(itemId);
        }
    });
}

/**
 * Редактирование элемента коллекции.
 * API PUT /api/keeper/item/{id} ожидает Item (поля как при создании).
 */
async function handleEditItem(itemId) {
    try {
        showLoader(true);
        // Загружаем текущие данные айтема для предзаполнения prompt
        const item = await api.getCollectionItem(itemId); // getCollectionItem из api.js
        showLoader(false);

        const title = prompt('Название предмета:', item.title || '');
        if (title === null) return; // Пользователь нажал отмена
        if (title.trim() === '') {
            showError(document.body, 'Название предмета не может быть пустым.');
            return;
        }

        const description = prompt('Описание:', item.description || '');
        const categoryIdInput = prompt(`ID категории (тек.: ${item.category_id}):`, item.category_id || '1');
        const categoryId = parseInt(categoryIdInput);
        if (isNaN(categoryId) || categoryId <= 0) {
            showError(document.body, 'ID категории должен быть положительным числом.');
            return;
        }

        const country = prompt('Страна:', item.country || '');
        const year = prompt('Год (ГГГГ):', item.year || '');
         if (year && !/^\d{4}$/.test(year) && year.trim() !== '') {
            showError(document.body, 'Год должен быть в формате ГГГГ.');
            return;
        }
        const isPublic = confirm(`Сделать предмет публичным? (тек.: ${item.is_public ? 'Да' : 'Нет'})`);

        // item_images_url пока не редактируем через prompt, оставляем как есть или ["not found"]
        const itemImages = item.item_images_url || ["not found"];

        const itemData = {
            collection_id: item.collection_id, // Остается тем же
            title: title.trim(),
            description: description ? description.trim() : "",
            category_id: categoryId,
            item_images_url: itemImages,
            is_public: isPublic,
            country: country ? country.trim() : "",
            year: year ? year.trim() : ""
        };

        showLoader(true);
        await api.updateCollectionItem(itemId, itemData);
        showSuccess('Предмет успешно обновлен.');
        await loadCollectionDetails(currentCollectionId);
    } catch (error) {
        showError(document.body, 'Не удалось обновить предмет: ' + error.message);
    } finally {
        showLoader(false);
    }
}
