import type { Express, RequestHandler } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "rla1022@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const requireAdmin: RequestHandler = (req, res, next) => {
  const claims = (req.user as any)?.claims;
  const email = (claims?.email || "").toLowerCase();
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({ error: "Forbidden", message: "This account is not authorized for admin access." });
  }
  next();
};

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const claims = req.user?.claims || {};
      const user = await authStorage.getUser(claims.sub);
      const email = (claims.email || "").toLowerCase();
      res.json({
        ...user,
        isAdmin: !!email && ADMIN_EMAILS.includes(email),
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
