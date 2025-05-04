const API_URL = 'http://localhost:8081/api';





document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded - auth.js started');
  initializeAuthSystem();
});

function initializeAuthSystem() {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  const password = urlParams.get('password');
  const redirect = urlParams.get('redirect');

  // Автозаполнение полей из URL
  if (email && document.querySelector('.input-field[type="email"]')) {
      document.querySelector('.input-field[type="email"]').value = decodeURIComponent(email);
  }

  if (password && document.querySelector('.input-field[type="password"]')) {
      document.querySelector('.input-field[type="password"]').value = decodeURIComponent(password);
  }

  setupLoginForm();
  setupSignupForm();
  setupLogoutButton();
  checkAuth(redirect);
}

function setupLoginForm() {
  const loginForm = document.getElementById('loginForm') || document.querySelector('.login-form');
  const loginBtn = document.querySelector('.frame-2 .text-wrapper-4') ||
                   document.querySelector('.login-form .submit-btn');

  const handler = function(e) {
      e.preventDefault();

      const form = e.target.closest('form');
      const emailInput = form.querySelector('input[type="email"]');
      const passwordInput = form.querySelector('input[type="password"]');

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      // Валидация полей
      if (!validateEmail(email, emailInput)) return;
      if (!validatePassword(password, passwordInput)) return;

      console.log('Login attempt with valid data:', { email });
      authenticateUser(email, password);
  };

  if (loginForm) {
      loginForm.addEventListener('submit', handler);
  }
  if (loginBtn && !loginForm) {
      loginBtn.addEventListener('click', handler);
  }
}

function validateEmail(email, inputElement) {
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

function validatePassword(password, inputElement) {
  if (!password) {
      showError(inputElement, 'Введите пароль');
      return false;
  }
  if (password.length < 6) {
      showError(inputElement, 'Пароль слишком короткий (мин. 6 символов)');
      return false;
  }
  return true;
}

function authenticateUser(email, password) {
  showLoader(true);

  fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, app_id: 1 })
  })
  .then(handleResponse)
  .then(data => {
      if (!data.token) {
          throw new Error('Не удалось получить токен');
      }

      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userEmail', email);

      // Перенаправление после успешного входа
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
      window.location.href = redirectUrl || 'my_collections_index.html';
  })
  .catch(error => {
      console.error('Ошибка авторизации:', error);
      showError(document.querySelector('input[type="email"]'),
               error.message || 'Ошибка авторизации. Проверьте данные и попробуйте снова.');
  })
  .finally(() => showLoader(false));
}

function setupSignupForm() {
  const signupForm = document.querySelector('.div-2'); // Контейнер с полями формы
  const signupBtn = document.querySelector('.create-account-button');

  const handler = function(e) {
      e.preventDefault();

      const form = e.target.closest('.div-2') || document.querySelector('.div-2');
      const emailInput = form.querySelector('input[type="email"]');
      const passwordInput = form.querySelector('input[type="password"]');
      const confirmInput = form.querySelectorAll('input[type="password"]')[1];
      const usernameInput = form.querySelector('input[type="text"]');

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      const confirmPassword = confirmInput.value.trim();
      const username = usernameInput.value.trim();

      // Валидация полей
      if (!username) {
          showError(usernameInput, 'Введите имя пользователя');
          return;
      }
      if (!validateEmail(email, emailInput)) return;
      if (!validatePassword(password, passwordInput)) return;
      if (password !== confirmPassword) {
          showError(confirmInput, 'Пароли не совпадают');
          return;
      }

      console.log('Signup attempt with valid data:', { email, username });
      registerUser(email, password, username);
  };

  if (signupBtn) {
      signupBtn.addEventListener('click', handler);
  }
}

function registerUser(email, password, username) {
  showLoader(true);

  fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, username })
  })
  .then(response => {
      if (!response.ok) {
          return response.json().then(err => {
              throw new Error(err.message || `Ошибка регистрации (статус: ${response.status})`);
          });
      }
      return response.json();
  })
  .then(data => {
      if (data.error) {
          throw new Error(data.error);
      }
      showSuccess('Регистрация успешна! Выполняется вход...');
      // Вместо автоматического входа перенаправляем на страницу логина
      setTimeout(() => {
          window.location.href = 'log_in_index.html?email=' + encodeURIComponent(email);
      }, 1500);
  })
  .catch(error => {
      console.error('Ошибка регистрации:', error);
      const emailInput = document.querySelector('input[type="email"]');
      showError(emailInput, error.message || 'Ошибка регистрации. Попробуйте другой email.', false);
  })
  .finally(() => showLoader(false));
}

function setupLogoutButton() {
  const logoutBtns = document.querySelectorAll('.logout-btn, #logoutBtn');

  logoutBtns.forEach(btn => {
      btn.addEventListener('click', function(e) {
          e.preventDefault();
          logoutUser();
      });
  });
}

function logoutUser() {
  // Очищаем данные аутентификации
  localStorage.removeItem('userToken');
  localStorage.removeItem('userEmail');

  // Перенаправляем на страницу входа
  window.location.href = 'login.html';
}

function checkAuth(redirectUrl) {
  const protectedRoutes = ['my_collections_index.html', 'home_page_index.html'];
  const authPages = ['log_in_index.html', 'sign_up_index.html'];
  const currentPage = window.location.pathname.split('/').pop();

  const token = localStorage.getItem('userToken');
  const isProtected = protectedRoutes.includes(currentPage);
  const isAuthPage = authPages.includes(currentPage);

  if (isProtected && !token) {
      window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl || window.location.pathname)}`;
      return false;
  }

  if (isAuthPage && token) {
      window.location.href = redirectUrl || 'my_collections_index.html';
      return true;
  }

  return !!token;
}

// Вспомогательные функции
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function handleResponse(response) {
  if (!response.ok) {
      return response.json().then(err => {
          throw new Error(err.message || `Ошибка сервера: ${response.status}`);
      });
  }
  return response.json();
}

function showLoader(show = true) {
  let loader = document.getElementById('globalLoader');
  if (!loader && show) {
      loader = document.createElement('div');
      loader.id = 'globalLoader';
      loader.style.position = 'fixed';
      loader.style.top = '0';
      loader.style.left = '0';
      loader.style.width = '100%';
      loader.style.height = '100%';
      loader.style.backgroundColor = 'rgba(0,0,0,0.5)';
      loader.style.display = 'flex';
      loader.style.justifyContent = 'center';
      loader.style.alignItems = 'center';
      loader.style.zIndex = '1000';

      const spinner = document.createElement('div');
      spinner.style.border = '4px solid #f3f3f3';
      spinner.style.borderTop = '4px solid #3498db';
      spinner.style.borderRadius = '50%';
      spinner.style.width = '40px';
      spinner.style.height = '40px';
      spinner.style.animation = 'spin 1s linear infinite';

      loader.appendChild(spinner);
      document.body.appendChild(loader);

      // Добавляем анимацию в CSS
      const style = document.createElement('style');
      style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
  } else if (loader && !show) {
      loader.remove();
  }
}

function showError(inputElement, message, isTemporary = true) {
  // Очищаем предыдущие ошибки
  const existingError = inputElement.nextElementSibling;
  if (existingError && existingError.classList.contains('error-message')) {
      existingError.remove();
  }

  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.style.color = '#ff4444';
  errorElement.style.fontSize = '12px';
  errorElement.style.marginTop = '5px';
  errorElement.textContent = message;

  inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
  inputElement.style.borderColor = '#ff4444';

  if (isTemporary) {
      const clearError = () => {
          errorElement.remove();
          inputElement.style.borderColor = '';
          inputElement.removeEventListener('input', clearError);
      };
      inputElement.addEventListener('input', clearError);
  }
}

function showSuccess(message, container = document.body) {
  const existingSuccess = container.querySelector('.success-message');
  if (existingSuccess) existingSuccess.remove();

  const successElement = document.createElement('div');
  successElement.className = 'success-message';
  successElement.style.color = '#00C851';
  successElement.style.padding = '10px';
  successElement.style.margin = '10px 0';
  successElement.style.borderRadius = '4px';
  successElement.style.backgroundColor = '#e8f5e9';
  successElement.style.textAlign = 'center';
  successElement.textContent = message;

  container.prepend(successElement);

  setTimeout(() => {
      successElement.style.transition = 'opacity 0.5s';
      successElement.style.opacity = '0';
      setTimeout(() => successElement.remove(), 500);
  }, 3000);
}

// Добавляем проверку авторизации при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const protectedPages = [
        'my_collections_index.html',
        'in_collection_index.html',
        'my_account_index.html'
    ];

    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage)) {
        const token = localStorage.getItem('userToken');
        if (!token) {
            window.location.href = 'log_in_index.html?redirect=' + encodeURIComponent(currentPage);
        }
    }

    // Отображаем имя пользователя на защищенных страницах
    if (protectedPages.includes(currentPage)) {
        const username = localStorage.getItem('userEmail');
        if (username) {
            const usernameElements = document.querySelectorAll('#usernameDisplay, .text-wrapper-3');
            usernameElements.forEach(element => {
                element.textContent = username.split('@')[0] || username;
            });
        }
    }

    loadUserProfile();
    loadUserCollections();
    setupCollectionPage();
});

// Функция для создания коллекции
function createCollection(collectionData) {
    const token = localStorage.getItem('userToken');
    
    return fetch(`${API_URL}/keeper/collection`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(collectionData)
    })
    .then(handleResponse);
}

// Функция для обновления данных пользователя
function updateUserProfile(userData) {
    const token = localStorage.getItem('userToken');
    
    return fetch(`${API_URL}/keeper/user`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
    })
    .then(handleResponse);
}

// Функция для получения профиля пользователя
function getUserProfile() {
    const token = localStorage.getItem('userToken');
    
    return fetch(`${API_URL}/keeper/profile`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(handleResponse);
}

// Функция для получения списка пользователей
function getAllUsers() {
    const token = localStorage.getItem('userToken');
    
    return fetch(`${API_URL}/keeper/users`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(handleResponse);
}

// Загрузка профиля пользователя на странице аккаунта
function loadUserProfile() {
    if (document.querySelector('.my-account')) {
        getUserProfile()
            .then(user => {
                document.querySelector('.text-wrapper-3').textContent = user.username;
                document.querySelector('.text-wrapper-11').textContent = user.username;
                document.querySelector('.text-wrapper-13').textContent = user.email;
                document.querySelector('.text-wrapper-15').textContent = user.phone;
                document.querySelector('.text-wrapper-16').textContent = 
                    user.birth_date ? new Date(user.birth_date).toLocaleDateString() : '__.__.____';
            })
            .catch(error => {
                console.error('Ошибка загрузки профиля:', error);
            });
    }
}

// Настройка редактирования профиля
function setupProfileEdit() {
    const editButtons = document.querySelectorAll('.iconamoon-edit, .text-wrapper-9');
    
    editButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            editUserProfile();
        });
    });
}

// Редактирование профиля пользователя
function editUserProfile() {
    const currentUsername = document.querySelector('.username-display').textContent;
    const currentPhone = document.querySelector('.phone-display').textContent;
    const currentBirthDate = document.querySelector('.birthdate-display').textContent;
    
    const newUsername = prompt('Имя пользователя:', currentUsername);
    if (newUsername === null) return;
    
    const newPhone = prompt('Телефон:', currentPhone);
    const newBirthDate = prompt('Дата рождения (ДД-ММ-ГГГГ):', currentBirthDate);
    
    const userData = {
        username: newUsername,
        phone: newPhone,
        birth_date: newBirthDate
    };
    
    showLoader(true);
    updateUserProfile(userData)
        .then(updatedUser => {
            showSuccess('Профиль успешно обновлен');
            // Обновляем данные на странице
            document.querySelector('.username-display').textContent = updatedUser.username || newUsername;
            document.querySelector('.phone-display').textContent = updatedUser.phone || newPhone;
            document.querySelector('.birthdate-display').textContent = 
                updatedUser.birth_date ? formatDate(updatedUser.birth_date) : newBirthDate;
        })
        .catch(error => {
            console.error('Ошибка обновления профиля:', error);
            showError(document.body, 'Не удалось обновить профиль');
        })
        .finally(() => showLoader(false));
}

// Функция для форматирования даты
function formatDate(dateString) {
    if (!dateString) return '__.__.____';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function loadUserCollections() {
    if (document.querySelector('.my-collections')) {
        // В реальной реализации здесь будет запрос к API для получения коллекций
        // Пока используем mock-данные
        const mockCollections = [
            {
                id: 1,
                name: "Монеты XXI века",
                items_count: 1,
                image: "img/money.png"
            }
        ];
        
        const collectionsContainer = document.querySelector('.collections');
        
        mockCollections.forEach(collection => {
            const collectionElement = document.createElement('div');
            collectionElement.className = 'collection-preview';
            collectionElement.innerHTML = `
                <img class="mask-group" src="${collection.image}" />
                <div class="text-wrapper-6">${collection.name}</div>
                <div class="number-of-elements">
                    <div class="text-wrapper-7">Количество лотов в коллекции:</div>
                    <div class="text-wrapper-7">${collection.items_count}</div>
                </div>
            `;
            collectionsContainer.appendChild(collectionElement);
            
            // Добавляем обработчик клика
            collectionElement.addEventListener('click', function() {
                window.location.href = `in_collection_index.html?collection_id=${collection.id}`;
            });
        });
    }
}

// работа с эл-тами коллекции
function setupCollectionPage() {
    if (document.querySelector('.in-collection')) {
        // Получаем ID коллекции из URL
        const urlParams = new URLSearchParams(window.location.search);
        const collectionId = urlParams.get('collection_id');
        
        // Загружаем данные коллекции (в реальной реализации - запрос к API)
        const mockCollection = {
            id: collectionId || 1,
            name: "Монеты XXI века",
            items_count: 1,
            items: [
                {
                    id: 1,
                    name: "Американский мемориальный парк",
                    image: "img/moneta_american.png",
                    year: "2019",
                    country: "США",
                    category: "Монеты"
                }
            ]
        };
        
        // Устанавливаем название коллекции
        document.querySelector('.text-wrapper-14').textContent = mockCollection.name;
        document.querySelector('.text-wrapper-12').textContent = mockCollection.items_count;
        
        // Обработчик для кнопки добавления элемента
        document.querySelector('.add-element').addEventListener('click', function(e) {
            e.preventDefault();
            addCollectionItem(mockCollection.id);
        });
    }
}

function addCollectionItem(collectionId) {
    const itemName = prompt('Введите название предмета:');
    if (!itemName) return;
    
    const itemTag = prompt('Введите тег предмета (число):');
    if (!itemTag || isNaN(itemTag)) {
        showError(document.body, 'Тег должен быть числом');
        return;
    }
    
    const itemData = {
        name: itemName,
        collection_id: collectionId,
        tag: parseInt(itemTag),
        // Другие поля в реальной реализации
    };
    
    showLoader(true);
    fetch(`${API_URL}/keeper/collection/item`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify(itemData)
    })
    .then(handleResponse)
    .then(data => {
        showSuccess('Предмет добавлен в коллекцию');
        // Обновляем страницу или добавляем элемент динамически
        setTimeout(() => window.location.reload(), 1500);
    })
    .catch(error => {
        console.error('Ошибка добавления предмета:', error);
        showError(document.body, error.message || 'Ошибка добавления предмета');
    })
    .finally(() => showLoader(false));
}


// Добавляем вызов в инициализацию
document.addEventListener('DOMContentLoaded', function() {
    setupCollectionPage();
});

// изменить аватар
function setupAvatarChange() {
    const avatarInput = document.querySelector('.text-wrapper-6'); // Кнопка "Изменить аватар"
    if (avatarInput) {
        avatarInput.addEventListener('click', function() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                try {
                    showLoader(true);
                    // Здесь код для загрузки аватара на сервер
                    showSuccess('Аватар успешно обновлен');
                    setTimeout(() => window.location.reload(), 1500);
                } catch (error) {
                    showError(document.body, 'Ошибка загрузки аватара');
                } finally {
                    showLoader(false);
                }
            };
            
            fileInput.click();
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setupAvatarChange();
});