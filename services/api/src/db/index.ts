import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const DB_PATH = join(process.cwd(), "data", "genesis.db");

let db: SqlJsDatabase;

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      token TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  saveDatabase();

  const count = db.exec("SELECT COUNT(*) as count FROM users");
  if (count.length > 0 && count[0].values[0][0] === 0) {
    seedDatabase();
  }

  console.log(`[genesis:db] Database initialized at ${DB_PATH}`);
}

export function getDatabase(): SqlJsDatabase {
  return db;
}

export function saveDatabase(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  const dir = join(process.cwd(), "data");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(DB_PATH, buffer);
}

function seedDatabase(): void {
  const now = new Date().toISOString();
  const defaultPassword = process.env.SEED_PASSWORD || crypto.randomBytes(16).toString("hex");
  const password = bcrypt.hashSync(defaultPassword, 10);

  db.run(
    `INSERT INTO users (id, email, name, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), "user@genesis.os", "Demo User", password, "user", now, now]
  );

  db.run(
    `INSERT INTO users (id, email, name, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), "admin@genesis.os", "Administrator", password, "admin", now, now]
  );

  saveDatabase();
  console.log("[genesis:db] Seed users created. Set SEED_PASSWORD env var to control initial passwords.");
}

export function query(sql: string, params?: any[]): any[] {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function execute(sql: string, params?: any[]): void {
  if (params) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
}
