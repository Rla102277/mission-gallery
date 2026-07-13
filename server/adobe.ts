import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";

const IMS_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3";
const IMS_USERINFO_URL = "https://ims-na1.adobelogin.com/ims/userinfo/v2";
const STATE_COOKIE = "lr_oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;

function stateSecret(): string {
  return process.env.SESSION_SECRET || process.env.ADOBE_CLIENT_SECRET || "lr-state-fallback";
}

function signState(payload: string): string {
  return crypto.createHmac("sha256", stateSecret()).update(payload).digest("base64url");
}

function createState(): string {
  const payload = `${crypto.randomBytes(16).toString("base64url")}.${Date.now()}`;
  return `${payload}.${signState(payload)}`;
}

function verifyState(state: string): boolean {
  const parts = String(state || "").split(".");
  if (parts.length !== 3) return false;
  const [nonce, ts, sig] = parts;
  const payload = `${nonce}.${ts}`;
  const expected = signState(payload);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return false;
  const age = Date.now() - Number(ts);
  return Number.isFinite(age) && age >= 0 && age <= STATE_TTL_MS;
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

function clientId(): string | undefined {
  return process.env.ADOBE_CLIENT_ID;
}

function clientSecret(): string | undefined {
  return process.env.ADOBE_CLIENT_SECRET;
}

export function defaultRedirectUri(req?: Request): string {
  // Prefer the domain the admin is actually browsing on (works for custom domains
  // like infinitearchphoto.com). trust proxy is enabled, so req.hostname honors
  // X-Forwarded-Host behind Replit's proxy. Adobe rejects unregistered URIs, so a
  // spoofed Host header gains nothing.
  const reqHost =
    req && req.hostname && !/^(localhost|127\.0\.0\.1)$/i.test(req.hostname) ? req.hostname : "";
  const base = reqHost
    ? `https://${reqHost}`
    : process.env.CLIENT_URL ||
      (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "") ||
      (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "");
  return `${base.replace(/\/$/, "").replace("http:", "https:")}/test/lightroom`;
}

async function imsTokenRequest(params: Record<string, string>) {
  const response = await fetch(IMS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export function registerAdobeRoutes(
  app: Express,
  guards: Array<(req: Request, res: Response, next: NextFunction) => any>
) {
  // Public-ish: the client_id (API key) is needed by the admin browser for lr.adobe.io calls.
  // Also issues a signed OAuth state, double-bound via an HttpOnly cookie.
  app.get("/api/adobe/client-id", ...guards, (req, res) => {
    const id = clientId();
    if (!id) return res.status(500).json({ error: "ADOBE_CLIENT_ID not configured" });
    const state = createState();
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: STATE_TTL_MS,
      path: "/",
    });
    res.json({ clientId: id, redirectUri: defaultRedirectUri(req), state });
  });

  // Exchange authorization code for access token (requires valid OAuth state)
  app.post("/api/adobe/token", ...guards, async (req, res) => {
    const { code, state } = req.body || {};
    if (!code) return res.status(400).json({ error: "Authorization code required" });
    const cookieState = readCookie(req, STATE_COOKIE);
    if (!state || !cookieState || state !== cookieState || !verifyState(state)) {
      return res.status(400).json({ error: "Invalid or expired OAuth state. Please restart the connection." });
    }
    res.clearCookie(STATE_COOKIE, { path: "/" });
    const id = clientId();
    const secret = clientSecret();
    if (!id || !secret) return res.status(500).json({ error: "Adobe client credentials are not configured" });

    const { ok, status, data } = await imsTokenRequest({
      grant_type: "authorization_code",
      client_id: id,
      client_secret: secret,
      code,
      redirect_uri: defaultRedirectUri(req),
    });
    if (!ok) {
      console.log("[Adobe] Token exchange error:", status, JSON.stringify(data).slice(0, 300));
      return res.status(500).json({ error: "Failed to exchange code for token", details: data });
    }
    res.json(data);
  });

  // Refresh an access token using a refresh token
  app.post("/api/adobe/refresh-token", ...guards, async (req, res) => {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });
    const id = clientId();
    const secret = clientSecret();
    if (!id || !secret) return res.status(500).json({ error: "Adobe client credentials are not configured" });

    const { ok, status, data } = await imsTokenRequest({
      grant_type: "refresh_token",
      client_id: id,
      client_secret: secret,
      refresh_token: refreshToken,
    });
    if (!ok) {
      console.log("[Adobe] Refresh token error:", status, JSON.stringify(data).slice(0, 300));
      return res.status(status || 500).json({ error: "Failed to refresh Adobe token", details: data });
    }
    res.json(data);
  });

  // Validate a token via Adobe userinfo (Bearer header only — never tokens in URLs)
  app.get("/api/adobe/test-token", ...guards, async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(400).json({ error: "Token required (Authorization: Bearer)" });
    try {
      const response = await fetch(IMS_USERINFO_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return res.status(401).json({ valid: false, error: "Invalid or expired token", details: data });
      }
      res.json({ valid: true, user: data, message: "Token is valid" });
    } catch (err: any) {
      res.status(500).json({ valid: false, error: err.message });
    }
  });
}
