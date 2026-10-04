# Notes frontend WINE — hypothèses & bascules

## Hypothèses raisonnables

1. **Marque** : on garde les tokens `--wine-orange-*` déjà en prod visuelle ; dark mode bleu-noir + glass autour.
2. **Mocks** : données Afrique de l’Ouest (Cotonou, Porto-Novo, Abidjan, Lomé, Dakar), montants XOF, MTN MoMo / Moov / Celtiis.
3. **Realtime mock** : si `NEXT_PUBLIC_USE_MOCKS=true`, socket simulée (messages, typing, présence, notifications) même sans `NEXT_PUBLIC_WS_URL`.
4. **Contravo** : en mock, aucun appel réseau vers Contravo ; en réel, proxy Next lit `CONTRAVO_API_KEY` (`sk_test_…` en sandbox).
5. **Fichiers infectés** : jamais de lien de téléchargement si `status === "infected"` (test Vitest).
6. **Fuseau** : affichage `fr-FR` ; échéances relatives via `date-fns` (réf. Africa/Porto-Novo côté produit).

## Basculer mock → réel

```env
NEXT_PUBLIC_USE_MOCKS=false
API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
CONTRAVO_API_KEY=sk_test_...
CONTRAVO_ORG_ID=uuid-de-l-org
```

Les composants appellent les mêmes hooks / helpers ; seul le backend des fonctions change.

## Reste dépendant backend

- Scan antivirus réel R2 (mock simule clean/infected).
- Push Web Push VAPID (UI de permission prête ; abonnement serveur à brancher).
- Pas de `GET /v1/ai/summary` ni de `GET /v1/analytics/profitability` : le bilan et la santé financière lisent `analytics/overview` et `analytics/pipeline`.
- Pas de `GET /v1/files` : les pièces jointes viennent du projet ou de la tâche, le téléchargement de `GET /v1/attachments/{id}/download`.
- La cloche lit `GET /v1/notifications` et marque tout lu via `POST /v1/notifications/read`.
- La recherche lit `GET /v1/search` (projets, tâches, clients).

## Étapes livrées

1. Audit → `docs/FRONTEND_AUDIT.md`
2. Design system dark/light + glass
3. Couche données dual-mode
4. S1 : auth (existant), chat enrichi, notifications
5. Upload pré-signé + scan
6. S2 : SDK Contravo + UI CRM/Facturation
7. S3 : vocal, analytics IA, PWA
8. P2 : recherche Cmd+K, social (existant), avis/livrables
9. Polish, tests, README
