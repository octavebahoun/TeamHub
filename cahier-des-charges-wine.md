# Cahier des charges — WINE (Work IN Excellence)

**Porteur :** Excellence Team · **Chef de projet :** Octave BAHOUN (Directeur Technique)
**Version :** 1.0 · **Date :** 01/10/2026

> Les éléments marqués **[À valider]** sont des propositions à confirmer en équipe.

---

## 1. Contexte

Les entrepreneurs et petites équipes francophones gèrent leur activité avec plusieurs outils séparés : WhatsApp pour discuter, Excel pour suivre les clients, des carnets ou Trello pour les tâches. L'information se perd entre ces outils.

WINE regroupe cette gestion dans une seule plateforme SaaS en six modules. Excellence Team l'utilise d'abord en interne, puis le propose aux entrepreneurs francophones.

**Reconnaissance :** 3e place au concours GENEB/MTN.

## 2. Objectifs

| Objectif | Indicateur de réussite |
| --- | --- |
| Centraliser projets, tâches, échanges et clients | Une équipe gère son activité sans outil externe |
| Faire tourner Excellence Team sur WINE | Les 11 membres l'utilisent chaque semaine |
| Donner de la visibilité sur l'activité | Tableau de bord mis à jour en temps réel |
| Préparer une offre commerciale | Au moins une organisation externe en test **[À valider]** |

## 3. Cibles

| Profil | Besoin principal |
| --- | --- |
| Entrepreneur / dirigeant | Voir l'état des projets et des clients en un coup d'œil |
| Chef de projet | Répartir les tâches, suivre les délais |
| Membre d'équipe | Savoir quoi faire, échanger avec l'équipe |
| Commercial | Suivre prospects et opportunités |

## 4. Rôles et permissions

| Rôle | Droits |
| --- | --- |
| Propriétaire | Tout, y compris facturation et suppression de l'organisation |
| Admin | Gestion des membres, des projets et des paramètres |
| Chef de projet | Création et gestion de ses projets et tâches |
| Membre | Lecture des projets assignés, gestion de ses tâches, chat |
| Invité | Accès en lecture à un projet précis **[À valider]** |

Chaque organisation (tenant) est isolée : aucun membre ne voit les données d'une autre organisation.

## 5. Périmètre fonctionnel — les 6 modules

### Module 1 — Projets
- Créer, modifier, archiver un projet (nom, description, dates, statut, responsable)
- Statuts : à venir, en cours, en pause, terminé
- Ajouter des membres au projet
- Suivi d'avancement calculé à partir des tâches
- Pièces jointes par projet

### Module 2 — Tâches
- Créer une tâche (titre, description, assigné, échéance, priorité)
- Vue Kanban (à faire, en cours, en revue, terminé) et vue liste
- Sous-tâches et commentaires
- Rappels avant échéance
- Filtres par projet, personne, priorité, date

### Module 3 — Chat
- Messagerie temps réel (Socket.io)
- Canaux par projet et messages privés
- Envoi de fichiers et d'images
- Indicateurs de lecture et de présence
- Notifications en temps réel

### Module 4 — Social
- Fil d'actualité interne de l'organisation
- Publications, réactions, commentaires
- Annonces épinglées par les admins
- Mise en avant des réussites (projet livré, prix gagné)

### Module 5 — Analytics
- Tableau de bord global : projets actifs, tâches en retard, charge par membre
- Graphiques d'avancement et de productivité
- Suivi du pipeline commercial (lien avec le module CRM)
- Export CSV / PDF **[À valider]**

### Module 6 — CRM / BizDev
- Fiches clients et prospects (contact, entreprise, historique)
- Pipeline d'opportunités : prospect, contacté, proposition, gagné, perdu
- Notes et relances programmées
- Lien entre un client gagné et un projet

## 6. User stories (MoSCoW)

| Priorité | En tant que… | Je veux… | Pour… |
| --- | --- | --- | --- |
| Must | Dirigeant | Créer mon organisation et inviter mon équipe | Démarrer sur WINE |
| Must | Chef de projet | Créer un projet et y assigner des tâches | Organiser le travail |
| Must | Membre | Voir mes tâches du jour | Savoir quoi faire |
| Must | Membre | Discuter dans le canal du projet | Éviter WhatsApp |
| Should | Commercial | Suivre mes prospects dans un pipeline | Ne rater aucune relance |
| Should | Dirigeant | Voir un tableau de bord global | Piloter l'activité |
| Could | Membre | Publier une annonce sur le fil social | Partager une info à tous |
| Could | Admin | Exporter les statistiques | Faire un rapport |
| Won't (V1) | Dirigeant | Facturer mes clients depuis WINE | Géré par Contravo |

## 7. Parcours utilisateur principal

1. Le dirigeant crée son compte et son organisation.
2. Il invite ses membres par email.
3. Il crée un projet et y ajoute des membres.
4. Le chef de projet découpe le projet en tâches assignées.
5. Les membres avancent leurs tâches et échangent dans le canal du projet.
6. Le dirigeant suit l'avancement dans Analytics.
7. Un prospect gagné dans le CRM devient un nouveau projet.

## 8. Événements indésirables

| Situation | Traitement |
| --- | --- |
| Perte de connexion pendant le chat | Messages mis en file, renvoyés à la reconnexion |
| Membre retiré d'une organisation | Accès coupé immédiatement, ses tâches réassignables |
| Tâche sans assigné à l'échéance | Alerte au chef de projet |
| Tentatives de connexion répétées | Blocage temporaire du compte |
| Fichier trop lourd | Refus avec message clair (limite **[À valider]**) |

## 9. Exigences non fonctionnelles

| Domaine | Exigence |
| --- | --- |
| Performance | Pages chargées en moins de 2 s sur connexion 4G moyenne |
| Temps réel | Message reçu en moins de 1 s |
| Disponibilité | 99 % hors maintenance planifiée |
| Responsive | Utilisable sur mobile, tablette et ordinateur |
| Langue | Interface en français |
| Accessibilité | Contraste et navigation clavier conformes WCAG AA |
| Connexion faible | Fonctionnement correct sur réseau lent (contexte Afrique de l'Ouest) |

## 10. Architecture technique

| Couche | Technologie | Rôle |
| --- | --- | --- |
| Frontend | Next.js 14 | Interface web de tous les modules |
| API principale | Laravel 12 | Projets, tâches, CRM, utilisateurs, permissions |
| Temps réel | Node.js + Socket.io | Chat, présence, notifications |
| Service data | FastAPI (Python) | Calculs Analytics, fonctions IA futures |
| Base relationnelle | PostgreSQL | Organisations, utilisateurs, projets, tâches, CRM |
| Base documentaire | MongoDB | Messages du chat, fil social |

**Répartition des données [À valider] :** données structurées et liées dans PostgreSQL ; données à fort volume et peu structurées (messages, publications) dans MongoDB.

### Communication entre services
- Le frontend appelle l'API Laravel (REST) et se connecte au serveur Socket.io.
- Laravel émet des événements vers Node.js pour les notifications.
- FastAPI lit les données nécessaires aux statistiques.

## 11. Sécurité

- Authentification par jeton (Laravel Sanctum) **[À valider]**
- Mots de passe hachés (bcrypt / argon2)
- Isolation stricte des données par organisation
- Contrôle des permissions côté serveur sur chaque requête
- HTTPS obligatoire
- Validation de toutes les entrées et limitation du débit des requêtes
- Sauvegarde quotidienne des bases

## 12. Hors périmètre (V1)

| Exclu | Raison |
| --- | --- |
| Facturation et paiements clients | Couvert par Contravo |
| Application mobile native | Le web responsive suffit en V1 |
| Visioconférence | Outils existants suffisants |
| Assistant IA intégré | Prévu après la V1 |

## 13. Organisation de l'équipe

**Chef de projet :** Octave BAHOUN — vue d'ensemble, module core, assemblage final.

Règle : un module = un responsable. L'assemblage final est fait par le chef de projet.

| Membre | Module |
| --- | --- |
| Octave BAHOUN | Core / architecture **[À valider]** |
| Mourchid FOLARIN | **[À attribuer]** |
| Ezéchiel | **[À attribuer]** |
| Wasfade TONOUKOIN | **[À attribuer]** |
| Cosme | **[À attribuer]** |
| Jean-Baptiste VINONFODO | **[À attribuer]** |

## 14. Jalons [À valider]

| Jalon | Contenu |
| --- | --- |
| M0 — Socle | Dépôt, CI, authentification, organisations, rôles |
| M1 — Travailler | Projets + Tâches |
| M2 — Communiquer | Chat temps réel + notifications |
| M3 — Vendre | CRM / BizDev |
| M4 — Piloter | Analytics + Social |
| M5 — Livraison V1 | Tests, corrections, mise en production |

## 15. Livrables

- Code source versionné (GitHub, organisation TEAM-D-EXCELLENCE)
- Application déployée en production
- Documentation technique (API, schéma de base, déploiement)
- Guide utilisateur court
- Maquettes des écrans principaux

## 16. Critères d'acceptation de la V1

- Un dirigeant crée son organisation et invite son équipe sans aide.
- Un projet complet (tâches, échanges, suivi) peut être mené de bout en bout dans WINE.
- Les messages arrivent en temps réel entre deux utilisateurs.
- Aucun utilisateur n'accède aux données d'une autre organisation.
- Excellence Team utilise WINE pour ses propres projets.

## 17. Points ouverts

- Répartition exacte des modules entre les membres
- Date cible de la V1
- Hébergement (serveur AWS d'Excellence Team ?)
- Modèle commercial : gratuit, abonnement, freemium
- WINE reste-t-il interne ou devient-il un produit vendu ?
