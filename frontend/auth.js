document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - auth.js started');
    initializeAuthSystem();
});

function initializeAuthSystem() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const password = urlParams.get('password');

    if (email && document.querySelector('.input-field[type="email"]')) {
        document.querySelector('.input-field[type="email"]').value = decodeURIComponent(email);
    }

    if (password && document.querySelector('.input-field[type="password"]')) {
        document.querySelector('.input-field[type="password"]').value = decodeURIComponent(password);
    }

    setupLoginForm();
    setupSignupForm();
    setupLogoutButton();
    checkAuth();
}

function setupLoginForm() {
    const loginBtn = document.querySelector('.frame-2 .text-wrapper-4'); // Кнопка "Войти"

    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const emailInput = document.querySelector('.frame-wrapper .input-field[type="email"]');
            const passwordInput = document.querySelector('.div-wrapper .input-field[type="password"]');

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            // Валидация полей
            if (!email) {
                showError(emailInput, 'Введите email');
                return;
            }

            if (!isValidEmail(email)) {
                showError(emailInput, 'Некорректный email');
                return;
            }

            if (!password) {
                showError(passwordInput, 'Введите пароль');
                return;
            }

            if (password.length < 6) {
                showError(passwordInput, 'Пароль слишком короткий (мин. 6 символов)');
                return;
            }

            // Если валидация пройдена
            console.log('Login attempt with valid data:', { email });

            // Отправка данных на сервер
            authenticateUser(email, password);
        });
    }
}

function authenticateUser(email, password) {
    fetch('https://localhost:8000', { // Замените на ваш URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка авторизации');
        }
        return response.json();
    })
    .then(data => {
        // Предполагаем, что сервер возвращает токен в поле token
        const token = data.token;

        if (token) {
            localStorage.setItem('userToken', token);
            localStorage.setItem('userEmail', email);
            // Перенаправляем на страницу коллекций
            window.location.href = 'my_collections_index.html';
        } else {
            showError(document.querySelector('.frame-wrapper .input-field[type="email"]'), 'Не удалось получить токен');
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showError(document.querySelector('.frame-wrapper .input-field[type="email"]'), 'Ошибка авторизации: ' + error.message);
    });
}

// Вспомогательные функции валидации
function isValidEmail(email) {
    const re = /^[^s@]+@[^s@]+.[^s@]+$/;
    return re.test(email);
}

function showError(inputElement, message) {
    let errorElement = inputElement.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('error-message')) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
    }

    errorElement.style.color = 'red';
    errorElement.style.fontSize = '12px';
    errorElement.style.marginTop = '5px';
    errorElement.textContent = message;

    inputElement.style.borderColor = 'red';

    inputElement.addEventListener('input', function() {
        errorElement.textContent = '';
        inputElement.style.borderColor = '';
    });
}

// Остальные функции (setupSignupForm, setupLogoutButton, checkAuth) остаются без изменений