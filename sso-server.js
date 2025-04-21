const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

// Конфигурация
const PORT = 3010;
const JWT_SECRET = 'your_jwt_secret_key';
const SSO_SERVER_URL = 'http://sso-server:3010';

// Хранилища данных (в реальном приложении используйте БД)
const usersDB = {
  'user@example.com': {
    password: 'password123',
    name: 'Test User',
    id: 'user123'
  }
};

const allowedOrigins = {
  'http://client1:3020': true,
  'http://client2:3030': true
};

const appTokens = {
  'client1': 'client1_secret_token',
  'client2': 'client2_secret_token'
};

const activeSessions = {}; // Глобальные сессии

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'sso_session_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // В production используйте true с HTTPS
}));

// Генерация токена
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Маршруты SSO сервера

// Страница входа
app.get('/login', (req, res) => {
  const { serviceURL } = req.query;
  
  // Проверка разрешенного origin
  if (serviceURL) {
    const url = new URL(serviceURL);
    if (!allowedOrigins[url.origin]) {
      return res.status(400).send('Not allowed origin');
    }
  }
  
  // Если уже авторизован
  if (req.session.user && serviceURL) {
    const ssoToken = generateToken();
    activeSessions[ssoToken] = {
      userId: req.session.user.id,
      serviceURL: serviceURL
    };
    return res.redirect(`${serviceURL}?ssoToken=${ssoToken}`);
  }
  
  // Показать форму входа
  res.send(`
    <form method="POST" action="/login?serviceURL=${serviceURL || ''}">
      <input type="email" name="email" placeholder="Email" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  `);
});

// Обработка входа
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const { serviceURL } = req.query;
  
  // Проверка учетных данных
  if (!usersDB[email] || usersDB[email].password !== password) {
    return res.status(401).send('Invalid credentials');
  }
  
  // Создание глобальной сессии
  req.session.user = {
    id: usersDB[email].id,
    email: email,
    name: usersDB[email].name
  };
  
  // Перенаправление с токеном
  if (serviceURL) {
    const ssoToken = generateToken();
    activeSessions[ssoToken] = {
      userId: req.session.user.id,
      serviceURL: serviceURL
    };
    return res.redirect(`${serviceURL}?ssoToken=${ssoToken}`);
  }
  
  res.redirect('/');
});

// Верификация SSO токена
app.get('/verify', (req, res) => {
  const { ssoToken } = req.query;
  const appToken = req.headers['authorization'];
  
  if (!ssoToken || !activeSessions[ssoToken]) {
    return res.status(400).json({ error: 'Invalid token' });
  }
  
  // Проверка токена приложения
  const appName = Object.keys(appTokens).find(key => appTokens[key] === appToken);
  if (!appName) {
    return res.status(403).json({ error: 'Unauthorized application' });
  }
  
  const sessionData = activeSessions[ssoToken];
  const user = usersDB[sessionData.userId];
  
  // Генерация JWT
  const token = jwt.sign({
    userId: user.id,
    email: user.email,
    name: user.name,
    app: appName
  }, JWT_SECRET, { expiresIn: '1h' });
  
  // Удаление использованного токена
  delete activeSessions[ssoToken];
  
  res.json({ token });
});

// Выход из системы
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.send('Logged out successfully');
});

app.listen(PORT, () => {
  console.log(`SSO Server running on port ${PORT}`);
});

// Добавить middleware для проверки origin
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && !allowedOrigins[origin]) {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
    next();
  });