# Répartition des corrections — bêta WINE

Trois parts, d'après le bêta-test du 11 octobre 2026 (compte `mourchidolawale+wine@gmail.com`, espace « Espace Test Beta »).

| Personne | Périmètre |
| --- | --- |
| Toi | Clés API et Contravo |
| Wasfade | Comptes, e-mails, mobile, pages publiques |
| J-b | Application une fois connecté |

---

## Toi — clés et Contravo

Le problème de fond : une seule `CONTRAVO_API_KEY` sert pour tous les espaces. Le devis du test est donc sorti au nom de Winner Sarl, et la numérotation `DEV-2026-0004` / `CTR-2026-0006` est celle de ce compte, pas de « Espace Test Beta ».

1. **Clé par espace.** Dans Paramètres → Intégrations, un propriétaire saisit sa clé. Elle est stockée pour son organisation, plus dans une variable unique du serveur. Retirer le texte « Remplacez CONTRAVO_API_KEY côté serveur ».
2. **Isolation.** L'émetteur du PDF est l'espace courant, pas Winner Sarl. Devis et contrats recommencent à `…-0001` dans chaque espace.
   - `apps/web/src/lib/contravo/client.ts`
   - `apps/api/app/Services/BillingLedger.php`
   - `apps/web/src/app/(app)/parametres/integrations/page.tsx`
3. **Devis.** Afficher la remise dans les totaux (aujourd'hui seulement sous-total, TVA, TTC). Un clic PDF = un téléchargement. Fermer la fenêtre après « Brouillon ». Rafraîchir la liste sans rechargement.
   - `apps/web/src/components/contravo/generate-quote-dialog.tsx`
   - `apps/web/src/components/contravo/billing-tab.tsx`
   - `apps/web/src/app/api/contravo/quotes/[id]/pdf/route.ts`
4. **Contrats.** Bouton PDF et signature, y compris quand Contravo est branché. Aujourd'hui « Signer » n'existe qu'en facturation locale.
5. **Factures, acomptes, Mobile Money.** Les boutons MoMo, Moov et Celtiis n'apparaissent que s'il y a déjà une facture WINE. Avec la clé Contravo, l'envoi du devis ne crée pas cette facture, donc l'écran n'existe pas.
6. **WhatsApp / Telegram.** Soit une vraie connexion de compte, soit retirer la promesse. « Ouvrir WhatsApp » ne fait qu'une conversation interne.
7. **Avis.** `/api/contravo/reviews` répond 403 parce que la clé n'a pas le droit `reviews`. Le widget de l'accueil avale l'erreur.
8. **Chiffres.** Santé financière et Analytics lisent les factures WINE, pas les devis Contravo. D'où 0 de chiffre d'affaires, de marge et de trésorerie, et le devis invisible. Le journal du projet n'enregistre pas non plus les devis (`createQuote` n'écrit rien).

---

## Wasfade — comptes, e-mails, mobile, pages publiques

1. **PWA.** `manifest.webmanifest` et `sw.js` passent par `apps/web/src/proxy.ts` et sont renvoyés vers `/connexion`. Les exclure du garde, comme les images. Sinon installation, push et hors-ligne restent cassés.
2. **E-mails.** « Mot de passe oublié » appelle `Password::sendResetLink` sans filet : SMTP en échec = `Server Error`. L'invitation crée la ligne puis envoie le mail ; si l'appel ne revient pas, la liste ne se met pas à jour.
   - `apps/api/app/Http/Controllers/Api/V1/PasswordResetController.php`
   - `apps/api/app/Http/Controllers/Api/V1/InvitationController.php`
   - configuration mail (`MAIL_MAILER`)
3. **Inscription.** `noValidate` et retour immédiat si la case des conditions n'est pas cochée, avant de lire l'e-mail et le mot de passe. Vérifier les champs avant l'envoi. Aucun e-mail de confirmation : `email_verified_at` reste vide et la connexion ne le regarde pas.
4. **Connexion.** Les deux erreurs sont calculées, seule celle de l'e-mail est affichée (`apps/web/src/lib/actions/session.ts`). Le bouton de thème reste `disabled` tant que la page n'a pas fini de s'activer.
5. **404.** La page existe, mais sans cookie toute adresse inconnue part vers `/connexion`.
6. **Pages publiques.**
   - Mentions légales et Confidentialité vont toutes les deux vers `/conditions` (trois phrases).
   - Contact tombe sur la FAQ parce que `CONTACT_EMAIL` est `null`.
   - Pas de page tarifs (`PRICING_ANSWER` est `null`).
   - Sections de l'accueil en `opacity: 0` jusqu'au scroll (`.reveal`).
   - Trois graisses de police préchargées et inutilisées.
   - Texte alternatif « Professionnel WINE et modules de travail ».
   - Contraste du gris `#a8a7a2` sur le fond sombre.
   - Le domaine et le dépôt disent encore `teamhub`.

---

## J-b — application une fois connecté

1. **Listes.** « Nouveau contact » enregistre le client puis attend Contravo avant de fermer la fenêtre (`provisionClient` dans `apps/web/src/lib/actions/crm.ts`). D'où « Création… » bloqué. Même attente pour un projet qui a un client. Après création, la liste ne bouge pas sans rechargement.
2. **Lenteur.** La page Tâches enchaîne plusieurs appels sans délai max. L'erreur `860722949` est une exception Next.js non gérée. Analytics peut recharger les tâches de chaque projet.
3. **Projets.** Archiver ne fait que remplir `archived_at`. Pas de liste des archivés, et `/projets/{id}` s'ouvre quand même. Le journal n'enregistre pas les renommages, seulement les changements de statut.
4. **Jalons.** Le bloc est sur la fiche, vide, et masqué par l'animation de scroll. Le lier au journal.
5. **Chat.** Seul le canal `general` est créé à l'ouverture. Le canal du projet dépend d'un message Redis avalé si Redis est down. L'onglet « Canal du projet » retombe donc sur `general`. Messages en texte brut : pas de gras, pas de liens. Pas de nom sur ses propres messages. La recherche des messages coupe au bout d'une seconde.
6. **Social.** Bouton image désactivé (« bientôt disponible »). `deletePost` existe mais aucune carte ne l'appelle. Pas de modification.
7. **CRM et profil.** L'API sait modifier et supprimer un contact ; aucun écran ne l'appelle. « Changer la photo » est désactivé.
8. **Bilan.** Sans `GEMINI_API_KEY`, le texte est un modèle (`apps/data/app/summary.py` : « N tâche(s) en retard à traiter »). Afficher « Synthèse auto » clairement, ou brancher Gemini. La carte « Projets actifs » a pour sous-texte « N en pause, N à venir » ; « Analytics » est le titre de la page.
