// Configuracion basica
const express = require('express');
const { UserRepository } = require('./src/models/user');

// Inicializar app
const app = express()
app.set('view engine', 'ejs');
app.use(express.json())
const port = 8080;

app.get('/', (req,res) => {
    res.render('index')
})

// Este bloque de codigo devuelve al username de jimena como Administradora
// app.get('/', (req,res) => {
//     res.render('index', {username: "jimena"})
// })

// Rutas
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try{
        const user = await UserRepository.login( { username, password });
        res.send( { user });
    }catch(error){
        // NORMALMENTE NO ES LO IDEAL MANDAR EL ERROR DEL REPOSITORIO (porque puede tener informacion por de mas)
        res.status(401).send(error.message)
    }
})

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    console.log(req.body);

    try {
        const id = await UserRepository.create( { username, password });
        res.send( { id });
    }catch(error){
        // NORMALMENTE NO ES LO IDEAL MANDAR EL ERROR DEL REPOSITORIO (porque puede tener informacion por de mas)
        res.status(400).send(error.message)
    }
})
app.post('/logout', (req, res) => {})

app.get('/protected', (req, res) => {
    res.render('')
})

// Levantar servidor
app.listen(port, () => {
    console.log("Servidor corriendo en puerto", `http://localhost:${port}`);
});