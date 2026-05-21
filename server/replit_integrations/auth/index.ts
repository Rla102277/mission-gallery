export { setupAuth, isAuthenticated, getSession } from "./replitAuth";
export { authStorage, ensureAuthTables, type IAuthStorage } from "./storage";
export { registerAuthRoutes, requireAdmin } from "./routes";
