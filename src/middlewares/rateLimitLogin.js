import rateLimit from "express-rate-limit"

const loginLimiter = rateLimit({
    windowMs: 10*60*1000, max: 5,
    standardHeaders: true, legacyHeaders: false,
    message:'Too many login attempts. Try again later'
})

export default loginLimiter;