import express from 'express';
const router = express.Router();
import * as auth from '../controllers/auth-controller.js';
import rateLimitLogin from '../middlewares/rateLimitLogin.js';
import  verifyJWT  from '../middlewares/verifyJWT.js';
import db from '../db.js';
import { body, validationResult } from 'express-validator';

function findUserById(id) {
    return db.prepare('SELECT username, role FROM users WHERE id = ?').get(id);
}

const validateCreds = [
    body('username')
        .trim().escape()                 // sanitiza
        .isLength({ min: 3, max: 100 }).withMessage('username length 3..100'),
    body('password')
        .isString().isLength({ min: 6 }).withMessage('password min 6'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    }
];

router.post('/register', validateCreds ,auth.register);
router.post('/login', rateLimitLogin, validateCreds ,auth.login);
router.post('/token/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.get('/api/me', verifyJWT ,(req,res) =>{
    const row = findUserById(req.user.id);
    if (!row){
        return res.status(404).send('Not found');
    }
    return res.json({ username: row.username, role: row.role });
});

router.post('/token/logout', (req,res) => {
    res.clearCookie('refresh_token', { path:'/' });
    return res.status(204).end();
});

export default router