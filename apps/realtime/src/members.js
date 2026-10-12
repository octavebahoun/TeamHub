import axios from 'axios';
import { config } from './config.js';

// Annuaire des membres d'une organisation, servi par Laravel
// (GET /api/internal/organizations/{id}/members). Cache court en mémoire :
// channel:list le consulte à chaque ouverture du chat.
const TTL_MS = 30_000;
const cache = new Map();

export async function organizationMembers(organizationId) {
  const hit = cache.get(organizationId);
  if (hit && hit.expiresAt > Date.now()) return hit.members;

  const { data } = await axios.get(
    `${config.apiBaseUrl}/api/internal/organizations/${organizationId}/members`,
    {
      headers: {
        'X-Internal-Secret': config.internalSecret,
        Accept: 'application/json',
      },
      timeout: 5000,
    },
  );

  const members = data.members ?? [];
  cache.set(organizationId, { members, expiresAt: Date.now() + TTL_MS });
  return members;
}
