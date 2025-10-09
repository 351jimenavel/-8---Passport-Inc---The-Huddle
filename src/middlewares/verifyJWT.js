import jwt from 'jsonwebtoken';
import { SECRET_JWT_KEY} from '../../config.js';

export default function verifyJWT(req, res, next){
    const auth = req.headers.authorization || '';

    if (!auth.startsWith('Bearer ')){
        return res.status(401).send('Unauthorized');
    }

    const token = auth.slice('Bearer '.length).trim(); // corta "Bearer "

    try{
        const payload = jwt.verify(token, SECRET_JWT_KEY);  // { sub, role, username }
        req.user = { id: payload.sub, role: payload.role, username: payload.username };
        next();
    }catch{
        res.status(401).send('Unauthorized');
    }
}