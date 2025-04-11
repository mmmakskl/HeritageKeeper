// основной JavaScript код для работы приложения

// Пример обработки переключения между страницами
document.getElementById('login-link').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('login-page');
});

document.getElementById('show-register').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('register-page');
});

document.getElementById('show-login').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('login-page');
});

document.getElementById('collections-link').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('my-collections-page');
});

document.getElementById('profile-link').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('profile-page');
});

document.getElementById('add-collection-link').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('edit-collection-page');
    document.getElementById('collection-form-title').textContent = 'Добавить коллекцию';
});

function showPage(pageId) {
    // Скрыть все страницы
    document.querySelectorAll('[id$="-page"]').forEach(page => {
        page.style.display = 'none';
    });
    
    // Показать нужную страницу
    document.getElementById(pageId).style.display = 'block';
}

// Имитация входа пользователя (в реальном приложении это было бы через API)
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    // Здесь была бы аутентификация через API
    document.getElementById('user-dropdown').style.display = 'block';
    document.getElementById('login-nav-item').style.display = 'none';
    document.getElementById('username-display').textContent = document.getElementById('login-username').value;
    showPage('home-page');
});

// Выход из системы
document.getElementById('logout-link').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('user-dropdown').style.display = 'none';
    document.getElementById('login-nav-item').style.display = 'block';
    showPage('login-page');
});

// Добавление предмета в коллекцию
document.getElementById('add-item-btn').addEventListener('click', function() {
    const template = document.getElementById('item-template');
    const clone = template.content.cloneNode(true);
    document.getElementById('collection-items').appendChild(clone);
});

// Удаление предмета из коллекции (делегирование событий)
document.getElementById('collection-items').addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-item-btn')) {
        e.target.closest('.item-card').remove();
    }
});

// Добавление атрибута к предмету (делегирование событий)
document.getElementById('collection-items').addEventListener('click', function(e) {
    if (e.target.classList.contains('add-attribute-btn')) {
        const key = e.target.closest('.input-group').querySelector('.attribute-key').value;
        const value = e.target.closest('.input-group').querySelector('.attribute-value').value;
        
        if (key && value) {
            const attribute = document.createElement('div');
            attribute.className = 'item-attribute';
            attribute.innerHTML = `<strong>${key}:</strong> ${value} <button type="button" class="btn btn-sm btn-link p-0 ms-2 delete-attribute-btn">&times;</button>`;
            
            e.target.closest('.item-card').querySelector('.item-attributes-container').appendChild(attribute);
            
            // Очистить поля ввода
            e.target.closest('.input-group').querySelector('.attribute-key').value = '';
            e.target.closest('.input-group').querySelector('.attribute-value').value = '';
        }
    }
    
    // Удаление атрибута
    if (e.target.classList.contains('delete-attribute-btn')) {
        e.target.closest('.item-attribute').remove();
    }
});

// Превью изображения коллекции
document.getElementById('collection-image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('collection-image-preview').src = event.target.result;
            document.getElementById('collection-image-preview-container').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});