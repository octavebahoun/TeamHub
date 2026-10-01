import axios from 'axios';
import { config } from './config.js';

// Cookies posés par le frontend Next (httpOnly) : le navigateur les envoie
// au handshake WebSocket (même domaine), le jeton n'est jamais lisible en JS.
const TOKEN_COOKIE = 'wine_token';
const ORG_COOKIE = 'wine_org';

function parseCookies(header = '') {
  const cookies = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const raw = part.slice(i + 1).trim();
    try {
      cookies[part.slice(0, i).trim()] = decodeURIComponent(raw);
    } catch {
      cookies[part.slice(0, i).trim()] = raw;
    }
  }
  return cookies;
}

// `auth.token` reste accepté (scripts, tests, clients hors navigateur).
export function handshakeCredentials(handshake) {
  const cookies = parseCookies(handshake.headers?.cookie);
  return {
    token: handshake.auth?.token || cookies[TOKEN_COOKIE],
    organizationId: Number(handshake.auth?.organization_id) || Number(cookies[ORG_COOKIE]) || undefined,
  };
}

export async function verifyToken(token) {
  const { data } = await axios.post(
    `${config.apiBaseUrl}/api/internal/verify`,
    { token },
    {
      headers: {
        'X-Internal-Secret': config.internalSecret,
        Accept: 'application/json',
      },
      timeout: 5000,
    },
  );
  return data;
}
