function requireRole(roleNecesario){
    return (req, res, next) => {
        const user = req.user || req.session?.user || null;
        if (!user){
            return res.status(401).send('Unauthorized');
        }
        if (user.role !== roleNecesario){
            return res.status(403).send('Forbidden');
        }
        next();
    }
}

export default requireRole
