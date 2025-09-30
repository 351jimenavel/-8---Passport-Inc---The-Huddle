import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'users.db')  // guarda el .db siempre en la raíz del proyecto

console.log('[DB] usando', DB_PATH)

const db = new Database(DB_PATH, { fileMustExist: false })

// PRAGMAS recomendados
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('foreign_keys = ON')

// Crear tablas si no existen
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER','ADMIN')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
`);

export default db