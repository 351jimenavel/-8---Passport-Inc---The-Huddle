// Configuracion basica
const express = require('express');

// Inicializar app
const app = express()
const port = 8080;

// Levantar servidor
app.listen(port, () => {
    console.log("Servidor corriendo en puerto", `http://localhost:${port}`);
});