document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию при загрузке
    checkAuth();
    
    // Навигация по меню
    setupNavigation();
    
    // Отображаем имя пользователя
    displayUsername();
});

const { showLoader, showSuccess, showError, createCollection } = window;

function checkAuth() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        // Если нет токена, перенаправляем на страницу входа
        window.location.href = 'log_in_index.html?redirect=' + encodeURIComponent(window.location.pathname);
    }
}

function displayUsername() {
    const username = localStorage.getItem('userEmail');
    if (username) {
        const usernameElements = document.querySelectorAll('#usernameDisplay, .text-wrapper-3');
        usernameElements.forEach(element => {
            element.textContent = username.split('@')[0] || username;
        });
    }
}

function setupNavigation() {
    // Навигация для страницы "Мои коллекции"
    const myCollectionsLinks = document.querySelectorAll('.tabs .text-wrapper-4');
    myCollectionsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'my_collections_index.html';
        });
    });

    // Навигация для страницы "Изменить профиль"
    const profileLinks = document.querySelectorAll('.tabs-2 .text-wrapper-5:first-child');
    profileLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'my_account_index.html';
        });
    });

    // Навигация для страницы "Выход"
    const exitLinks = document.querySelectorAll('.exit .text-wrapper-4, .exit .text-wrapper-5');
    exitLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите выйти?')) {
                localStorage.removeItem('userToken');
                localStorage.removeItem('userEmail');
                window.location.href = 'home_page_index.html';
            }
        });
    });

    // Навигация для элементов коллекции
    const collectionItems = document.querySelectorAll('.item, .collection-preview');
    collectionItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'in_collection_index.html';
        });
    });

    // Навигация для кнопки "Создать коллекцию"
    // В функции setupNavigation заменяем обработчик кнопки создания коллекции
    const addCollectionBtn = document.querySelector('.add-collection');
    if (addCollectionBtn) {
        addCollectionBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {
                const token = localStorage.getItem('userToken');
                if (!token) {
                    window.location.href = 'log_in_index.html';
                    return;
                }
    
                const collectionName = prompt('Введите название коллекции:');
                if (!collectionName) return;

                const collectionTag = prompt('Введите тег коллекции (число):');
                if (!collectionTag || isNaN(collectionTag)) {
                    alert('Тег должен быть числом');
                    return;
                }
                
                const isPublic = confirm('Сделать коллекцию публичной?');
                const description = prompt('Описание коллекции:', '');
                
                showLoader(true);
                
                const response = await createCollection({
                    name: collectionName,
                    tag: parseInt(collectionTag),
                    is_public: isPublic,
                    description: description || ''
                });
                
                showSuccess('Коллекция создана!');
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                console.error('Ошибка:', error);
                showError(document.body, 'Ошибка при создании коллекции');
            } finally {
                showLoader(false);
            }
        });
    }

    // Обработка клика на логотип (без перехода на главную)
    document.querySelectorAll('.text-wrapper').forEach(logo => {
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            // Ничего не делаем - остаемся на текущей странице
        });
    });
}