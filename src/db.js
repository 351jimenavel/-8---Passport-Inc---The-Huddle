import Database from "better-sqlite3";

const db = new Database('users.db', { fileMustExist: false })   // crea si no existe

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