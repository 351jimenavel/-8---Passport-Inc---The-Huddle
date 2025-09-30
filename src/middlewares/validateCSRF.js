function validateCSRF(req,res,next){
    const st = req.session?.csrfToken;
    const ct = req.headers['x-csrf-token'];
    if (!st || !ct || st !== ct){
        return res.status(403).send('CSRF invalid');
    }
    next();
}

export default validateCSRF