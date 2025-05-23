// js/navigation.js
import { navigateTo, displayUsername } from './utils.js';
// logoutUser будет передаваться в setupGlobalNavigation из main.js, чтобы избежать циклической зависимости с auth.js

/**
 * Настраивает глобальные элементы навигации (логотип, основные ссылки меню, выход).
 * @param {Function} logoutHandler - Функция для выхода пользователя (обычно auth.logoutUser).
 */
export function setupGlobalNavigation(logoutHandler) {
    // Отображение имени пользователя (если есть в localStorage)
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        displayUsername(userEmail);
    }

    // Обработчик клика по логотипу
    const logoElements = document.querySelectorAll('.HEADING .view .text-wrapper, .view .text-wrapper-6, .HEADING .view'); // Расширенный селектор для лого
    logoElements.forEach(logo => {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            const token = localStorage.getItem('userToken');
            if (token) {
                navigateTo('my_collections_index.html');
            } else {
                navigateTo('home_page_index.html');
            }
        });
    });

    // Ссылки "Мои коллекции"
    const myCollectionsLinks = document.querySelectorAll('.tabs .text-wrapper-4');
    myCollectionsLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('my_collections_index.html');
        });
    });

    // Ссылки "Изменить профиль"
    const profileLinks = document.querySelectorAll('.tabs-2 .text-wrapper-5:not(.exit .text-wrapper-5)'); // Исключаем кнопку Выход
    profileLinks.forEach(link => {
        // Убедимся, что это действительно ссылка на профиль, а не "Выход" с тем же классом
        if (link.textContent.trim().toLowerCase().includes('изменить профиль')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('my_account_index.html');
            });
        }
    });

    // Кнопки/ссылки "Выход"
    // Селекторы могут быть разными: .exit .text-wrapper-4, .exit .text-wrapper-5, #logoutBtn, .logout-btn
    const logoutButtons = document.querySelectorAll('.exit .text-wrapper-4, .exit .text-wrapper-5, #logoutBtn, .logout-btn, .exit');
    logoutButtons.forEach(btn => {
        // Проверяем, что это действительно кнопка выхода, а не родительский .tabs-2 .exit
        if (btn.classList.contains('exit') && btn.children.length > 0 &&
            (btn.children[0].classList.contains('text-wrapper-5') || btn.children[0].classList.contains('text-wrapper-4'))) {
            // Это контейнер .exit, вешаем обработчик на него или на текст внутри
             btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (logoutHandler) logoutHandler();
            });
        } else if (!btn.classList.contains('exit') || (btn.classList.contains('exit') && btn.children.length === 0) ) {
            // Это сама текстовая кнопка или кнопка с id/class
             btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (logoutHandler) logoutHandler();
            });
        }
    });


    // Навигация на страницу входа и регистрации с главной страницы (home_page_index.html)
    if (document.body.classList.contains('home') || window.location.pathname.includes('home_page_index.html')) {
        const loginBtnHome = document.getElementById('loginBtn');
        const registerBtnHome = document.getElementById('registerBtn');

        if (loginBtnHome) {
            loginBtnHome.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('log_in_index.html');
            });
        }
        if (registerBtnHome) {
            registerBtnHome.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('sign_up_index.html');
            });
        }
    }

    // Навигация со страницы входа на страницу регистрации
    if (document.body.classList.contains('login') || window.location.pathname.includes('log_in_index.html')) {
        const createAccountLink = document.querySelector('.frame .text-wrapper-2'); // "Создать аккаунт"
        if (createAccountLink) {
            createAccountLink.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('sign_up_index.html');
            });
        }
    }

    // Навигация со страницы регистрации на страницу входа
    if (document.body.classList.contains('sign-up') || window.location.pathname.includes('sign_up_index.html')) {
        const loginLinkSignUp = document.querySelector('.p .text-wrapper-2'); // "Войти"
        if (loginLinkSignUp) {
            loginLinkSignUp.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('log_in_index.html');
            });
        }
    }
}
