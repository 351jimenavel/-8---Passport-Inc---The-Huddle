// const DBLocal = require('db-local');
// ESM (recomendado)
import DBLocal from 'db-local';
import { createHash, randomBytes, createHmac, pbkdf2 } from 'node:crypto';
import bcrypt from 'bcrypt';

const { Schema } = new DBLocal({ path: './db'});

// Estructura con contrato similar para poder migrar a otras dbs
const User = Schema('User',{
    _id: { type: String, require: true},
    username: { type: String, require: true},
    password: { type: String, require: true}
})

export class UserRepository {
    static async create ( {username, password}) {
        Validation.username(username)
        Validation.password(password)

        // 2. Asegurarse que el username no existe
        const user = User.findOne({ username })
        if (user) throw new Error('username already exists')
        
        const id = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(password, 5)  
        // hashSync bloquea el thread principal
        // el numero es el salt_rounds (averiguar! el numero de vueltas que le va a dar)

        User.create({
            _id: id,
            username,
            password:hashedPassword
        }).save()

        return id
    }
    static async login ( {username, password}) {
        Validation.username(username)
        Validation.password(password)

        const user = User.findOne( { username })
        if (!user) throw new Error('username does not exist')

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) throw new Error('password is invalid')
        const { password: _, ...publicUser} = user
        return publicUser
    }
}

class Validation {
    static username (username){
        // 1. Validaciones de username
        if (typeof username != 'string') throw new Error('usarname must be a string')
        if (username.length < 3) throw new Error('usarname must be at least 3 characters long')
    }

    static password (password){
        // 2. Validaciones para contrasenha
        if (typeof password != 'string') throw new Error('password must be a string')
        if (password.length < 6) throw new Error('password must be at least 6 characters long')
    }
}