# Service data — analytics, bilan IA, relances

Périmètre Jean-Baptiste (Data / IA / temps réel / DevOps).
Le service `apps/data` n’est joignable que depuis Laravel (`DATA_SERVICE_URL` + `X-Internal-Secret`).

## REST Laravel (`/api/v1`, rôles owner / admin / manager)

| Route | Service data | Contenu |
| --- | --- | --- |
| `GET /analytics/overview` | `/stats/overview` | KPIs + `profitability` + charge |
| `GET /analytics/pipeline` | `/stats/pipeline` | Montants par étape CRM |
| `GET /analytics/profitability` | `/stats/profitability` | Gagné / perdu / ouvert, `win_rate` |
| `GET /analytics/activity` | `/stats/activity` | Journal `activities` |
| `GET /analytics/summary` | `/summary` | Bilan de la semaine ISO (Gemini ou repli) |
| `GET /analytics/relances` | `/relances` | Messages de relance CRM |

Un chef de projet (`manager`) est automatiquement scopé (`owner_id` = son id).

## Repli sans `GEMINI_API_KEY`

`source` vaut `"fallback"` : le récit et les messages restent déterministes, les écrans restent utilisables.

## Temps réel

Socket.io (`apps/realtime`) : canaux projet / general / directs, pont Redis
(`wine:notifications`, `wine:user:revoked`, `wine:project:events`).
Le navigateur envoie le cookie `wine_token` au handshake.

## DevOps

- CI monorepo : `.github/workflows/ci.yml` (Pest, Vitest, pytest, tests Node)
- HTTPS : `infra/Caddyfile` + `infra/Caddyfile.snippet`
- Sauvegardes : `infra/backup.sh` (Postgres + Mongo, option R2)
