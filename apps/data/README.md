# WINE — service data (`apps/data`)

FastAPI interne : statistiques, bilan hebdomadaire (Gemini) et suggestions de relances.
Jamais exposé par Caddy. Laravel proxy via `INTERNAL_SECRET`.

## Démarrer

```bash
uv sync --group dev
uv run uvicorn main:app --reload --port 8001
uv run pytest
```

Variables (voir `.env.example`) : `INTERNAL_SECRET`, `DATABASE_URL`, `MONGO_URL`, `GEMINI_API_KEY`.

## Routes

| Route | Rôle |
| --- | --- |
| `GET /stats/overview` | Projets actifs, retards, charge, rentabilité |
| `GET /stats/pipeline` | Montants CRM par étape |
| `GET /stats/profitability` | Gagné / perdu / ouvert, taux de conversion |
| `GET /stats/activity` | Événements `activities` sur N jours |
| `GET /summary` | Bilan de la semaine (Gemini, repli déterministe) |
| `GET /relances` | Messages de relance CRM (Gemini, repli modèle) |

Toutes les routes (sauf `/health`) exigent `X-Internal-Secret`. Paramètre `org` obligatoire ; `owner_id` pour scoper un chef de projet.
