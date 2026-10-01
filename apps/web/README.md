# WINE — frontend (`apps/web`)

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · shadcn/ui (Radix) · Socket.io.

## Démarrer

Le frontend s'appuie uniquement sur le vrai backend : lancer d'abord l'API Laravel
(`apps/api`, port 8000) et le service temps réel (`apps/realtime`, port 4000).

```bash
npm install
npm run dev           # http://localhost:3000
```

`.env.local` (non versionné) :

```
API_URL=http://localhost:8000/api      # appels serveur vers l'API Laravel
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

Créer un compte via `/inscription` (crée aussi l'organisation).

## Organisation du code

```
src/
├── app/
│   ├── (auth)/                 # écrans publics : connexion, inscription, invitation…
│   │   └── connexion/
│   │       ├── page.tsx
│   │       └── _components/    # composants propres à la page
│   ├── (app)/                  # écrans connectés (coque : barre latérale + barre du haut)
│   │   ├── layout.tsx
│   │   ├── (accueil)/page.tsx  # « / »
│   │   ├── projets/ · projets/[id]/
│   │   ├── taches/ (Kanban) · taches/[id]/
│   │   ├── chat/ · social/ · analytics/
│   │   ├── crm/ · crm/pipeline/ · crm/[id]/
│   │   ├── parametres/membres/ · profil/ · recherche/
│   │   └── …/_components/
│   └── globals.css             # tokens de design (source unique des couleurs)
├── components/
│   ├── ui/                     # primitives shadcn (Button, Dialog…)
│   ├── common/                 # briques partagées (Panel, ToneBadge, UserAvatar…)
│   ├── shell/                  # navigation, barre du haut
│   ├── tasks/ · projects/ · realtime/
├── lib/
│   ├── api/                    # client HTTP serveur, types, lectures par écran
│   ├── actions/                # server actions (mutations), une par domaine
│   ├── domain.ts               # règles métier calculées (regroupements, progression…)
│   ├── labels.ts · format.ts · permissions.ts
└── hooks/
proxy.ts                        # redirection des pages privées sans session
```

Règle : un composant utilisé par une seule page vit dans le `_components/` de cette page ;
dès qu'il sert à deux écrans, il remonte dans `src/components/`.

## Design

- **Couleurs** : uniquement via les tokens de `globals.css` (`bg-primary`, `text-muted-foreground`,
  `bg-brand-soft`, `text-success`…). Aucune couleur en dur dans les composants.
- **Polices** : IBM Plex Sans (texte), Source Serif 4 (titres, `font-heading`).
- **Accessibilité** : audit axe-core WCAG 2.1 AA sans violation sur tous les écrans ; focus visible,
  lien d'évitement, formulaires étiquetés, Kanban et pipeline utilisables au clavier
  (menu « Déplacer vers », bouton « étape suivante »), graphiques doublés d'un tableau de données.

## Données et session

- Le jeton Sanctum est stocké dans un cookie `httpOnly` ; le navigateur n'appelle jamais l'API REST.
  Le WebSocket s'authentifie avec ce même cookie (envoyé au handshake), jamais via le JS.
  Lectures dans les server components (`lib/api/endpoints.ts`), écritures en server actions (`lib/actions`).
- Les rôles masquent les actions interdites (`lib/permissions.ts`) ; Laravel reste seul juge.
- Les besoins non couverts par l'API actuelle sont listés dans [`docs/api-gaps.md`](../../docs/api-gaps.md) :
  chaque écran a un repli tant que l'extension n'est pas déployée.

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` / `npm start` | build et serveur de production |
| `npm run lint` | ESLint (règles Next + React 19) |
| `npm test` | tests unitaires Vitest (règles métier, formats) |
