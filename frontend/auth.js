// auth.js

const API_URL = 'https://your-backend-api.com'; // Укажите URL вашего бэкенда
const TOKEN_KEY = 'jwt_token'; // Ключ для хранения токена в локальном хранилище

// Функция для входа пользователя
async function login(username, password) {
    try {
        const response = await fetch(${API_URL}/login, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            throw new Error('Ошибка входа. Проверьте логин и пароль.');
        }

        const data = await response.json();
        localStorage.setItem(TOKEN_KEY, data.token); // Сохраняем токен в локальном хранилище
        alert('Успешный вход!');
        // Перенаправление на главную страницу или другую секцию
        window.location.href = '/collections.html'; // Измените на нужный URL
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// Функция для выхода пользователя
function logout() {
    localStorage.removeItem(TOKEN_KEY); // Удаляем токен из локального хранилища
    alert('Вы вышли из системы.');
    window.location.href = '/login.html'; // Перенаправление на страницу входа
}

// Функция для проверки наличия токена
function isLoggedIn() {
    return localStorage.getItem(TOKEN_KEY) !== null;
}

// Пример использования функций
document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const username = event.target.username.value;
            const password = event.target.password.value;
            login(username, password);
        });
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    // Проверка на наличие токена при загрузке страницы
    if (isLoggedIn()) {
        console.log('Пользователь авторизован');
        // Здесь можно выполнить дополнительные действия, например, загрузить данные пользователя
    } else {
        console.log('Пользователь не авторизован');
        // Перенаправление на страницу входа или отображение соответствующего сообщения
    }
});
