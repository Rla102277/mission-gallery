import type { Express, Request, Response, NextFunction } from "express";

const IMS_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3";
const IMS_USERINFO_URL = "https://ims-na1.adobelogin.com/ims/userinfo/v2";

function clientId(): string | undefined {
  return process.env.ADOBE_CLIENT_ID;
}

function clientSecret(): string | undefined {
  return process.env.ADOBE_CLIENT_SECRET;
}

export function defaultRedirectUri(): string {
  const base =
    process.env.CLIENT_URL ||
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
  // Public-ish: the client_id (API key) is needed by the admin browser for lr.adobe.io calls
  app.get("/api/adobe/client-id", ...guards, (_req, res) => {
    const id = clientId();
    if (!id) return res.status(500).json({ error: "ADOBE_CLIENT_ID not configured" });
    res.json({ clientId: id, redirectUri: defaultRedirectUri() });
  });

  // Exchange authorization code for access token
  app.post("/api/adobe/token", ...guards, async (req, res) => {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: "Authorization code required" });
    const id = clientId();
    const secret = clientSecret();
    if (!id || !secret) return res.status(500).json({ error: "Adobe client credentials are not configured" });

    const { ok, status, data } = await imsTokenRequest({
      grant_type: "authorization_code",
      client_id: id,
      client_secret: secret,
      code,
      redirect_uri: defaultRedirectUri(),
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

  // Validate a token via Adobe userinfo
  app.get("/api/adobe/test-token", ...guards, async (req, res) => {
    const token =
      (typeof req.query.token === "string" && req.query.token) ||
      req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(400).json({ error: "Token required" });
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
