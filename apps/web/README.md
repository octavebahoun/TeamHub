# WINE — frontend (`apps/web`)

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · shadcn/ui (Radix) · Socket.io · PWA.

Lead Frontend & UX/PWA — périmètre Wasfade. Voir aussi [`docs/FRONTEND_AUDIT.md`](../../docs/FRONTEND_AUDIT.md) et [`docs/FRONTEND_NOTES.md`](../../docs/FRONTEND_NOTES.md).

## Démarrer

```bash
npm install
cp .env.example .env.local   # ajuste les valeurs
npm run dev                  # http://localhost:3000
```

### Mode réel (défaut)

```env
NEXT_PUBLIC_USE_MOCKS=false
API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
CONTRAVO_API_KEY=sk_test_...
CONTRAVO_ORG_ID=uuid-de-l-org
```

Lancer l’API Laravel (`apps/api`) et le realtime (`apps/realtime`) avant. La clé Contravo reste **uniquement côté serveur** Next (jamais `NEXT_PUBLIC_`).

### Mode mock (démo sans backend)

```env
NEXT_PUBLIC_USE_MOCKS=true
```

Toute l’UI fonctionne avec des données Afrique de l’Ouest (XOF, MoMo…). Aucune clé Contravo requise. La socket est simulée.

## Organisation du code

```
src/
├── app/
│   ├── (auth)/                 # connexion, inscription, mot-de-passe-oublié…
│   ├── (app)/                  # modules connectés + Cmd+K
│   ├── (marketing)/            # bienvenue, vérifier-signature
│   ├── api/contravo/           # proxies serveur (clé API masquée)
│   └── globals.css             # tokens light + dark
├── components/
│   ├── ui/ · common/ · shell/
│   ├── contravo/               # devis, facturation, inbox, livrables…
│   ├── media/                  # VoiceRecorder, AudioPlayer
│   ├── pwa/                    # SW, install, push
│   ├── theme/                  # next-themes
│   └── realtime/
├── lib/
│   ├── api/                    # client Laravel + modules dual-mode
│   ├── data/                   # USE_MOCKS + mocks
│   ├── contravo/               # SDK serveur + browser helpers
│   ├── uploads/                # flux pré-signé client
│   └── actions/
└── hooks/                      # useNotifications, useSearch, useAiSummary…
public/
├── sw.js · offline.html · manifest.webmanifest · icons/
```

Règle : un composant d’une seule page vit dans `_components/` ; dès qu’il sert deux écrans → `src/components/`.

**Aucun `fetch` métier direct dans les composants** : passer par `lib/api/*`, `lib/contravo/browser` ou les hooks.

## Design

- Tokens dans `globals.css` (`bg-primary`, `text-muted-foreground`, `.glass`, `.aurora-bg`…).
- Dark mode par défaut système (`next-themes`) + bascule dans la topbar.
- Polices : IBM Plex Sans + Source Serif 4.
- Mobile-first PWA : barre inférieure, zones tactiles, safe-areas.

## Fonctionnalités clés livrées

- Auth forgot / reset (messages neutres anti-énumération)
- Chat Socket.io + mode mock, PJ, notes vocales, badge connexion
- Notifications enrichies (facture, devis, WhatsApp, avis…)
- Upload pré-signé + scan : **pas de lien si `infected`**
- SDK Contravo + UI CRM / Facturation / Inbox
- Analytics : santé financière, bilan IA, assistant de relances, CSV
- Recherche globale `/recherche` + palette **Ctrl/⌘ K**
- PWA : service worker, offline, install, permission push contextuelle

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | développement |
| `npm run build` / `npm start` | production |
| `npm run lint` | ESLint |
| `npm test` | Vitest (formats, permissions, sécurité fichiers) |
