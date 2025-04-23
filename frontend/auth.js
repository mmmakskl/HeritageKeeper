<<<<<<< HEAD
// auth.js
// Центральный модуль авторизации и регистрации

const API_URL = 'http://localhost:8081'; // Локальный хост и порт
const TOKEN_KEY = 'jwt_token';

/**
 * Выполняет вход пользователя
 * @param {string} username
 * @param {string} password
 */
async function login(username, password) {
  console.log('[Auth] login вызван с:', username, password);
  try {
    console.log('[Auth] Отправка запроса на:', `${API_URL}/login`);
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    console.log('[Auth] Код ответа:', response.status);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Ошибка входа. Проверьте логин и пароль.');
    }

    const data = await response.json();
    console.log('[Auth] Ответ сервера:', data);

    localStorage.setItem(TOKEN_KEY, data.token);
    alert('Успешный вход!');
    window.location.href = '/collections.html';

  } catch (error) {
    console.error('[Auth] Ошибка при входе:', error);
    alert(error.message);
  }
}

/**
 * Выполняет регистрацию пользователя
 * @param {string} username
 * @param {string} password
 */
async function register(username, password) {
  console.log('[Auth] register вызван с:', username, password);
  try {
    console.log('[Auth] Отправка запроса на:', `${API_URL}/register`);
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    console.log('[Auth] Код ответа регистрации:', response.status);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Ошибка регистрации.');
    }

    const data = await response.json();
    console.log('[Auth] Регистрация успешна:', data);

    alert('Регистрация прошла успешно! Выполняем вход...');
    await login(username, password);

  } catch (error) {
    console.error('[Auth] Ошибка при регистрации:', error);
    alert(error.message);
  }
}

/**
 * Выход пользователя
 */
function logout() {
  console.log('[Auth] logout вызван');
  localStorage.removeItem(TOKEN_KEY);
  alert('Вы вышли из системы.');
  window.location.href = '/login.html';
}

/**
 * Проверка авторизации
 */
function isLoggedIn() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

// Привязка обработчиков при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Форма логина
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const username = loginForm.username.value.trim();
      const password = loginForm.password.value.trim();
      login(username, password);
    });
  }

  // Если на странице есть кнопка "Войти" вне формы
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', e => {
      e.preventDefault();
      const uname = document.querySelector('#loginForm input[name=username]')?.value.trim();
      const pwd   = document.querySelector('#loginForm input[name=password]')?.value.trim();
      console.log('[Auth] Клик по кнопке войти');
      if (uname && pwd) {
        login(uname, pwd);
      } else {
        alert('Введите логин и пароль!');
      }
    });
  }

  // Форма регистрации
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', e => {
      e.preventDefault();
      const username = registerForm.username.value.trim();
      const password = registerForm.password.value.trim();
      register(username, password);
    });
  }

  const logoutBtn = document.getElementById('logoutButton');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // Авто-редирект в зависимости от статуса
  if (isLoggedIn()) {
    console.log('[Auth] Пользователь авторизован');
    // Можно загрузить профиль или защитить маршруты
  } else {
    console.log('[Auth] Пользователь не авторизован');
    // Если нужно принудительно редиректить
    // if (!window.location.pathname.includes('login')) window.location.href = '/login.html';
  }
});

// Экспорт функций (ESM или подключение через <script type="module">)
export { login, register, logout, isLoggedIn };
=======
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

<<<<<<< HEAD
// Остальные функции (setupSignupForm, setupLogoutButton, checkAuth) остаются без изменений
=======
// Остальные функции (setupSignupForm, setupLogoutButton, checkAuth) остаются без изменений
>>>>>>> 00a4351860d3bcfadd08018caf823078faee5516
>>>>>>> 2d2f18a5187b0a0cd4e2eb0235962e79b497dead
