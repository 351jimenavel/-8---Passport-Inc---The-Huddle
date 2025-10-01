import express from 'express';
const router = express.Router();
import * as auth from '../controllers/auth-controller.js';
import rateLimitLogin from '../middlewares/rateLimitLogin.js';


router.post('/register', auth.register);
router.post('/login', rateLimitLogin,auth.login);
router.post('/token/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.get('/me', (req,res) =>{
    const user = req.session?.user || null;
    if (!user){
        return res.status(401).send('Unauthorized')
    }
    return res.json(user)
});


export default router