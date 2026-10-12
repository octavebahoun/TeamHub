# Pont Contravo (apps/web)

- **SDK serveur** : `src/lib/contravo/*` — `CONTRAVO_API_KEY` uniquement côté Node.
- **Navigateur** : `src/lib/contravo/browser.ts` → `/api/contravo/*` (session WINE requise).
- **Mocks** : `NEXT_PUBLIC_USE_MOCKS=true` — données XOF / Afrique de l’Ouest sans appel réseau Contravo.
- **OpenAPI** : https://contravo.excellenceteam.site/api/v1/openapi.json
