// js/utils.js

/**
 * Вспомогательные функции, используемые в различных частях приложения.
 */

/**
 * Проверяет, является ли строка валидным email адресом.
 * @param {string} email - Email для проверки.
 * @returns {boolean} - True, если email валиден, иначе false.
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Отображает или скрывает глобальный индикатор загрузки.
 * @param {boolean} show - True для отображения, false для скрытия.
 */
export function showLoader(show = true) {
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
        loader.style.zIndex = '10000';

        const spinner = document.createElement('div');
        spinner.style.border = '4px solid #f3f3f3';
        spinner.style.borderTop = '4px solid #3498db';
        spinner.style.borderRadius = '50%';
        spinner.style.width = '40px';
        spinner.style.height = '40px';
        spinner.style.animation = 'spin 1s linear infinite';

        loader.appendChild(spinner);
        document.body.appendChild(loader);

        if (!document.getElementById('spinnerAnimation')) {
            const style = document.createElement('style');
            style.id = 'spinnerAnimation';
            style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }
    } else if (loader && !show) {
        loader.remove();
    }
}

/**
 * Отображает сообщение об ошибке.
 * @param {HTMLElement|null} inputElement - Элемент ввода или null для глобальной ошибки.
 * @param {string} message - Текст сообщения об ошибке.
 * @param {boolean} isTemporary - Если true, ошибка исчезнет при вводе/фокусе (для полей ввода).
 */
export function showError(inputElement, message, isTemporary = true) {
    if (!inputElement) {
        const globalErrorContainer = document.body;
        let errorElement = globalErrorContainer.querySelector('.global-error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message global-error-message';
            errorElement.style.color = '#ff4444';
            errorElement.style.backgroundColor = '#ffebee';
            errorElement.style.padding = '10px';
            errorElement.style.margin = '10px auto';
            errorElement.style.borderRadius = '4px';
            errorElement.style.textAlign = 'center';
            errorElement.style.maxWidth = '400px';
            errorElement.style.position = 'fixed';
            errorElement.style.top = '20px';
            errorElement.style.left = '50%';
            errorElement.style.transform = 'translateX(-50%)';
            errorElement.style.zIndex = '10001';
            globalErrorContainer.appendChild(errorElement);
        }
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => { if(errorElement) errorElement.style.display = 'none'; }, 5000);
        return;
    }

    const errorContainer = inputElement.parentNode;
    let errorElement = errorContainer.querySelector(`.error-message[data-for="${inputElement.id || inputElement.name}"]`);
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.dataset.for = inputElement.id || inputElement.name;
        errorElement.style.color = '#ff4444';
        errorElement.style.fontSize = '12px';
        errorElement.style.marginTop = '5px';
        errorContainer.insertBefore(errorElement, inputElement.nextSibling);
    }
    errorElement.textContent = message;
    inputElement.style.borderColor = '#ff4444';

    if (isTemporary) {
        const clearError = () => {
            if (errorElement && errorElement.parentNode) errorElement.remove();
            inputElement.style.borderColor = '';
            inputElement.removeEventListener('input', clearError);
            inputElement.removeEventListener('focus', clearError);
        };
        inputElement.addEventListener('input', clearError);
        inputElement.addEventListener('focus', clearError);
    }
}

/**
 * Отображает сообщение об успехе.
 * @param {string} message - Текст сообщения.
 * @param {HTMLElement} [container=document.body] - Контейнер для сообщения.
 */
export function showSuccess(message, container = document.body) {
    let successElement = container.querySelector('.success-message');
    if (!successElement) {
        successElement = document.createElement('div');
        successElement.className = 'success-message';
        successElement.style.color = '#00C851';
        successElement.style.padding = '10px';
        successElement.style.margin = '10px 0';
        successElement.style.borderRadius = '4px';
        successElement.style.backgroundColor = '#e8f5e9';
        successElement.style.textAlign = 'center';
        successElement.style.position = 'fixed';
        successElement.style.top = '20px';
        successElement.style.left = '50%';
        successElement.style.transform = 'translateX(-50%)';
        successElement.style.zIndex = '10001';
        if (container === document.body) {
            document.body.insertBefore(successElement, document.body.firstChild);
        } else {
            container.prepend(successElement);
        }
    }
    successElement.textContent = message;
    successElement.style.display = 'block';
    successElement.style.opacity = '1';

    setTimeout(() => {
        if (successElement) {
            successElement.style.transition = 'opacity 0.5s ease-out';
            successElement.style.opacity = '0';
            setTimeout(() => {
                 if (successElement) successElement.style.display = 'none';
            }, 500);
        }
    }, 3000);
}

/**
 * Форматирует строку с датой.
 * Если dateString в формате "ДД-ММ-ГГГГ", вернет его же или отформатирует в "ДД.ММ.ГГГГ" для отображения.
 * Если dateString - объект Date, отформатирует его.
 * @param {string | Date | null} dateInput - Строка с датой или объект Date.
 * @param {string} [outputFormat='DD.MM.YYYY'] - Желаемый формат вывода ('DD.MM.YYYY' или 'DD-MM-YYYY').
 * @returns {string} - Отформатированная дата или пустая строка/исходная строка при ошибке.
 */
export function formatDate(dateInput, outputFormat = 'DD.MM.YYYY') {
    if (!dateInput) return '';

    let date;
    if (typeof dateInput === 'string') {
        const parts = dateInput.match(/^(\d{2})[-.](\d{2})[-.](\d{4})$/); // ДД.ММ.ГГГГ или ДД-ММ-ГГГГ
        if (parts) {
            // Формат ДД-ММ-ГГГГ или ДД.ММ.ГГГГ (день, месяц, год)
            // new Date(year, monthIndex, day)
            date = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
        } else {
            // Попытка стандартного парсинга (может сработать для YYYY-MM-DD)
            date = new Date(dateInput);
        }
    } else if (dateInput instanceof Date) {
        date = dateInput;
    } else {
        return String(dateInput); // Если не строка и не дата, вернуть как есть
    }

    if (isNaN(date.getTime())) {
        return typeof dateInput === 'string' ? dateInput : ''; // Возвращаем исходную строку или пустую, если не удалось распарсить
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    if (outputFormat === 'DD-MM-YYYY') {
        return `${day}-${month}-${year}`;
    }
    // По умолчанию DD.MM.YYYY
    return `${day}.${month}.${year}`;
}

/**
 * Проверяет, является ли строка датой в формате ДД-ММ-ГГГГ.
 * @param {string} dateString - Строка для проверки.
 * @returns {boolean}
 */
export function isValidDMYFormat(dateString) {
    if (typeof dateString !== 'string') return false;
    const regex = /^\d{2}-\d{2}-\d{4}$/;
    if (!regex.test(dateString)) return false;
    const [day, month, year] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}


/**
 * Осуществляет плавный переход на другую страницу.
 * @param {string} page - URL страницы для перехода.
 * @param {object} [params={}] - Параметры для добавления к URL.
 */
export function navigateTo(page, params = {}) {
    let url = page;
    if (Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
    }

    document.body.style.transition = 'opacity 0.3s ease-out';
    document.body.style.opacity = '0';
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

/**
 * Отображает имя пользователя (логин) в указанных элементах.
 * @param {string} usernameOrEmail - Имя пользователя или email.
 */
export function displayUsername(usernameOrEmail) {
    if (usernameOrEmail) {
        const usernameElements = document.querySelectorAll('#usernameDisplay, .text-wrapper-3, .user-name .text-wrapper-3, #profileUsernameHeader');
        const displayLogin = usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : usernameOrEmail;
        usernameElements.forEach(element => {
            if (element) {
                element.textContent = displayLogin || 'Пользователь';
            }
        });
    }
}

/**
 * Преобразует строку с датой из формата DD.MM.YYYY в DD-MM-YYYY.
 * @param {string} dmyDotFormattedDate - Дата в формате "ДД.ММ.ГГГГ".
 * @returns {string|null} - Дата в формате "ДД-ММ-ГГГГ" или null, если формат неверный.
 */
export function convertDotToDashFormat(dmyDotFormattedDate) {
    if (typeof dmyDotFormattedDate !== 'string') return null;
    const parts = dmyDotFormattedDate.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (parts) {
        return `${parts[1]}-${parts[2]}-${parts[3]}`;
    }
    return null;
}
