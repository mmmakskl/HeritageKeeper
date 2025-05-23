// js/profile.js
import * as api from './api.js';
// APP_ID не используется в PUT запросе согласно последним требованиям
import {
    showLoader, showError, showSuccess,
    formatDate, isValidDMYFormat, // formatDate для отображения и подготовки, isValidDMYFormat для валидации
    displayUsername as globalDisplayUsername
} from './utils.js';

let currentUserData = {}; // Кэш исходных данных пользователя
let changedPassword = null; // Временное хранилище для измененного пароля
let changedBirthDate = null; // Временное хранилище для измененной даты рождения

/**
 * Инициализирует страницу профиля пользователя.
 */
export async function initProfilePage() {
    const myAccountSection = document.querySelector('body.my-account');
    if (!myAccountSection) return;

    await loadUserProfile();
    setupEventListeners();
    applyPhoneMask(); // Применяем маску после загрузки данных и создания инпута
}

/**
 * Загружает данные профиля пользователя и заполняет поля.
 * API GET /api/keeper/profile возвращает User:
 * { "username": "...", "email": "...", "phone": "...", "birth_date": "ДД-ММ-ГГГГ", "avatar_url": "..." }
 * (app_id и password не приходят в GET /profile)
 */
async function loadUserProfile() {
    try {
        showLoader(true);
        const profile = await api.getUserProfile();
        currentUserData = { ...profile }; // Кэшируем все, что пришло

        // Имя пользователя (в input)
        const usernameInput = document.getElementById('profileUsernameInput');
        if (usernameInput) {
            usernameInput.value = currentUserData.username || '';
        } else {
            // Фоллбэк, если HTML еще не обновлен и используется старый div
            const usernameDiv = document.querySelector('.text-wrapper-11.username-display');
            if (usernameDiv) usernameDiv.textContent = currentUserData.username || 'Не указано';
        }

        // Email (div, не редактируемый)
        const emailDisplay = document.getElementById('profileEmailDisplay');
        if (emailDisplay) {
            emailDisplay.textContent = currentUserData.email || 'E-mail не указан';
        }

        // Телефон (в input)
        const phoneInput = document.getElementById('profilePhoneInput');
        if (phoneInput) {
            phoneInput.value = currentUserData.phone || '';
        } else {
            // Фоллбэк для старого div
            const phoneDiv = document.querySelector('.text-wrapper-15.phone-display');
            if (phoneDiv) phoneDiv.textContent = currentUserData.phone || 'Телефон не указан';
        }
        applyPhoneMask(); // Применить маску к полю телефона, если оно уже есть

        // Дата рождения (div, логика редактирования через prompt)
        const birthdateDisplay = document.getElementById('profileBirthdateDisplay');
        if (birthdateDisplay) {
            // API возвращает "ДД-ММ-ГГГГ", formatDate отобразит как "ДД.ММ.ГГГГ"
            birthdateDisplay.textContent = currentUserData.birth_date ? formatDate(currentUserData.birth_date, 'DD.MM.YYYY') : '__.__.____';
        }
        changedBirthDate = currentUserData.birth_date || null; // Инициализируем для сравнения

        // Пароль (div, логика редактирования через prompt)
        const passwordDisplay = document.getElementById('profilePasswordDisplay');
        if (passwordDisplay) {
            passwordDisplay.textContent = '******';
        }
        changedPassword = null; // Сбрасываем при загрузке профиля

        // Аватар и имя в шапке
        globalDisplayUsername(currentUserData.username || currentUserData.email);
        const avatarImg = document.getElementById('profileAvatarImage') || document.querySelector('.my-account .overlap-group img.img');
        const headerAvatarImg = document.querySelector('.my-account .overlap img.codicon-account');
        if (currentUserData.avatar_url) {
            if (avatarImg) avatarImg.src = currentUserData.avatar_url;
            if (headerAvatarImg) headerAvatarImg.src = currentUserData.avatar_url;
        } else {
            const defaultAvatar = 'img/user.png'; // Убедитесь, что путь правильный
            if (avatarImg) avatarImg.src = defaultAvatar;
            if (headerAvatarImg) headerAvatarImg.src = defaultAvatar;
        }
         const headerUsername = document.querySelector('.user-name .text-wrapper-3');
         if(headerUsername) headerUsername.textContent = currentUserData.username || (currentUserData.email ? currentUserData.email.split('@')[0] : 'Пользователь');


    } catch (error) {
        showError(document.body, 'Ошибка загрузки профиля: ' + error.message);
        currentUserData = {}; // Сбрасываем кэш
    } finally {
        showLoader(false);
    }
}

function setupEventListeners() {
    // Кнопка "Редактировать" (Сохранить изменения)
    // Предполагаем, что это элемент с классом .text-wrapper-9 или вы дадите ему ID
    const saveProfileBtn = document.getElementById('saveProfileChangesBtn') || document.querySelector('.my-account .text-wrapper-9');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', handleSaveProfile);
    }

    // Редактирование даты рождения по клику (старый стиль)
    const birthdateDisplay = document.getElementById('profileBirthdateDisplay');
    if (birthdateDisplay) {
        birthdateDisplay.style.cursor = 'pointer'; // Показываем, что кликабельно
        birthdateDisplay.addEventListener('click', () => {
            const currentBirthdateForPrompt = changedBirthDate || currentUserData.birth_date || ''; // "ДД-ММ-ГГГГ"
            const newBirthdateInput = prompt('Дата рождения (ДД-ММ-ГГГГ):', currentBirthdateForPrompt);
            if (newBirthdateInput !== null) { // Если не нажал "Отмена"
                if (newBirthdateInput.trim() === '') {
                    changedBirthDate = null; // Очистка даты
                    birthdateDisplay.textContent = '__.__.____';
                } else if (isValidDMYFormat(newBirthdateInput.trim())) {
                    changedBirthDate = newBirthdateInput.trim(); // Сохраняем в формате "ДД-ММ-ГГГГ"
                    birthdateDisplay.textContent = formatDate(changedBirthDate, 'DD.MM.YYYY'); // Отображаем "ДД.ММ.ГГГГ"
                } else {
                    showError(birthdateDisplay.parentElement, 'Неверный формат даты. Используйте ДД-ММ-ГГГГ.');
                }
            }
        });
    }

    // Редактирование пароля по клику (старый стиль)
    // Предположим, кликаем на "******" (text-wrapper-19)
    const passwordDisplay = document.getElementById('profilePasswordDisplay') || document.querySelector('.my-account .text-wrapper-19');
    if (passwordDisplay) {
        passwordDisplay.style.cursor = 'pointer';
        passwordDisplay.addEventListener('click', () => {
            const newPass = prompt('Введите новый пароль (минимум 6 символов). Оставьте пустым, чтобы не менять:');
            if (newPass !== null) { // Если не "Отмена"
                if (newPass === '') {
                    changedPassword = null; // Не менять пароль
                    showSuccess('Пароль не будет изменен.');
                } else if (newPass.length >= 6) {
                    changedPassword = newPass;
                    showSuccess('Новый пароль принят и будет сохранен при нажатии "Редактировать".');
                } else {
                    showError(passwordDisplay.parentElement, 'Пароль слишком короткий (минимум 6 символов).');
                }
            }
        });
    }

    // Смена аватара (оставляем как было, если нужно)
    const avatarChangeTriggers = document.querySelectorAll('.my-account .text-wrapper-2, .my-account .text-wrapper-6, .my-account .overlap-group img.img, .my-account .codicon-account');
    avatarChangeTriggers.forEach(trigger => {
        trigger.addEventListener('click', openAvatarFilePicker);
    });
}

function openAvatarFilePicker() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            document.body.removeChild(fileInput);
            return;
        }
        const formData = new FormData();
        formData.append('avatar', file);
        try {
            showLoader(true);
            const response = await api.uploadUserAvatar(formData); // Предполагаем, что этот API есть
            showSuccess('Аватар успешно обновлен');
            if (response && response.avatar_url) {
                currentUserData.avatar_url = response.avatar_url;
                const profileAvatar = document.getElementById('profileAvatarImage') || document.querySelector('.my-account .overlap-group img.img');
                const headerAvatar = document.querySelector('.my-account .overlap img.codicon-account');
                if (profileAvatar) profileAvatar.src = response.avatar_url;
                if (headerAvatar) headerAvatar.src = response.avatar_url;
            } else {
                 await loadUserProfile(); // Перезагрузить профиль, чтобы увидеть новый аватар от сервера
            }
        } catch (error) {
            showError(document.body, 'Ошибка загрузки аватара: ' + error.message);
        } finally {
            showLoader(false);
            document.body.removeChild(fileInput);
        }
    };
    fileInput.click();
}


function applyPhoneMask() {
    const phoneInput = document.getElementById('profilePhoneInput');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Удаляем все нецифровые символы
        let formattedValue = '+7 (';

        if (value.length > 1) { // Начинаем с '7' или '8', но всегда показываем '+7'
            value = value.substring(1); // Убираем первую '7' или '8' для дальнейшего форматирования
        }

        if (value.length > 0) {
            formattedValue += value.substring(0, 3);
        }
        if (value.length >= 4) {
            formattedValue += ') ' + value.substring(3, 6);
        }
        if (value.length >= 7) {
            formattedValue += '-' + value.substring(6, 8);
        }
        if (value.length >= 9) {
            formattedValue += '-' + value.substring(8, 10);
        }
        e.target.value = formattedValue.substring(0, 18); // Ограничиваем длину маски +7 (XXX) XXX-XX-XX
    });
     // Принудительное форматирование при потере фокуса, если нужно убрать лишние символы
    phoneInput.addEventListener('blur', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 1 && (value.startsWith('7') || value.startsWith('8'))) {
            value = value.substring(1);
        }
        if (value.length < 10) { // Если номер неполный, можем его очистить или оставить как есть
            // e.target.value = ''; // или оставить неполный ввод
        } else {
            // Переформатируем, чтобы убедиться в правильности
             let formattedValue = '+7 (';
            formattedValue += value.substring(0, 3);
            formattedValue += ') ' + value.substring(3, 6);
            formattedValue += '-' + value.substring(6, 8);
            formattedValue += '-' + value.substring(8, 10);
            e.target.value = formattedValue;
        }
    });
}


/**
 * Собирает измененные данные профиля и отправляет на сервер.
 * PUT /api/keeper/user
 * Формат: { "username": "...", "email": "...", "password": "...", "phone": "...", "birth_date": "ДД-ММ-ГГГГ" }
 * Отправляем только email + измененные поля.
 */
async function handleSaveProfile() {
    const usernameInput = document.getElementById('profileUsernameInput');
    const phoneInput = document.getElementById('profilePhoneInput');

    const currentUsername = usernameInput ? usernameInput.value.trim() : currentUserData.username;

    let currentPhone = phoneInput ? phoneInput.value.replace(/\D/g, '') : (currentUserData.phone ? currentUserData.phone.replace(/\D/g, '') : null);
    if (currentPhone && (currentPhone.startsWith('7') || currentPhone.startsWith('8')) && currentPhone.length === 11) {
        currentPhone = '+7' + currentPhone.substring(1); // Нормализуем к +7XXXXXXXXXX
    } else if (currentPhone && currentPhone.length === 10) {
        currentPhone = '+7' + currentPhone; // Если введено 10 цифр без кода страны
    } else if (currentPhone && currentPhone.trim() !== '') {
        showError(phoneInput ? phoneInput.parentElement : document.body, 'Некорректный формат телефона. Введите 10 цифр после +7.');
        return;
    } else {
        currentPhone = null; // Если поле пустое или некорректное после очистки
    }


    const dataToSend = {
        email: currentUserData.email // Email всегда отправляется, берется из GET
    };
    let hasChanges = false;

    // Username
    if (usernameInput && currentUsername !== currentUserData.username) {
        if (!currentUsername) {
            showError(usernameInput.parentElement, "Имя пользователя не может быть пустым.");
            return;
        }
        if (currentUsername.length < 3) {
            showError(usernameInput.parentElement, "Имя пользователя слишком короткое (минимум 3 символа).");
            return;
        }
        dataToSend.username = currentUsername;
        hasChanges = true;
    } else if (!usernameInput && currentUserData.username) { // Если инпута нет, но есть старое значение
        dataToSend.username = currentUserData.username;
    }


    // Phone
    const originalPhoneNormalized = currentUserData.phone ? ('+7' + currentUserData.phone.replace(/\D/g, '').slice(-10)) : null;
    if (currentPhone !== originalPhoneNormalized) {
        dataToSend.phone = currentPhone; // Отправляем нормализованный или null
        hasChanges = true;
    } else if (currentUserData.phone) { // Если не менялся, но был
        dataToSend.phone = currentUserData.phone;
    }


    // Birth Date (из changedBirthDate, которое обновляется через prompt)
    // changedBirthDate уже в формате "ДД-ММ-ГГГГ" или null
    if (changedBirthDate !== currentUserData.birth_date) {
        if (changedBirthDate && !isValidDMYFormat(changedBirthDate)) {
             // Эта проверка должна быть раньше, в обработчике prompt, но на всякий случай
            showError(document.getElementById('profileBirthdateDisplay')?.parentElement || document.body, 'Неверный формат даты рождения для сохранения.');
            return;
        }
        dataToSend.birth_date = changedBirthDate; // Уже в "ДД-ММ-ГГГГ"
        hasChanges = true;
    } else if (currentUserData.birth_date) {
        dataToSend.birth_date = currentUserData.birth_date;
    }


    // Password (из changedPassword)
    if (changedPassword) {
        if (changedPassword.length < 6) {
            showError(document.getElementById('profilePasswordDisplay')?.parentElement || document.body, 'Пароль для сохранения слишком короткий.');
            return;
        }
        dataToSend.password = changedPassword;
        hasChanges = true;
    }
    // Если пароль не менялся (changedPassword is null), поле password не добавляется в dataToSend,
    // и API не должен его требовать, если он не меняется.

    // Если нет изменений кроме email (который всегда отправляется), то не делаем запрос
    // Однако, спецификация "Отправлять на бэкенд только изменённые поля: имя пользователя, телефон, дату рождения, пароль (если был изменён). Email всегда брать из GET-запроса и отправлять вместе с остальными полями."
    // Это означает, что если ничего не изменилось, отправится только email.
    // Уточним: если hasChanges false, но email есть, отправляем только email.
    // Но лучше, если hasChanges false, вообще не отправлять или спросить пользователя.
    // Для простоты, если нет изменений, не отправляем.
    if (!hasChanges && Object.keys(dataToSend).length === 1 && dataToSend.hasOwnProperty('email')) {
         // Если только email и нет других изменений, можно считать, что изменений нет.
         // Однако, если API требует username, phone, birth_date даже если они не менялись,
         // тогда их нужно добавить из currentUserData.
         // Согласно "отправлять только изменённые поля", если username не менялся, его не должно быть.
         // Это делает структуру запроса динамической.
         // Если API требует все поля всегда, тогда:
         // dataToSend.username = dataToSend.username || currentUserData.username;
         // dataToSend.phone = dataToSend.phone !== undefined ? dataToSend.phone : currentUserData.phone;
         // dataToSend.birth_date = dataToSend.birth_date !== undefined ? dataToSend.birth_date : currentUserData.birth_date;
         // Но это противоречит "только изменённые".

         // Придерживаемся "только email + измененные". Если измененных нет, то dataToSend будет {email: "..."}
         // Если API ожидает такой запрос - ок. Если нет - нужно уточнение.
         // Если изменений нет, кроме email, то, возможно, не стоит делать запрос.
         if (!hasChanges) {
            showSuccess('Нет изменений для сохранения.');
            return;
         }
    }


    try {
        showLoader(true);
        // Убедимся, что все поля, которые могут быть null, корректно обрабатываются API
        // или не отправляются, если API не ожидает null для не измененных полей.
        // Текущая логика dataToSend уже формирует объект только с email + измененными полями.

        const updatedUserResponse = await api.updateUserProfile(dataToSend);
        showSuccess('Профиль успешно обновлен!');

        // Обновляем currentUserData и UI
        // Если сервер возвращает обновленный объект пользователя, используем его
        if (updatedUserResponse && Object.keys(updatedUserResponse).length > 0) {
            currentUserData = { ...currentUserData, ...updatedUserResponse };
        } else {
            // Иначе, обновляем на основе того, что отправили
            currentUserData = { ...currentUserData, ...dataToSend };
        }
        // Сбрасываем пароль из currentUserData и changedPassword
        if (currentUserData.password) delete currentUserData.password;
        changedPassword = null;
        changedBirthDate = currentUserData.birth_date || null; // Обновляем измененную дату

        // Перезагружаем профиль для консистентности отображения
        await loadUserProfile();

    } catch (error) {
        showError(document.body, 'Ошибка обновления профиля: ' + error.message);
    } finally {
        showLoader(false);
    }
}
