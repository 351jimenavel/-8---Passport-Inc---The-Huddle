import db from '../src/db.js'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcrypt';
import '../config.js';

const ADMIN_PASS = ADMIN_SEED_PASSWORD;

( async () => {

    if (!ADMIN_PASS) throw new Error('Set ADMIN_SEED_PASSWORD');
    
    const exists = db.prepare('SELECT 1 FROM users WHERE username = ?').get(ADMIN_USER)
    if (exists){
        console.log('Admin ya existe');
        process.exit(0);
    }
    
    const id = randomUUID();
    const hash = await bcrypt.hash(ADMIN_PASS, 10);
    db.prepare(`INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, 'ADMIN')`).run(id, ADMIN_USER, hash);
    
    console.log('Admin creado');
    
})();