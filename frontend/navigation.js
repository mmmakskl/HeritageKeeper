// navigation.js - Рабочая версия

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - navigation.js started');
    setupNavigation();
});

function setupNavigation() {
    // Главная страница
    if (document.querySelector('.home')) {
        console.log('Home page detected');
        
        // Кнопка "Войти"
        const loginBtn = document.querySelector('.log-in');
        if (loginBtn) {
            loginBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Navigate to login');
                navigateTo('log_in_index.html');
            });
        }
        
        // Кнопка "Регистрация"
        const registerBtn = document.querySelector('.add-account');
        if (registerBtn) {
            registerBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Navigate to signup');
                navigateTo('sign_up_index.html');
            });
        }
    }
    
    // Кнопка "Наверх"
    const scrollToTopBtn = document.querySelector('.button-up');
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

function navigateTo(page) {
    console.log('Navigating to:', page);
    document.body.classList.add('fade-out');
    setTimeout(() => {
        window.location.href = page;
    }, 300);
}