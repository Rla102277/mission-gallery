import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function ensureAuthTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR PRIMARY KEY,
      sess JSONB NOT NULL,
      expire TIMESTAMP NOT NULL
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire)`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY,
      email VARCHAR UNIQUE,
      first_name VARCHAR,
      last_name VARCHAR,
      profile_image_url VARCHAR,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export interface UpsertUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
}

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    profileImageUrl: row.profile_image_url,
  };
}

export const authStorage: IAuthStorage = {
  async getUser(id: string) {
    const r = await pool.query(
      "SELECT id, email, first_name, last_name, profile_image_url FROM users WHERE id=$1",
      [id]
    );
    return r.rows.length ? rowToUser(r.rows[0]) : undefined;
  },
  async upsertUser(u: UpsertUser) {
    const r = await pool.query(
      `INSERT INTO users (id, email, first_name, last_name, profile_image_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         profile_image_url = EXCLUDED.profile_image_url,
         updated_at = NOW()
       RETURNING id, email, first_name, last_name, profile_image_url`,
      [u.id, u.email ?? null, u.firstName ?? null, u.lastName ?? null, u.profileImageUrl ?? null]
    );
    return rowToUser(r.rows[0]);
  },
};
