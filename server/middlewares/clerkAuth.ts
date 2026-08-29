import type { Express, RequestHandler } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import pg from "pg";
import {
  CLERK_PROXY_PATH,
  getClerkProxyHost,
} from "./clerkProxyMiddleware";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "rla1022@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email: string): boolean {
  return (
    ADMIN_EMAILS.includes(email) ||
    (process.env.NODE_ENV === "development" && email.endsWith("@example.com"))
  );
}

type DbUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
};

type ClerkIdentity = {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

declare global {
  namespace Express {
    interface Request {
      dbUser?: DbUser;
      clerkIdentity?: ClerkIdentity;
    }
  }
}

function rowToUser(row: any): DbUser {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    profileImageUrl: row.profile_image_url,
  };
}

export async function ensureAuthTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR PRIMARY KEY,
      sess JSONB NOT NULL,
      expire TIMESTAMP NOT NULL
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire)`,
  );
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

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const claims = auth.sessionClaims as Record<string, unknown> | null;
    const userId =
      (typeof claims?.userId === "string" && claims.userId) || auth.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let identity: ClerkIdentity = {
      email: typeof claims?.email === "string" ? claims.email : null,
      firstName:
        typeof claims?.firstName === "string" ? claims.firstName : null,
      lastName: typeof claims?.lastName === "string" ? claims.lastName : null,
    };
    let resolvedFromBackend = false;

    // Replit-managed Clerk normally includes identity in signed session claims.
    // Standard Clerk sessions may omit it, so resolve the verified identity
    // with the Clerk-native ID only in that exceptional path.
    if (!identity.email && auth.userId) {
      const clerkUser = await clerkClient.users.getUser(auth.userId);
      const primaryEmail = clerkUser.primaryEmailAddress;
      if (primaryEmail?.verification?.status === "verified") {
        identity = {
          email: primaryEmail.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
        };
        resolvedFromBackend = true;
      }
    }

    let result = await pool.query(
      `SELECT id, email, first_name, last_name, profile_image_url
       FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    );

    // If Clerk's standard claims only expose its native user ID, reconnect a
    // migrated account to the pre-existing local row by verified email.
    if (resolvedFromBackend && identity.email) {
      const byEmail = await pool.query(
        `SELECT id, email, first_name, last_name, profile_image_url
         FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [identity.email],
      );
      if (byEmail.rows.length) {
        result = byEmail;
      }
    }

    if (!result.rows.length) {
      await pool.query(
        `INSERT INTO users (id, email, first_name, last_name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        resolvedFromBackend
          ? [userId, identity.email, identity.firstName, identity.lastName]
          : [userId, null, null, null],
      );
      result = await pool.query(
        `SELECT id, email, first_name, last_name, profile_image_url
         FROM users WHERE id = $1 LIMIT 1`,
        [userId],
      );
    }

    if (!result.rows.length) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (resolvedFromBackend && identity.email && !result.rows[0].email) {
      const updated = await pool.query(
        `UPDATE users
         SET email = $2,
             first_name = COALESCE(first_name, $3),
             last_name = COALESCE(last_name, $4),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, email, first_name, last_name, profile_image_url`,
        [result.rows[0].id, identity.email, identity.firstName, identity.lastName],
      );
      if (updated.rows.length) {
        result = updated;
      }
    }

    req.dbUser = rowToUser(result.rows[0]);
    req.clerkIdentity = identity;
    next();
  } catch (error) {
    console.error("[Auth] Failed to resolve local user:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  const email = (
    req.clerkIdentity?.email || req.dbUser?.email || ""
  ).toLowerCase();
  if (!email || !isAdminEmail(email)) {
    return res.status(403).json({
      error: "Forbidden",
      message: "This account is not authorized for admin access.",
    });
  }
  next();
};

export function registerClerkAuthRoutes(app: Express): void {
  app.get("/api/auth/config", (req, res) => {
    const forwardedProtocol = req.headers["x-forwarded-proto"];
    const protocol =
      (Array.isArray(forwardedProtocol)
        ? forwardedProtocol[0]
        : forwardedProtocol) || req.protocol;
    const host = getClerkProxyHost(req);
    const productionProxyUrl =
      process.env.CLERK_PROXY_URL ||
      process.env.VITE_CLERK_PROXY_URL ||
      (host ? `${protocol}://${host}${CLERK_PROXY_PATH}` : "");

    res.json({
      publishableKey: publishableKeyFromHost(
        getClerkProxyHost(req) ?? "",
        process.env.CLERK_PUBLISHABLE_KEY,
      ),
      proxyUrl: process.env.NODE_ENV === "production" ? productionProxyUrl : "",
    });
  });

  app.get("/api/auth/user", requireAuth, (req, res) => {
    const email = req.clerkIdentity?.email || req.dbUser?.email || null;
    res.json({
      ...req.dbUser,
      email,
      firstName: req.clerkIdentity?.firstName || req.dbUser?.firstName || null,
      lastName: req.clerkIdentity?.lastName || req.dbUser?.lastName || null,
      isAdmin: !!email && isAdminEmail(email.toLowerCase()),
    });
  });
}