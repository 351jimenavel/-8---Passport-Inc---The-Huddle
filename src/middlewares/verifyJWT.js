import jwt from 'jsonwebtoken';
import { PORT, SECRET_JWT_KEY, SESSION_SECRET } from './config.js';

function verifyJWT(req, res, next){
    const auth = req.headers['authorization'] || '';
    const token = auth.replaces('Bearer', '');

    if (!token){
        return res.status(401).send('Unauthorized');
    }

    try{
        const payload = jwt.verify(token, SECRET_JWT_KEY);  // { sub, role, username }
        req.user = { id: payload.sub, role: payload.role, username: payload.username };
        next();
    }catch{
        return res.status(401).send('Unauthorized');
    }
}

export default verifyJWT