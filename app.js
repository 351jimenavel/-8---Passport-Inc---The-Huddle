// Configuracion basica
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { PORT, SECRET_JWT_KEY, SESSION_SECRET } from './config.js';
import { UserRepository } from './src/models/user.js';


// Inicializar app
const app = express()
app.set('view engine', 'ejs');
app.use(express.json())
app.use(cookieParser())
app.use(helmet()) // cabeceras de seguridad

// ----- Rama Cookie (sesion real) -----
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 60 * 60 * 1000
    }
}))

// ----- Autenticacion por JWT en cada request (para vistas)
//// Middleware Leer JWT desde Cookie
app.use((req, res, next) => {
    const token = req.cookies.access_token;
    req.sessionJwtUser = null;

    if (token){
        try {
            const data = jwt.verify(token, SECRET_JWT_KEY);
            req.sessionJwtUser = data;  // { id, username, role }
        } catch(error){
            req.sessionJwtUser = null;
        }
    }
    next();     // seguir a la siguiente ruta o middleware
})

// Middleware - Rama Cookie
app.use((req, res, next) => {
    const token = req.cookies.access_token;
    req.session = { user: null };

    try {
        const data = jwt.verify(token, SECRET_JWT_KEY);
        req.session.user = data;
    } catch(error){
        req.session.user = null;
    }
    next();     // seguir a la siguiente ruta o middleware
})

app.get('/', (req,res) => {
    const { user } = req.session
    res.render('index', user)

    // const token = req.cookies.access_token
    // if (!token){
    //     res.render('index')
    // }
    
    // try{
    //     const data = jwt.verify(token, SECRET_JWT_KEY)
    //     res.render('index', data)   // date es el payload --> { _id, username }
    // } catch(error){
    //     res.render('index')
    // }
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
app.post('/logout', (req, res) => {
    res
    .clearCookie('access_token')
    .json( { message: 'logout successful '})
})

app.get('/protected', (req, res) => {
    const { user } = req.session;
    if (!user){
        return res.status(403).send('Access not authorized')
    }
    res.render('protected', user)
    // const token = req.cookies.access_token
    // if (!token){
    //     return res.status(403).send('Access not authorized')
    // }

    // try{
    //     const data = jwt.verify(token, SECRET_JWT_KEY)
    //     res.render('protected', data)   // date es el payload --> { _id, username }
    // } catch(error){
    //     return res.status(403).send('Access not authorized')
    // }
})

// Levantar servidor
app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto", `http://localhost:${PORT}`);
});