// export default function requireAuthCookie(req, res, next):
//   IF !req.session?.user: return res.status(401).send('Unauthorized')
//   req.user = req.session.user
//   next()

function requireAuthCookie(req, res, next){
    if (!req.session?.user){
        return res.status(401).send('Unauthorized');
    }
    req.user = req.session.user;
    next();
}

export default requireAuthCookie