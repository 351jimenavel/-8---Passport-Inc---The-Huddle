import jwt from 'jsonwebtoken';
import { PORT, SECRET_JWT_KEY, SESSION_SECRET } from '../../config.js';
import { UserRepository } from '../models/user.js';
import { randomBytes, randomUUID } from 'node:crypto';
import db from '../db.js'

// helper simple
function generarCSRF() { return randomBytes(24).toString('hex') }

// obtener rol del user (de la DB)
function obtenerRol(userId) {
    const row = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    return row?.role || 'USER';
}

export const register = async (req, res) => {
    const { username, password } = req.body;
    try {
        const id = await UserRepository.create( { username, password });
        return res.status(201).json({ id })
    }catch(error){
        // NORMALMENTE NO ES LO IDEAL MANDAR EL ERROR DEL REPOSITORIO (porque puede tener informacion por de mas)
        console.error('[REGISTER] error:', error)
        const code = /UNIQUE/.test(String(error)) ? 409 : 400
        return res.status(code).send(error.message)
    }
}

export const login = async (req, res) => {
    const { username, password, method = 'cookie' } = req.body;    // method: 'cookie' | 'jwt', por defecto cookie
    try{
        const user = await UserRepository.login( { username, password });
        if (method === 'cookie'){
            // Rama A: sesion
            req.session.user = { id: user._id, username: user.username, role: user.role };
            const csrfToken = generarCSRF();             // doble submit token
            req.session.csrfToken = csrfToken;
            res.status(200).send( { ok: true, method:'cookie', csrfToken });
        } else if (method === 'jwt'){
            // Rama B: JWT (access corto, refresh en cookie)
            const access = jwt.sign({ sub: user._id, username: user.username, role: user.role }, 
                SECRET_JWT_KEY, 
                {
                expiresIn: '15m'
                })
            const refresh = jwt.sign({ sub: user._id, jti: randomUUID(), type: 'refresh'}, 
                SECRET_JWT_KEY, 
                {
                expiresIn: '7d'
                })
            res.cookie('refresh_token', refresh, { httpOnly: true,   // la cookie solo se puede acceder en el servidor
            sameSite: 'lax',    // 
            secure: false,      // 
            })
            return res.status(200).send( { ok: true, method:'jwt', accessToken: access, exp:900 });
        } else {
            return res.status(400).send('Invalid method');
        }
    }catch(error){
        console.error('[LOGIN] error:', error);
        // NORMALMENTE NO ES LO IDEAL MANDAR EL ERROR DEL REPOSITORIO (porque puede tener informacion por de mas)
        return res.status(401).send(error.message);
    }
}

export const refresh = (req, res) => {
    const refresh = req.cookies.refresh_token;
    if (!refresh){
        return res.status(401).send('Not authorized');
    }
    try{
        const payload = jwt.verify(refresh, SECRET_JWT_KEY);
        const role = obtenerRol(payload.sub);
        const access = jwt.sign({ sub: payload.sub, role}, SECRET_JWT_KEY, { expiresIn: '15m'});
        return res.status(200).send({accessToken: access, exp:900});
    } catch{
        return res.status(401).send('Not authorized');
    }
}

export const logout = (req, res) => {
    const cookieOpts = { httpOnly: true, sameSite: 'lax', secure: false };

    const finish = () => {
        // limpiamos ambas por si acaso (sesión y refresh)
        // nombre por defecto de express-session: 'connect.sid'
        res.clearCookie('connect.sid', cookieOpts);
        res.clearCookie('refresh_token', cookieOpts);
        return res.status(204).end();          // 204 = No Content (sin body)
    };

    // si se uso cookie-session (rama A):
    if (req.session?.user){
        req.session.destroy( err => {
            if (err){
                console.error('[LOGOUT] destroy error:', err);
                return res.status(500).json({ message: 'logout failed' });
            }
            return finish(); // <- importante: UN solo send
        });
    } else {
    // Rama JWT (no hay sesion cookie; igual limpiamos refresh)
        return finish();   // <- importante: return
    }
}