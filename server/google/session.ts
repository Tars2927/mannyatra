import * as jose from "jose";

export type SessionPayload = {
  unionId: string;
  clientId: string;
};

const JWT_ALG = "HS256";
const JWT_ISSUER = "mannyatra-app";
const JWT_AUDIENCE = "mannyatra-users";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || process.env.APP_SECRET || "";
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, getSecret(), {
      algorithms: [JWT_ALG],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    const { unionId, clientId } = payload;
    if (!unionId || !clientId) return null;
    return { unionId, clientId } as SessionPayload;
  } catch {
    return null;
  }
}
