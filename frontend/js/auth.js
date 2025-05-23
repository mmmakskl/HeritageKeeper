// js/auth.js
import { APP_ID } from './config.js';
import * as api from './api.js';
import { isValidEmail, showError, showSuccess, navigateTo, displayUsername } from './utils.js';

/**
 * Инициализирует формы входа и регистрации.
 */
export function initializeAuthForms() {
    const loginForm = document.getElementById('loginForm') || document.querySelector('.login-form');
    const signupForm = document.querySelector('.sign-up .div-2');

    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    if (emailFromUrl && document.querySelector('.input-field[type="email"]')) {
        document.querySelector('.input-field[type="email"]').value = decodeURIComponent(emailFromUrl);
    }
    // Пароль обычно не передают в URL для автозаполнения из соображений безопасности

    if (loginForm) {
        const loginBtn = loginForm.querySelector('button[type="submit"].submit-btn') || loginForm.querySelector('.frame-2 .text-wrapper-4');
        const loginHandler = async (e) => {
            e.preventDefault();
            const form = e.target.closest('form') || loginForm;
            const emailInput = form.querySelector('input[type="email"]');
            const passwordInput = form.querySelector('input[type="password"]');

            if (!emailInput || !passwordInput) {
                 showError(form, 'Ошибка формы: не найдены поля email или пароля.');
                 return;
            }
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!validateEmailField(email, emailInput)) return;
            if (!validatePasswordField(password, passwordInput, false)) return; // Не проверяем длину при логине

            try {
                // API для логина ожидает { email, password, app_id }
                const data = await api.loginUser(email, password); // app_id добавляется в api.loginUser
                if (!data.token) {
                    throw new Error('Не удалось получить токен авторизации.');
                }
                localStorage.setItem('userToken', data.token);
                // Сохраняем email или username, если API его возвращает при логине
                // Предположим, API возвращает объект пользователя с полем email или username
                const userIdentifier = data.user?.email || data.user?.username || email;
                localStorage.setItem('userEmail', userIdentifier);
                displayUsername(userIdentifier);

                const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
                navigateTo(redirectUrl || 'my_collections_index.html');
            } catch (error) {
                showError(emailInput, error.message || 'Ошибка авторизации. Проверьте данные.');
            }
        };
        if (loginBtn) {
            if (loginBtn.nodeName === 'BUTTON') {
                 loginForm.addEventListener('submit', loginHandler); // Если это кнопка в форме
            } else {
                 loginBtn.addEventListener('click', loginHandler); // Если это div, стилизованный под кнопку
            }
        } else {
            loginForm.addEventListener('submit', loginHandler); // Общий случай для формы
        }
    }

    if (signupForm) {
        const signupBtn = signupForm.querySelector('.create-account-button');
        const signupHandler = async (e) => {
            e.preventDefault();
            const usernameInput = signupForm.querySelector('input[type="text"]');
            const emailInput = signupForm.querySelector('input[type="email"]');
            const passwordInput = signupForm.querySelectorAll('input[type="password"]')[0];
            const confirmInput = signupForm.querySelectorAll('input[type="password"]')[1];

            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmInput.value.trim();

            if (!username) {
                showError(usernameInput, 'Введите имя пользователя');
                return;
            }
            if (username.length < 3) { // Примерная валидация
                showError(usernameInput, 'Имя пользователя слишком короткое (минимум 3 символа)');
                return;
            }
            if (!validateEmailField(email, emailInput)) return;
            if (!validatePasswordField(password, passwordInput, true)) return; // Проверяем длину при регистрации
            if (password !== confirmPassword) {
                showError(confirmInput, 'Пароли не совпадают');
                return;
            }

            try {
                // API регистрации ожидает { app_id, username, email, password }
                await api.registerUser(username, email, password); // app_id добавляется в api.registerUser
                showSuccess('Регистрация успешна! Вы будете перенаправлены на страницу входа.');
                setTimeout(() => {
                    navigateTo('log_in_index.html', { email: encodeURIComponent(email) });
                }, 2000);
            } catch (error) {
                showError(emailInput, error.message || 'Ошибка регистрации. Попробуйте другой email или имя пользователя.');
            }
        };
        if (signupBtn) {
            signupBtn.addEventListener('click', signupHandler);
        }
    }
}

/**
 * Проверяет статус аутентификации пользователя.
 */
export function checkAuthStatus() {
    const token = localStorage.getItem('userToken');
    const userEmail = localStorage.getItem('userEmail'); // Это может быть email или username
    const currentPage = window.location.pathname.split('/').pop();
    const authPages = ['log_in_index.html', 'sign_up_index.html'];
    const publicPages = ['home_page_index.html', ...authPages]; // Страницы, доступные без токена

    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');

    if (token) {
        if (userEmail) displayUsername(userEmail);
        if (authPages.includes(currentPage)) {
            navigateTo(redirectParam || 'my_collections_index.html');
            return true;
        }
        if (redirectParam && redirectParam !== currentPage) {
            const targetPath = redirectParam.split('?')[0].split('/').pop();
            if (targetPath !== currentPage) {
                 navigateTo(redirectParam);
                 return true;
            }
        }
        return true;
    } else {
        if (!publicPages.includes(currentPage)) {
            const redirectUrl = currentPage + window.location.search;
            navigateTo('log_in_index.html', { redirect: encodeURIComponent(redirectUrl) });
            return false;
        }
        return false;
    }
}

/**
 * Выполняет выход пользователя из системы.
 */
export function logoutUser() {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userEmail'); // Или userIdentifier, если используется другое имя ключа
        navigateTo('home_page_index.html');
    }
}

// Вспомогательные функции валидации
function validateEmailField(email, inputElement) {
    if (!email) {
        showError(inputElement, 'Введите email');
        return false;
    }
    if (!isValidEmail(email)) {
        showError(inputElement, 'Некорректный email');
        return false;
    }
    return true;
}

function validatePasswordField(password, inputElement, checkLength = true) {
    if (!password) {
        showError(inputElement, 'Введите пароль');
        return false;
    }
    if (checkLength && password.length < 6) { // Минимальная длина пароля, например, 6 символов
        showError(inputElement, 'Пароль слишком короткий (минимум 6 символов)');
        return false;
    }
    return true;
}
