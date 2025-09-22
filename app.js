// Configuracion basica
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');

// Inicializar app
const app = express()
const port = 8080;

// Use Helmet middleware
app.use(helmet());

// Use express.json() middleware
app.use(express.json());

// Use cookie-parser middleware
app.use(cookieParser()); // For unsigned cookies

// Testing middlewares

app.get('/', (req, res) => {
    res.send('Hello, secured world!');
});

app.post('api/users', (req, res) => {
    const userData = req.body;
    console.log(userData);
    res.json({message: 'User data receidev!', data: userData});
})

app.get('/cookie', (req, res) => {
    // req.cookies is now an object containing all cookies
    console.log(req.cookies);
    res.send('Check your console for cookie data');
})

// Levantar servidor
app.listen(port, () => {
    console.log("Servidor corriendo en puerto", `http://localhost:${port}`);
});