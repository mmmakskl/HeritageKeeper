document.addEventListener('DOMContentLoaded', function() {
    // Навигация по меню
    setupNavigation();
    
    // Обработка клика на логотип "КоллекционерЪ" (без действия)
    document.querySelectorAll('.text-wrapper').forEach(logo => {
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Вернуться на главную?')) {
                window.location.href = "home_page_index.html"
            }
        });
    });
});

function setupNavigation() {
    // Навигация для страницы "Мои коллекции"
    const myCollectionsLinks = document.querySelectorAll('.tabs .text-wrapper-4');
    myCollectionsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'my_collections_index.html';
        });
    });

    // Навигация для страницы "Изменить профиль"
    const profileLinks = document.querySelectorAll('.tabs-2 .text-wrapper-5:first-child');
    profileLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'my_account_index.html';
        });
    });

    // Навигация для страницы "Выход"
    const exitLinks = document.querySelectorAll('.exit .text-wrapper-4, .exit .text-wrapper-5');
    exitLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // Здесь можно добавить логику выхода
            window.location.href = 'home_page_index.html'; // Перенаправление на главную
        });
    });

    // Навигация для элементов коллекции (если нужно)
    const collectionItems = document.querySelectorAll('.item, .collection-preview');
    collectionItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'in_collection_index.html';
        });
    });

    // Навигация для кнопки "Создать коллекцию"
    const addCollectionBtn = document.querySelector('.add-collection');
    if (addCollectionBtn) {
        addCollectionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Логика создания новой коллекции
            console.log('Создание новой коллекции');
        });
    }
} 