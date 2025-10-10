import jwt from 'jsonwebtoken';
import { SECRET_JWT_KEY } from '../../config.js';
import { UserRepository } from '../models/user.js';
import { randomBytes, randomUUID } from 'node:crypto';
import db from '../db.js'

const isProd = process.env.NODE_ENV === 'production';

// helper simple
function generarCSRF() { return randomBytes(24).toString('hex') }

// obtener rol del user (de la DB)
function obtenerRol(userId) {
    const row = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    return row?.role || 'USER';
}

// obtener username y role por id (DB)
function obtenerUsuarioById(userId) {
    return db.prepare('SELECT username, role FROM users WHERE id = ?').get(userId);
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
        
        // Unificar id
        const userId = user.id ?? user._id;

        if (method === 'cookie'){
            // Rama A: sesion
            // >>> prevenir session fixation y refrescar CSRF <<<
            return req.session.regenerate(err => {
                if (err) {
                console.error('[LOGIN] regenerate error:', err);
                return res.status(500).send('Login failed');
            }

            req.session.user = { id: userId, username: user.username, role: user.role };
            const csrfToken = generarCSRF();             // doble submit token
            req.session.csrfToken = csrfToken;
            return res.status(200).send( { ok: true, method:'cookie', csrfToken: req.session.csrfToken });
        });
        }
        if (method === 'jwt'){
            // Rama B: JWT (access corto, refresh en cookie)
            const access = jwt.sign({ sub: userId, username: user.username, role: user.role }, 
                SECRET_JWT_KEY, 
                {
                expiresIn: '15m'
                })
            const refresh = jwt.sign({ sub: userId, jti: randomUUID(), type: 'refresh'}, 
                SECRET_JWT_KEY, 
                {
                expiresIn: '7d'
                })
            res.cookie('refresh_token', refresh, { httpOnly: true,   // la cookie solo se puede acceder en el servidor
            sameSite: 'lax',    // 
            secure: isProd,
            path: '/',
            })
            return res.status(200).send( { ok: true, method:'jwt', accessToken: access, exp:900 });
        } 
        return res.status(400).send('Invalid method');
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

        // Validar que realmente sea un refresh token
        if (payload.type !== 'refresh') {
            return res.status(401).send('Not authorized');
        }

        // Cargar usuario desde DB (username y role) usando sub
        const userRow = obtenerUsuarioById(payload.sub);
        if (!userRow) {
            return res.status(401).send('Not authorized');
        }

        // Firmar acces con las mismas claims que en login
        const access = jwt.sign({ sub: payload.sub, username: userRow.username, role: userRow.role }, SECRET_JWT_KEY, { expiresIn: '15m'});
        return res.status(200).send({accessToken: access, exp:900});
    } catch{
        return res.status(401).send('Not authorized');
    }
}

export const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'logout failed' });
        res.clearCookie('sid');
        return res.status(204).end();
    });
};