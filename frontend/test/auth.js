const API_URL = 'http://localhost:8081/api';
const TOKEN_KEY = 'jwt_token';

/**
 * Регистрация
 */
export async function register(email, password) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка регистрации');
  }

  // После успешной регистрации сразу логиним
  return login(email, password);
}

/**
 * Вход
 */
export async function login(email, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST', // согласно бэку
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, app_id: 1 })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Неверные данные');
  }

  const data = await res.json();
  const token = data.token;
  // Сохраняем в localStorage и перенаправляем
  localStorage.setItem(TOKEN_KEY, token);
  window.location.href = 'collections.html';
}

/**
 * Выход
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = 'login.html';
}

/**
 * Проверка авторизации
 */
export function isLoggedIn() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

// Привязка событий к формам
window.addEventListener('DOMContentLoaded', () => {
  const rf = document.getElementById('registerForm');
  if (rf) rf.addEventListener('submit', e => {
    e.preventDefault();
    const { email, password } = rf.elements;
    register(email.value, password.value).catch(err => alert(err.message));
  });

  const lf = document.getElementById('loginForm');
  if (lf) lf.addEventListener('submit', e => {
    e.preventDefault();
    const { email, password } = lf.elements;
    login(email.value, password.value).catch(err => alert(err.message));
  });

  const lo = document.getElementById('logoutButton');
  if (lo) lo.addEventListener('click', logout);
});