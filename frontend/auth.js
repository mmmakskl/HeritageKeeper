const API_URL = 'http://localhost:8081/api';





// Обновленный обработчик 
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthSystem();
    setupAccountPage();
    setupCollectionsPage();
    setupCollectionItemsPage();
    setupItemDeletion();
    setupAvatarChange();
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
    const token = localStorage.getItem('userToken');
    const currentPage = window.location.pathname.split('/').pop();
    const authPages = ['log_in_index.html', 'sign_up_index.html'];

    if (!token && !authPages.includes(currentPage)) {
        window.location.href = `log_in_index.html?redirect=${encodeURIComponent(redirectUrl || currentPage)}`;
        return false;
    }

    if (token && authPages.includes(currentPage)) {
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
                document.querySelectorAll('.text-wrapper-3, .username-display').forEach(el => {
                    el.textContent = user.username || 'Имя пользователя';
                });
                document.querySelector('.text-wrapper-13').textContent = user.email || 'example@gmail.com';
                document.querySelector('.text-wrapper-15').textContent = user.phone || '+7 (999)-999-99 99';
                document.querySelector('.text-wrapper-16').textContent = 
                    user.birth_date ? new Date(user.birth_date).toLocaleDateString() : '__.__.____';
            })
            .catch(error => {
                console.error('Ошибка загрузки профиля:', error);
            });
    }
}

function editCollectionItem(itemId) {
    getCollectionItem(itemId)
        .then(item => {
            const newTitle = prompt('Название предмета:', item.title);
            if (newTitle === null) return;
            
            const newDescription = prompt('Описание:', item.description);
            const newYear = prompt('Год:', item.year);
            const newCountry = prompt('Страна:', item.country);
            const isPublic = confirm('Сделать предмет публичным?');
            
            const itemData = {
                title: newTitle,
                description: newDescription,
                year: newYear,
                country: newCountry,
                is_public: isPublic
            };
            
            showLoader(true);
            updateCollectionItem(itemId, itemData)
                .then(() => {
                    showSuccess('Предмет успешно обновлен');
                    setTimeout(() => window.location.reload(), 1500);
                })
                .catch(error => {
                    console.error('Ошибка обновления предмета:', error);
                    showError(document.body, 'Не удалось обновить предмет: ' + error.message);
                })
                .finally(() => showLoader(false));
        })
        .catch(error => {
            console.error('Ошибка загрузки предмета:', error);
            showError(document.body, 'Не удалось загрузить данные предмета');
        });
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
    getUserProfile()
        .then(currentUser => {
            const newUsername = prompt('Имя пользователя:', currentUser.username || '');
            if (newUsername === null) return;
            
            const newPhone = prompt('Телефон:', currentUser.phone || '');
            const newBirthDate = prompt('Дата рождения (ДД-ММ-ГГГГ):', 
                currentUser.birth_date ? formatDate(currentUser.birth_date, 'DD-MM-YYYY') : '');
            
            const userData = {
                app_id: 1,
                username: newUsername,
                phone: newPhone,
                birth_date: newBirthDate
            };
            
            showLoader(true);
            updateUserProfile(userData)
                .then(updatedUser => {
                    showSuccess('Профиль успешно обновлен');
                    // Обновляем данные на странице
                    document.querySelectorAll('.username-display, .text-wrapper-3').forEach(el => {
                        el.textContent = updatedUser.username || newUsername;
                    });
                    document.querySelectorAll('.phone-display').forEach(el => {
                        el.textContent = updatedUser.phone || newPhone;
                    });
                    document.querySelectorAll('.birthdate-display').forEach(el => {
                        el.textContent = updatedUser.birth_date ? 
                            formatDate(updatedUser.birth_date) : newBirthDate;
                    });
                })
                .catch(error => {
                    console.error('Ошибка обновления профиля:', error);
                    showError(document.body, 'Не удалось обновить профиль: ' + error.message);
                })
                .finally(() => showLoader(false));
        })
        .catch(error => {
            console.error('Ошибка получения профиля:', error);
            showError(document.body, 'Не удалось загрузить текущий профиль');
        });
}

// Функция для форматирования даты
function formatDate(dateString, format = 'DD.MM.YYYY') {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
        // Если дата невалидна, попробуем разобрать в формате DD-MM-YYYY
        const parts = dateString.split('-');
        if (parts.length === 3) {
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
    }
    
    if (isNaN(date.getTime())) return dateString; // Возвращаем как есть, если не удалось распарсить
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    if (format === 'DD-MM-YYYY') {
        return `${day}-${month}-${year}`;
    } else {
        return `${day}.${month}.${year}`;
    }
}

function loadUserCollections() {
    if (document.querySelector('.my-collections')) {
        const token = localStorage.getItem('userToken');
        if (!token) return;

        fetch(`${API_URL}/keeper/collections`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(handleResponse)
        .then(collections => {
            const collectionsContainer = document.querySelector('.collections');
            collectionsContainer.innerHTML = '';

            collections.forEach(collection => {
                const collectionElement = document.createElement('div');
                collectionElement.className = 'collection-preview';
                collectionElement.innerHTML = `
                    <img class="mask-group" src="${collection.image || 'img/default-collection.png'}" />
                    <div class="text-wrapper-6">${collection.name}</div>
                    <div class="number-of-elements">
                        <div class="text-wrapper-7">Количество лотов в коллекции:</div>
                        <div class="text-wrapper-7">${collection.items_count || '0'}</div>
                    </div>
                `;
                collectionsContainer.appendChild(collectionElement);

                collectionElement.addEventListener('click', function() {
                    window.location.href = `in_collection_index.html?collection_id=${collection.id}`;
                });
            });
        })
        .catch(error => {
            console.error('Ошибка загрузки коллекций:', error);
            showError(document.body, 'Не удалось загрузить коллекции');
        });
    }
}

// Инициализация обработчиков для страницы коллекций
function setupCollectionsPage() {
    if (document.querySelector('.my-collections')) {
        // Загружаем коллекции пользователя
        loadUserCollections();
        
        // Настраиваем кнопку создания коллекции
        const addCollectionBtn = document.querySelector('.add-collection');
        if (addCollectionBtn) {
            addCollectionBtn.addEventListener('click', function(e) {
                e.preventDefault();
                createNewCollection();
            });
        }
    }
}

// Обновленная функция добавления элемента в коллекцию
function addCollectionItem(collectionId) {
    const title = prompt('Введите название предмета:');
    if (!title) return;
    
    const description = prompt('Описание предмета:', '');
    const categoryId = prompt('ID категории (число):', '1');
    if (!categoryId || isNaN(categoryId)) {
        showError(document.body, 'ID категории должен быть числом');
        return;
    }
    
    const country = prompt('Страна:', '');
    const year = prompt('Год:', '');
    const isPublic = confirm('Сделать предмет публичным?');
    
    // В реальном приложении здесь была бы загрузка изображений
    const itemImages = ['image1.jpg', 'image2.jpg'];
    
    const itemData = {
        collection_id: parseInt(collectionId),
        title: title,
        description: description,
        category_id: parseInt(categoryId),
        item_images_url: itemImages,
        is_public: isPublic,
        country: country,
        year: year
    };
    
    showLoader(true);
    createCollectionItem(itemData)
        .then(data => {
            showSuccess('Предмет успешно добавлен в коллекцию!');
            setTimeout(() => window.location.reload(), 1500);
        })
        .catch(error => {
            console.error('Ошибка добавления предмета:', error);
            showError(document.body, 'Не удалось добавить предмет: ' + error.message);
        })
        .finally(() => showLoader(false));
}



// изменить аватар
function setupAvatarChange() {
    const avatarInputs = document.querySelectorAll('.text-wrapper-2, .text-wrapper-6');
    
    avatarInputs.forEach(avatarInput => {
        avatarInput.addEventListener('click', function() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                try {
                    showLoader(true);
                    await uploadAvatar(file);
                    showSuccess('Аватар успешно обновлен');
                    setTimeout(() => window.location.reload(), 1500);
                } catch (error) {
                    showError(document.body, 'Ошибка загрузки аватара: ' + error.message);
                } finally {
                    showLoader(false);
                }
            };
            
            fileInput.click();
        });
    });
}

// Функция для получения коллекции по ID
function getCollectionById(collectionId) {
    const token = localStorage.getItem('userToken');
    
    return fetch(`${API_URL}/keeper/collection/${collectionId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(handleResponse);
}

// Функция для получения всех коллекций пользователя
function getUserCollections() {
    const token = localStorage.getItem('userToken');
    
    return fetch(`${API_URL}/keeper/collections`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(handleResponse);
}

// Функция для обновления коллекции
function updateCollection(collectionData) {
    const token = localStorage.getItem('userToken');
    
    return fetch(`${API_URL}/keeper/collection`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(collectionData)
    })
    .then(handleResponse);
}

// Функция для удаления коллекции
function deleteCollection(collectionId) {
    const token = localStorage.getItem('userToken');
    
    return fetch(`${API_URL}/keeper/collection/${collectionId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(handleResponse);
}

// Функция для создания элемента коллекции
function createCollectionItem(itemData) {
    const token = localStorage.getItem('userToken');
    
    return fetch(`${API_URL}/keeper/item`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itemData)
    })
    .then(handleResponse);
}

// Функция для обновления элемента коллекции
function updateCollectionItem(itemId, itemData) {
    const token = localStorage.getItem('userToken');
    
    return fetch(`${API_URL}/keeper/item/${itemId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itemData)
    })
    .then(handleResponse);
}

// Функция для удаления элемента коллекции
function deleteCollectionItem(itemId) {
    const token = localStorage.getItem('userToken');
    
    return fetch(`${API_URL}/keeper/item/${itemId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(handleResponse);
}

// Функция создания коллекции
function createNewCollection() {
    const collectionName = prompt('Введите название коллекции:');
    if (!collectionName) return;

    const description = prompt('Описание коллекции:', '');
    const categoryId = prompt('ID категории (число):', '1');
    if (!categoryId || isNaN(categoryId)) {
        showError(document.body, 'ID категории должен быть числом');
        return;
    }

    const isPublic = confirm('Сделать коллекцию публичной?');

    const collectionData = {
        name: collectionName,
        description: description,
        category_id: parseInt(categoryId),
        is_public: isPublic
    };

    showLoader(true);
    createCollection(collectionData)
        .then(data => {
            showSuccess('Коллекция успешно создана!');
            setTimeout(() => window.location.reload(), 1500);
        })
        .catch(error => {
            console.error('Ошибка создания коллекции:', error);
            showError(document.body, 'Не удалось создать коллекцию: ' + error.message);
        })
        .finally(() => showLoader(false));
}

// Инициализация обработчиков для страницы аккаунта
function setupAccountPage() {
    if (document.querySelector('.my-account')) {
        // Загружаем профиль пользователя
        loadUserProfile();
        
        // Настраиваем кнопки редактирования
        const editButtons = document.querySelectorAll('.iconamoon-edit, .text-wrapper-9');
        editButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                editUserProfile();
            });
        });
        
        // Настраиваем изменение аватара
        setupAvatarChange();
    }
}

// Инициализация обработчиков для страницы элементов коллекции
function setupCollectionItemsPage() {
    if (document.querySelector('.in-collection')) {
        const urlParams = new URLSearchParams(window.location.search);
        const collectionId = urlParams.get('collection_id');

        if (collectionId) {
            Promise.all([
                getCollectionById(collectionId),
                loadCollectionItems(collectionId)
            ])
            .then(([collection, items]) => {
                document.querySelector('.text-wrapper-14').textContent = collection.name;
                document.querySelector('.text-wrapper-12').textContent = items.length || '0';

                const itemsContainer = document.querySelector('.items');
                itemsContainer.innerHTML = '';

                items.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'item';
                    itemElement.innerHTML = `
                        <img class="mask-group" src="${item.item_images_url?.[0] || 'img/default-item.png'}" />
                        <div class="text-wrapper-6">${item.title}</div>
                        <div class="year">
                            <div class="text-wrapper-7">Год:</div>
                            <div class="text-wrapper-8">${item.year || 'не указан'}</div>
                        </div>
                        <div class="country">
                            <div class="text-wrapper-7">Страна:</div>
                            <div class="text-wrapper-8">${item.country || 'не указана'}</div>
                        </div>
                        <div class="category">
                            <div class="text-wrapper-7">Категория:</div>
                            <div class="text-wrapper-8">${item.category || 'не указана'}</div>
                        </div>
                        <button class="delete-item" data-item-id="${item.id}">Удалить</button>
                    `;
                    itemsContainer.appendChild(itemElement);
                });
            })
            .catch(error => {
                console.error('Ошибка загрузки коллекции:', error);
                showError(document.body, 'Не удалось загрузить коллекцию');
            });
        }
    }
}

function loadCollectionItems(collectionId) {
    const token = localStorage.getItem('userToken');
    
    return fetch(`${API_URL}/keeper/collection/${collectionId}/items`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(handleResponse);
}

function uploadAvatar(file) {
    const token = localStorage.getItem('userToken');
    const formData = new FormData();
    formData.append('avatar', file);
    
    return fetch(`${API_URL}/keeper/user/avatar`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    })
    .then(handleResponse);
}

function setupItemDeletion() {
    const itemsContainer = document.querySelector('.items');
    if (itemsContainer) {
        itemsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-item')) {
                e.preventDefault();
                const itemId = e.target.dataset.itemId;
                if (confirm('Вы уверены, что хотите удалить этот предмет?')) {
                    deleteCollectionItem(itemId)
                        .then(() => {
                            showSuccess('Предмет успешно удален');
                            setTimeout(() => window.location.reload(), 1000);
                        })
                        .catch(error => {
                            showError(document.body, 'Ошибка удаления предмета: ' + error.message);
                        });
                }
            }
        });
    }
}