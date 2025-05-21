document.addEventListener('DOMContentLoaded', function() {
    // Функция для проверки авторизации
    function isAuthenticated() {
        return !!localStorage.getItem('userToken');
    }

    // Функция для плавного перехода между страницами
    function navigateTo(page, params = {}) {
        // Добавляем параметры к URL, если они есть
        let url = page;
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            url += `?${queryString}`;
        }

        // Анимация перехода
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = url;
        }, 300);
    }

    // Обработчик клика по логотипу
    function handleLogoClick() {
        if (isAuthenticated()) {
            // Для авторизованных пользователей - переход в личный кабинет
            navigateTo('my_collections_index.html');
        } else {
            // Для неавторизованных - переход на главную
            navigateTo('home_page_index.html');
        }
    }

    // Обработчик выхода из системы
    function handleLogout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem('userToken');
            localStorage.removeItem('userEmail');
            navigateTo('home_page_index.html');
        }
    }

    // Инициализация обработчиков событий
    function initEventHandlers() {
        // Логотип
        const logos = document.querySelectorAll('.HEADING, .view, .text-wrapper');
        logos.forEach(logo => {
            logo.addEventListener('click', handleLogoClick);
        });

        // Выход
        const logoutButtons = document.querySelectorAll('.exit, .logout-btn');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                handleLogout();
            });
        });

        // Главная страница
        if (document.querySelector('.home')) {
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigateTo('log_in_index.html');
                });
            }

            const registerBtn = document.getElementById('registerBtn');
            if (registerBtn) {
                registerBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigateTo('sign_up_index.html');
                });
            }
        }

        // Страница входа
        if (document.querySelector('.login')) {
            const createAccountBtn = document.querySelector('.frame .text-wrapper-2');
            if (createAccountBtn) {
                createAccountBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigateTo('sign_up_index.html');
                });
            }
        }

        // Страница регистрации
        if (document.querySelector('.sign-up')) {
            const loginLink = document.querySelector('.text-wrapper-2');
            if (loginLink) {
                loginLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigateTo('log_in_index.html');
                });
            }
        }
    }

    // Обработка параметров URL при загрузке страницы
    function handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        
        // Если пользователь аутентифицирован и есть параметр redirect
        if (isAuthenticated() && redirect) {
            navigateTo(redirect);
        }
    }

    // Инициализация
    initEventHandlers();
    handleUrlParams();
});