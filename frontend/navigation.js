// Этот код нужно добавить в отдельный файл, например navigation.js, и подключить его ко всем страницам
// <script src="navigation.js"></script>

document.addEventListener('DOMContentLoaded', function() {
    // Функция для перехода на страницу

    function navigateTo(page) {
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = page;
        }, 300);
    }

    // Обработчики для главной страницы (home_page_index.html)
    if (document.querySelector('.home')) {
        // Переход на страницу входа
        const loginBtn = document.querySelector('.log-in');
        if (loginBtn) {
            loginBtn.addEventListener('click', function() {
                navigateTo('log_in_index.html');
            });
        }

        // Переход на страницу регистрации
        const registerBtn = document.querySelector('.add-account');
        if (registerBtn) {
            registerBtn.addEventListener('click', function() {
                navigateTo('sign_up_index.html');
            });
        }

        // Навигация по меню (если нужно)
        const menuItems = document.querySelectorAll('.pages .div');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                const text = this.textContent.trim();
                if (text === 'Главная') {
                    navigateTo('home_page_index.html');
                } else if (text === 'Каталоги') {
                    // Здесь можно добавить переход на страницу каталогов
                    console.log('Переход на страницу каталогов');
                }
            });
        });
    }

    // Обработчики для страницы входа (log_in_index.html)
    if (document.querySelector('.login')) {
        // Переход на страницу регистрации
        const createAccountBtn = document.querySelector('.frame .text-wrapper-2');
        if (createAccountBtn) {
            createAccountBtn.addEventListener('click', function(e) {
                e.preventDefault();
                navigateTo('sign_up_index.html');
            });
        }

        // Переход на главную страницу при клике на логотип
        const logo = document.querySelector('.view');
        if (logo) {
            logo.addEventListener('click', function() {
                navigateTo('home_page_index.html');
            });
        }

        // Обработка кнопки "Войти"
        const loginBtn = document.querySelector('.frame-2');
        if (loginBtn) {
            loginBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // Здесь можно добавить логику входа
                console.log('Попытка входа');
                // После успешного входа:
                // navigateTo('home_page_index.html');
            });
        }
    }

    // Обработчики для страницы регистрации (sign_up_index.html)
    if (document.querySelector('.sign-up')) {
        // Переход на страницу входа
        const loginLink = document.querySelector('.text-wrapper-2');
        if (loginLink) {
            loginLink.addEventListener('click', function(e) {
                e.preventDefault();
                navigateTo('log_in_index.html');
            });
        }

        // Переход на главную страницу при клике на логотип
        const logo = document.querySelector('.view');
        if (logo) {
            logo.addEventListener('click', function() {
                navigateTo('home_page_index.html');
            });
        }

        // Обработка кнопки "Создать аккаунт"
        const createAccountBtn = document.querySelector('.create-account-button');
        if (createAccountBtn) {
            createAccountBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // Здесь можно добавить логику регистрации
                console.log('Попытка регистрации');
                // После успешной регистрации:
                // navigateTo('home_page_index.html');
            });
        }
    }
    // Обработчик для кнопки прокрутки вверх
    const scrollToTopBtn = document.querySelector('.button-up');
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    // Показ/скрытие кнопки прокрутки при скролле
    window.addEventListener('scroll', function() {
        const scrollToTopBtn = document.querySelector('.button-up');
        if (scrollToTopBtn) {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        }
    });
});