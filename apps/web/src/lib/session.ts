/** Noms et options des cookies de session (partagés par le proxy, le client API et les actions). */
export const TOKEN_COOKIE = "wine_token";
export const ORG_COOKIE = "wine_org";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
