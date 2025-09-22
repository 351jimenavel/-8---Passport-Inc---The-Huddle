// Configuracion basica
const express = require('express');

// Inicializar app
const app = express()
const port = 8080;

// Rutas
app.post('/login', (req, res) => {})
app.post('/register', (req, res) => {})
app.post('/logout', (req, res) => {})

app.get('/protected', (req, res) => {})

// Levantar servidor
app.listen(port, () => {
    console.log("Servidor corriendo en puerto", `http://localhost:${port}`);
});