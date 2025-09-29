// Configuracion basica
//const express = require('express');
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { PORT, SECRET_JWT_KEY } from './config.js';
//const jwt = require('jsonwebtoken');
import { UserRepository } from './src/models/user.js';
//const { UserRepository } = require('./src/models/user');

// Inicializar app
const app = express()
app.set('view engine', 'ejs');
app.use(express.json())
app.use(cookieParser())

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
        const token = jwt.sign({ id: user._id, username: user.username }, 
            SECRET_JWT_KEY, 
            {
            expiresIn: '1h'
            })
        res.cookie('access_token', token, { httpOnly: true,   // la cookie solo se puede acceder en el servidor
        sameSite: 'lax',    // 
        secure: false,      // 
        maxAge: 1000 * 60 * 60  // la cookie tiene un tiempo de validez de 1h
        })
        res.send( { user, token });
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
    // TODO: if sesion del usuario
    res.render('protected', {username: 'jimenaa'})
    // TODO: else 401
})

// Levantar servidor
app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto", `http://localhost:${PORT}`);
});