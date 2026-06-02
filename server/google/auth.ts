import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import * as cookie from "cookie";
import crypto from "crypto";
import { env } from "../lib/env";
import { getSessionCookieOptions } from "../lib/cookies";
import { Session } from "../../contracts/constants";
import { Errors } from "../../contracts/errors";
import { signSessionToken, verifySessionToken } from "./session";
import { findUserByUnionId, upsertUser } from "../queries/users";

// ── Google OAuth types ────────────────────────────────────────────────────────
type GoogleTokenResponse = {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

type GoogleUserInfo = {
  id: string;
  name: string;
  email: string;
  picture: string;
  verified_email: boolean;
};

// ── CSRF-safe state parameter ─────────────────────────────────────────────────
// The state param encodes: nonce + HMAC(nonce + redirectUri)
// This prevents CSRF attacks on the OAuth callback
function createOAuthState(redirectUri: string): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const hmac = crypto
    .createHmac("sha256", env.sessionSecret)
    .update(nonce + redirectUri)
    .digest("hex");
  // Pack as: nonce.hmac.base64(redirectUri)
  return `${nonce}.${hmac}.${Buffer.from(redirectUri).toString("base64url")}`;
}

function verifyOAuthState(state: string): string | null {
  const parts = state.split(".");
  if (parts.length !== 3) return null;
  const [nonce, hmac, encodedUri] = parts;
  const redirectUri = Buffer.from(encodedUri, "base64url").toString();
  const expectedHmac = crypto
    .createHmac("sha256", env.sessionSecret)
    .update(nonce + redirectUri)
    .digest("hex");
  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
    return null;
  }
  return redirectUri;
}

// ── Google OAuth URL builder ──────────────────────────────────────────────────
export function createGoogleAuthUrl(redirectUri: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.googleClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", createOAuthState(redirectUri));
  return url.toString();
}

// ── Exchange auth code for tokens ─────────────────────────────────────────────
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.googleClientId,
    client_secret: env.googleClientSecret,
    redirect_uri: redirectUri,
  });

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Google token exchange failed (${resp.status}): ${text}`);
  }

  return resp.json() as Promise<GoogleTokenResponse>;
}

// ── Fetch Google user profile ─────────────────────────────────────────────────
export async function getGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const resp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Google userinfo failed (${resp.status}): ${text}`);
  }

  return resp.json() as Promise<GoogleUserInfo>;
}

// ── Authenticate incoming request via session cookie ──────────────────────────
export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) {
    throw Errors.forbidden("Invalid authentication token.");
  }
  const claim = await verifySessionToken(token);
  if (!claim) {
    throw Errors.forbidden("Invalid authentication token.");
  }
  const user = await findUserByUnionId(claim.unionId);
  if (!user) {
    throw Errors.forbidden("User not found. Please re-login.");
  }
  return user;
}

// ── Google OAuth redirect handler ─────────────────────────────────────────────
// GET /api/auth/google → redirects browser to Google consent screen
export function createGoogleAuthRedirectHandler() {
  return (c: Context) => {
    const url = new URL(c.req.url);
    const proto = c.req.header("x-forwarded-proto") || url.protocol.replace(":", "");
    const host = c.req.header("x-forwarded-host") || url.host;
    const origin = `${proto}://${host}`;
    const redirectUri = `${origin}/api/oauth/callback`;
    const authUrl = createGoogleAuthUrl(redirectUri);
    return c.redirect(authUrl, 302);
  };
}

// ── OAuth callback handler ────────────────────────────────────────────────────
// GET /api/oauth/callback?code=xxx&state=xxx
export function createOAuthCallbackHandler() {
  return async (c: Context) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");

    if (error) {
      if (error === "access_denied") {
        return c.redirect("/login", 302);
      }
      return c.json({ error: "OAuth error" }, 400);
    }

    if (!code || !state) {
      return c.json({ error: "code and state are required" }, 400);
    }

    // Verify CSRF state
    const redirectUri = verifyOAuthState(state);
    if (!redirectUri) {
      return c.json({ error: "Invalid OAuth state — possible CSRF" }, 403);
    }

    try {
      const tokenResp = await exchangeGoogleCode(code, redirectUri);
      const userInfo = await getGoogleUserInfo(tokenResp.access_token);

      // Upsert user — Google `id` (sub) maps to our `unionId`
      await upsertUser({
        unionId: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.picture,
        lastSignInAt: new Date(),
      });

      const token = await signSessionToken({
        unionId: userInfo.id,
        clientId: "google",
      });

      const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
      setCookie(c, Session.cookieName, token, {
        ...cookieOpts,
        maxAge: Session.maxAgeMs / 1000,
      });

      return c.redirect("/", 302);
    } catch (err) {
      console.error("[OAuth] Google callback failed", err);
      return c.json({ error: "OAuth callback failed" }, 500);
    }
  };
}
