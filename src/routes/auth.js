import express from 'express';
const router = express.Router();
import * as auth from '../controllers/auth-controller.js';
import rateLimitLogin from '../middlewares/rateLimitLogin.js';
import  verifyJWT  from '../middlewares/verifyJWT.js';
import db from '../db.js';

function findUserById(id) {
    return db.prepare('SELECT username, role FROM users WHERE id = ?').get(id);
}

router.post('/register', auth.register);
router.post('/login', rateLimitLogin,auth.login);
router.post('/token/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.get('/api/me', verifyJWT ,(req,res) =>{
    const row = findUserById(req.user.id);
    if (!row){
        return res.status(404).send('Not found');
    }
    return res.json({ username: row.username, role: row.role });
});


export default router