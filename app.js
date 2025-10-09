// Configuracion basica
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { PORT, SECRET_JWT_KEY, SESSION_SECRET } from './config.js';
import SQLiteStoreFactory from 'connect-sqlite3';

import authRoutes from './src/routes/auth.js'
import adminRoutesCookie from './src/routes/admin.js'           // versión cookie
// import adminRoutesJWT from './src/routes/admin.routes.jwt'       // si prefieres JWT

// Inicializar app
const app = express();
app.set('json spaces', 2);  // Esto hace que todos los res.json() se impriman con 2 espacios de indentación.
app.set('view engine', 'ejs');
app.use(express.json())
app.use(cookieParser())
app.use(helmet()) // cabeceras de seguridad
app.use(express.static('public'))

const SQLiteStore = SQLiteStoreFactory(session);

// ----- Rama Cookie (sesion real) -----
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.sqlite',
        dir:'./',
        ttl: 60 * 60, // 1h (en segundos)
    }),
    name: 'sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 60 * 60 * 1000
    }
}));

app.get('/', (req,res) => {
    // si hay sesion cookie, usarla; si no, probar JWT; si no, vacio
    const user = req.session?.user || null;
    res.render('index', user ?? {});
})

// Este bloque de codigo devuelve al username de jimena como Administradora
// app.get('/', (req,res) => {
//     res.render('index', {username: "jimena"})
// })

app.get('/protected', (req, res) => {
    const user = req.session?.user || null;
    if (!user){
        return res.status(403).send('Access not authorized');
    }
    return res.render('protected', user);
})

// Montar rutas modulares
app.use(authRoutes);        // /register, /login, /logout, /token/refresh
app.use(adminRoutesCookie); // /admin/users (requiere rol ADMIN)

app.get('/jwt', (req, res) => res.render('jwt'));

// Levantar servidor
app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto", `http://localhost:${PORT}`);
});