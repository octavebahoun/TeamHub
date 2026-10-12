# Audit frontend WINE (`apps/web`) — 2026-10-04

Audit court avant livraison du périmètre Lead Frontend (Wasfade).

## Existant (conservé)

| Zone | État |
|------|------|
| Next.js App Router, 6 modules + auth + landing | Complet |
| Design tokens orange WINE + shadcn/Radix | Complet (light) |
| Auth forgot/reset | Complet (actions serveur Laravel) |
| Chat Socket.io (`use-chat`, `realtime-provider`) | Complet (sans pièces jointes) |
| CRM, projets, tâches Kanban, social, analytics, recherche | Complet UI |
| API serveur `lib/api` (cookies Sanctum) | Complet |

## Manques identifiés → traités

| Manque | Action |
|--------|--------|
| Pas de `NEXT_PUBLIC_USE_MOCKS` | Couche `lib/data` + APIs dual-mode |
| Pas de `lib/contravo` | SDK + proxies `/api/contravo/*` + UI |
| `FilesPanel` lecture seule | Upload pré-signé + statuts scan |
| Composer sans PJ / vocal | Pièces jointes + `VoiceRecorder` |
| Notifications limitées | Types Contravo + REST mock + badge |
| Pas de dark mode | Tokens `.dark` + `next-themes` |
| PWA absente | SW, manifest, offline, install, push UI |
| Analytics sans IA / santé financière | Widgets + mocks FastAPI |
| Recherche sans Cmd+K | Palette de commandes |
| Docs frontend incomplètes | Audit, notes, README mis à jour |

## Hypothèses

- Couleurs de marque : conservation de l’orange WINE existant (pas de bascule burgundy qui casserait le design system).
- Mode mock par défaut documenté dans `.env.example` ; prod → `NEXT_PUBLIC_USE_MOCKS=false`.
- Clé Contravo uniquement côté serveur Next (`CONTRAVO_API_KEY`).
