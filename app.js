// Configuracion basica
import express from 'express';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { PORT, SECRET_JWT_KEY, SESSION_SECRET } from './config.js';
import { UserRepository } from './src/models/user.js';
import { randomBytes, randomUUID } from 'node:crypto';

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
    // si hay sesion cookie, usarla; si no, probar JWT; si no, vacio
    const user = req.session?.user || req.sessionJwtUser || null;
    res.render('index', user ?? {});
})

// Este bloque de codigo devuelve al username de jimena como Administradora
// app.get('/', (req,res) => {
//     res.render('index', {username: "jimena"})
// })

// Auth endpoints
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

app.post('/login', async (req, res) => {
    const { username, password, method } = req.body;    // method: 'cookie' | 'jwt'
    try{
        const user = await UserRepository.login( { username, password });
        if (method == 'cookie'){
            // Rama A: sesion
            req.session.user = { id: user._id, username: user.username, role: user.role };
            csrfToken = GENERAR_TOKEN_ALEATORIO()             // doble submit token
            req.session.csrfToken = csrfToken
            res.status(200).send( { ok: true, method:'cookie', csrfToken });
        } else if (method == 'jwt'){
            // Rama B: JWT
            const access = jwt.sign({ sub: user._id, username: user.username, role: user.role }, 
                SECRET_JWT_KEY, 
                {
                expiresIn: '15m'
                })
            const refresh = jwt.sign({ sub: user._id, jti: UUID(), type: 'refresh'}, 
                SECRET_JWT_KEY, 
                {
                expiresIn: '7d'
                })
            res.cookie('refresh_token', refresh, { httpOnly: true,   // la cookie solo se puede acceder en el servidor
            sameSite: 'lax',    // 
            secure: false,      // 
            })
            res.status(200).send( { ok: true, method:'jwt', accessToken: access, exp:900 });
        }
    }catch(error){
        // NORMALMENTE NO ES LO IDEAL MANDAR EL ERROR DEL REPOSITORIO (porque puede tener informacion por de mas)
        res.status(401).send(error.message)
    }
})

// rama JWT
app.post('/token/refresh', (req, res) => {
    const refresh = req.cookies.refresh_token;
    if (!refresh){
        return res.status(401).send('Not authorized')
    }
    try{
        const payload = jwt.verify(refresh, SECRET_JWT_KEY);
        const access = jwt.sign({ sub: payload.sub, role: OBTENER_ROL(payload.sub)}, SECRET_JWT_KEY, { expiresIn: '15min'})
        return res.status(200).send({accessToken: access, exp:900})
    } catch(error){
        return res.status(401).send('Not authorized')
    }
})

app.post('/logout', (req, res) => {
    // si se uso cookie-session (rama A):
    if (req.session.user){
        req.session.destroy();
        res.clearCookie(csrfToken)
        return res.status(200).send({message: 'logout session ok'})
    }
    // si se uso refresh (rama B):
    res
    .clearCookie('refresh_token', refresh, { httpOnly: true,   // la cookie solo se puede acceder en el servidor
            sameSite: 'lax',    // 
            secure: false})
    .json( { message: 'logout jwt ok '})
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