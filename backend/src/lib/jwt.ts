import { SignJWT, jwtVerify } from "jose";

if (!process.env.JWT_SECRET) {
  console.error("[jwt] AVISO: JWT_SECRET não definido. Configure no Railway.");
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production-min-32-chars!!"
);

export interface JwtPayload {
  sub:        string;   // userId
  tenantId:   string;
  tenantSlug: string;
  role:       string;
  storeIds:   string[];
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JwtPayload;
}
