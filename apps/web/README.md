# WINE — frontend (`apps/web`)

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · shadcn/ui (Radix) · Socket.io.

## Démarrer

```bash
npm install
npm run mock:api      # API de démo sur http://localhost:8000/api (+ Socket.io)
npm run dev           # http://localhost:3000
```

`.env.local` (non versionné) :

```
API_URL=http://localhost:8000/api      # appels serveur vers l'API (Laravel ou mock)
NEXT_PUBLIC_WS_URL=http://localhost:8000
```

Compte de démo du mock : `octave@exemple.com` / `password` (propriétaire).
Autres rôles : `aicha@` (admin), `koffi@` (chef de projet), `mariam@` (membre), `nadege@` (invitée) — même mot de passe.
Invitation de démo : `/invitation/demo-invitation`.

Pour viser le vrai backend, remplacer `API_URL` par l'URL de Laravel (`…/api`).

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
dev/mock-api/                   # mock de développement (non embarqué dans le build)
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
| `npm run mock:api` | API de démonstration |
