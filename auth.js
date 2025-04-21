const SSO_SERVER_URL = 'http://sso-server:3010';
const CLIENT_APP_TOKEN = 'your_client_app_token'; // Замените на реальный токен вашего приложения
const MIN_PASSWORD_LENGTH = 8;

const elements = {
  forms: {
    login: document.getElementById('login-form-element'),
    register: document.getElementById('register-form-element'),
    loginContainer: document.getElementById('login-form'),
    registerContainer: document.getElementById('register-form'),
  },
  links: {
    showRegister: document.getElementById('show-register'),
    showLogin: document.getElementById('show-login'),
  },
  protected: {
    content: document.getElementById('protected-content'),
    authForms: document.getElementById('auth-forms'),
    userName: document.getElementById('user-name'),
    userEmail: document.getElementById('user-email'),
    jwtToken: document.getElementById('jwt-token'),
    fetchDataBtn: document.getElementById('fetch-data'),
    logoutBtn: document.getElementById('logout'),
    apiResponse: document.getElementById('api-response'),
  },
  error: document.getElementById('error-message')
};

// Инициализация приложения
function init() {
  setupEventListeners();
  checkAuthOnLoad();
}

// Настройка обработчиков событий
function setupEventListeners() {
  // Переключение между формами
  elements.links.showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms();
  });

  elements.links.showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms(false);
  });

  // Обработка форм
  elements.forms.login.addEventListener('submit', handleLogin);
  elements.forms.register.addEventListener('submit', handleRegister);
  elements.protected.fetchDataBtn.addEventListener('click', fetchProtectedData);
  elements.protected.logoutBtn.addEventListener('click', handleLogout);
}

// Проверка авторизации при загрузке
function checkAuthOnLoad() {
  const urlParams = new URLSearchParams(window.location.search);
  const ssoToken = urlParams.get('ssoToken');

  if (ssoToken) {
    // Обработка SSO токена
    verifySSOToken(ssoToken);
  } else {
    // Проверка локального JWT
    const token = localStorage.getItem('jwt');
    const user = localStorage.getItem('user');
    
    if (token && user && !isTokenExpired(token)) {
      showProtectedContent(JSON.parse(user), token);
    } else {
      clearAuthData();
    }
  }
}

// Верификация SSO токена
async function verifySSOToken(ssoToken) {
  try {
    const response = await fetch(`${SSO_SERVER_URL}/verify?ssoToken=${ssoToken}`, {
      headers: { 'Authorization': CLIENT_APP_TOKEN }
    });
    
    // Проверка успешности HTTP-запроса
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Проверка наличия токена в ответе
    if (!data.token) {
      throw new Error('Не получен токен авторизации');
    }
    
    // Сохраняем данные аутентификации
    saveAuthData(data.token, data.user);
    
    // Убираем токен из URL
    if (window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    showProtectedContent(data.user, data.token);
    
  } catch (error) {
    console.error('SSO verification failed:', error);
    
    // Показываем пользователю понятное сообщение об ошибке
    const errorMessage = error.message.includes('Failed to fetch') 
      ? 'Ошибка соединения с сервером авторизации' 
      : error.message;
    
    showError(errorMessage);
    
    // Перенаправляем только если ошибка не связана с сетью
    if (!error.message.includes('Failed to fetch')) {
      redirectToSSOLogin();
    } else {
      // Для сетевых ошибок можно показать кнопку "Попробовать снова"
      showRetryButton();
    }
  }
}

// Вспомогательная функция для кнопки повтора
function showRetryButton() {
  const errorElement = document.getElementById('error-message');
  const retryButton = document.createElement('button');
  retryButton.textContent = 'Попробовать снова';
  retryButton.className = 'btn';
  retryButton.onclick = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const ssoToken = urlParams.get('ssoToken');
    if (ssoToken) {
      verifySSOToken(ssoToken);
    } else {
      window.location.reload();
    }
  };
  errorElement.appendChild(retryButton);
}

// Обработка входа через SSO
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  if (!validatePassword(password)) {
    showError('Пароль должен содержать минимум 8 символов');
    return;
  }

  try {
    const response = await fetch(`${SSO_SERVER_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Для работы с куки сессией
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Ошибка входа');
    }
    
    // После успешного входа перенаправляем на защищенную страницу
    window.location.href = '/protected';
    
  } catch (error) {
    showError(error.message);
  }
}

// Обработка регистрации (если поддерживается SSO сервером)
async function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  if (!validatePassword(password)) {
    showError('Пароль должен содержать минимум 8 символов');
    return;
  }

  try {
    const response = await fetch(`${SSO_SERVER_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Ошибка регистрации');
    }
    
    toggleForms(false);
    showError('Регистрация успешна! Теперь вы можете войти.', false);
    
  } catch (error) {
    showError(error.message);
  }
}

// Перенаправление на страницу входа SSO
function redirectToSSOLogin() {
  const currentUrl = encodeURIComponent(window.location.href);
  window.location.href = `${SSO_SERVER_URL}/login?serviceURL=${currentUrl}`;
}

// Обработка выхода
function handleLogout() {
  // Очищаем локальные данные
  clearAuthData();
  
  // Перенаправляем на выход SSO сервера для глобального выхода
  window.location.href = `${SSO_SERVER_URL}/logout?redirect=${encodeURIComponent(window.location.href)}`;
}

// Получение защищенных данных
async function fetchProtectedData() {
  try {
    let token = localStorage.getItem('jwt');
    
    if (!token) {
      redirectToSSOLogin();
      return;
    }
    
    if (isTokenExpired(token)) {
      token = await refreshToken();
    }
    
    const response = await fetch(`${SSO_SERVER_URL}/protected`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Ошибка получения данных');
    }
    
    elements.protected.apiResponse.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    
  } catch (error) {
    showError(error.message);
    if (error.message.includes('Требуется авторизация')) {
      redirectToSSOLogin();
    }
  }
}

// Обновление токена через SSO сервер
async function refreshToken() {
  try {
    const response = await fetch(`${SSO_SERVER_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include' // Для отправки refresh token из куки
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Ошибка обновления токена');
    
    localStorage.setItem('jwt', data.token);
    return data.token;
    
  } catch (error) {
    handleLogout();
    throw error;
  }
}

// Вспомогательные функции (остаются без изменений)
function toggleForms(showRegister = true) {
  elements.forms.loginContainer.classList.toggle('hidden', showRegister);
  elements.forms.registerContainer.classList.toggle('hidden', !showRegister);
}

function showProtectedContent(user, token) {
  elements.protected.userName.textContent = user.name;
  elements.protected.userEmail.textContent = user.email;
  elements.protected.jwtToken.textContent = token;
  elements.protected.authForms.classList.add('hidden');
  elements.protected.content.classList.remove('hidden');
  elements.error.classList.add('hidden');
}

function showError(message, isError = true) {
  elements.error.textContent = message;
  elements.error.classList.remove('hidden');
  elements.error.style.color = isError ? '#e74c3c' : '#27ae60';
  elements.error.style.borderColor = isError ? '#e74c3c' : '#27ae60';
  elements.error.style.backgroundColor = isError ? '#fadbd8' : '#d5f5e3';
}

function saveAuthData(token, user) {
  localStorage.setItem('jwt', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearAuthData() {
  localStorage.removeItem('jwt');
  localStorage.removeItem('user');
}

function validatePassword(password) {
  return password.length >= MIN_PASSWORD_LENGTH;
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);