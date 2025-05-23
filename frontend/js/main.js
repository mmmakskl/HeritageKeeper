// js/main.js
import { initializeAuthForms, checkAuthStatus, logoutUser } from './auth.js';
import { initProfilePage } from './profile.js';
import { initCollectionsPage } from './collections.js';
import { initCollectionItemsPage } from './items.js';
import { setupGlobalNavigation } from './navigation.js';
import { displayUsername } from './utils.js';


document.addEventListener('DOMContentLoaded', () => {
    // 1. Настройка глобальной навигации (лого, основные ссылки, кнопка выхода)
    // Передаем logoutUser из auth.js в setupGlobalNavigation
    setupGlobalNavigation(logoutUser);

    // 2. Проверка статуса аутентификации
    // Эта функция также обрабатывает перенаправления и отображает имя пользователя
    const isAuthenticated = checkAuthStatus(); // checkAuthStatus теперь сама обрабатывает редиректы и отображает имя

    // 3. Инициализация специфичных для страницы модулей
    const path = window.location.pathname.split('/').pop();

    if (!isAuthenticated) {
        // Для неаутентифицированных пользователей инициализируем только формы входа/регистрации
        if (path === 'log_in_index.html' || path === 'sign_up_index.html') {
            initializeAuthForms();
        }
        // Для home_page_index.html дополнительных инициализаций не требуется,
        // кроме setupGlobalNavigation, которая уже вызвана.
    } else {
        // Для аутентифицированных пользователей
        // Отображаем имя пользователя (на случай если checkAuthStatus не успел или для подстраховки)
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
            displayUsername(userEmail);
        }

        switch (path) {
            case 'my_account_index.html':
                initProfilePage();
                break;
            case 'my_collections_index.html':
                initCollectionsPage();
                break;
            case 'in_collection_index.html':
                initCollectionItemsPage();
                break;
            // home_page_index.html и страницы входа/регистрации уже обработаны
            // или не требуют специфической инициализации для аутентифицированных пользователей
            // (checkAuthStatus перенаправит с log_in/sign_up если пользователь уже вошел)
        }
    }

    // Скрываем формы с POST method="POST", если JS включен (как в оригинале)
    // Это лучше делать через CSS (например, класс no-js), но сохраним логику для соответствия
    const formsToHide = document.querySelectorAll('form[method="POST"]');
    formsToHide.forEach(form => {
        // Проверяем, не является ли это формой входа или регистрации, которые должны быть видимы
        if (!form.closest('.login .div') && !form.closest('.sign-up .div')) {
             // И дополнительно, не является ли это формой поиска или фильтрации
            if (!form.id || (!form.id.toLowerCase().includes('search') && !form.id.toLowerCase().includes('filter'))) {
                form.style.display = 'none';
            }
        }
    });
});
