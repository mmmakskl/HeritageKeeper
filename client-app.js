const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const app = express();

// Конфигурация
const PORT = 3020;
const APP_NAME = 'client1';
const APP_TOKEN = 'client1_secret_token';
const SSO_SERVER_URL = 'http://sso-server:3010';
const JWT_SECRET = 'your_jwt_secret_key';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'client_session_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Middleware аутентификации
function authenticate(req, res, next) {
  if (req.session.user) {
    return next();
  }
  
  const redirectURL = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
  res.redirect(`${SSO_SERVER_URL}/login?serviceURL=${encodeURIComponent(redirectURL)}`);
}

// Обработка SSO токена
app.use((req, res, next) => {
  const { ssoToken } = req.query;
  
  if (ssoToken) {
    return axios.get(`${SSO_SERVER_URL}/verify?ssoToken=${ssoToken}`, {
      headers: { Authorization: APP_TOKEN }
    })
    .then(response => {
      const { token } = response.data;
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.session.user = decoded;
        
        // Удаляем ssoToken из URL
        const redirectURL = req.originalUrl.split('?')[0];
        return res.redirect(redirectURL);
      } catch (err) {
        return next(err);
      }
    })
    .catch(err => next(err));
  }
  
  next();
});

// Защищенный маршрут
app.get('/protected', authenticate, (req, res) => {
  res.send(`Welcome ${req.session.user.name}! This is protected content.`);
});

// Выход
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect(`${SSO_SERVER_URL}/logout`);
});

app.listen(PORT, () => {
  console.log(`${APP_NAME} running on port ${PORT}`);
});

// Добавить обработку истечения сессии
app.use((req, res, next) => {
    if (req.session.user) {
      jwt.verify(req.session.user.token, JWT_SECRET, (err) => {
        if (err) {
          req.session.destroy();
          const redirectURL = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
          return res.redirect(`${SSO_SERVER_URL}/login?serviceURL=${encodeURIComponent(redirectURL)}`);
        }
        next();
      });
    } else {
      next();
    }
  });