// Reescribir UserRepositoru con SQLite
import db from '../db.js'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcrypt';

export class UserRepository {
    static async create ( {username, password}) {
        Validation.username(username)
        Validation.password(password)

        // 2. Asegurarse que el username no existe
        const existsUser = db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)
        if (existsUser) throw new Error('username already exists')
        
        const id = randomUUID();
        const hashedPassword = await bcrypt.hash(password, 10)  
        // hashSync bloquea el thread principal
        // el numero es el salt_rounds (averiguar! el numero de vueltas que le va a dar)
        const info = db.prepare(`
        INSERT INTO users (id, username, password_hash, role)
        VALUES (?, ?, ?, 'USER')
        `).run(id, username, hashedPassword)
        console.log('[DB] insert users changes=', info.changes) // debería ser 1

        return id
    }
    static async login ( {username, password}) {
        Validation.username(username)
        Validation.password(password)

        const row = db.prepare(`
        SELECT id, username, password_hash, role
        FROM users WHERE username = ?
    `).get(username)
        if (!row) throw new Error('username does not exist')
        const isValid = await bcrypt.compare(password, row.password_hash)
        if (!isValid) throw new Error('password is invalid')
        return { _id: row.id, username: row.username, role: row.role }
    }

    static listAll(){
        const rows = db.prepare(`
        SELECT id, username, role, created_at FROM users ORDER BY created_at DESC
    `).all()
        return rows.map(r => ({ _id: r.id, username: r.username, role: r.role, createdAt: r.created_at }))
    }

    static deleteById(id){
        db.prepare('DELETE FROM users WHERE id = ?').run(id)
        return
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