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
