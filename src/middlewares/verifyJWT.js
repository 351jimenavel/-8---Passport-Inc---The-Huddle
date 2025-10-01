import jwt from 'jsonwebtoken';
import { SECRET_JWT_KEY} from '../../config.js';

function verifyJWT(req, res, next){
    const auth = req.headers.authorization || '';

    if (!auth.startsWith('Bearer ')){
        return res.status(401).send('Unauthorized');
    }

    const token = auth.slice(7).trim(); // corta "Bearer "

    try{
        const payload = jwt.verify(token, SECRET_JWT_KEY);  // { sub, role, username }
        req.user = { id: payload.sub, role: payload.role, username: payload.username };
        next();
    }catch{
        return res.status(401).send('Unauthorized');
    }
}

export default verifyJWT