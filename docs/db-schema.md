# TeamHub — Schéma de base de données

Diagramme généré d'après le code réellement commité (migrations + modèles Eloquent + collections MongoDB).

## Vue globale par module

```mermaid
erDiagram
    %% ======================= CORE (M0) =======================
    ORGANIZATIONS ||--o{ MEMBERSHIPS : "a des"
    USERS ||--o{ MEMBERSHIPS : "appartient à"
    ORGANIZATIONS ||--o{ INVITATIONS : "émet"
    USERS ||--o| ORGANIZATIONS : "owner_id"
    USERS }o--o| ORGANIZATIONS : "current_organization_id"

    ORGANIZATIONS {
        bigint id PK
        string name
        string slug UK
        bigint owner_id FK "→ users.id"
        string plan
    }
    USERS {
        bigint id PK
        string name
        string email UK
        string password
        string avatar
        bigint current_organization_id FK "→ organizations.id"
    }
    MEMBERSHIPS {
        bigint id PK
        bigint user_id FK
        bigint organization_id FK
        string role "owner|admin|manager|member|guest"
    }
    INVITATIONS {
        bigint id PK
        bigint organization_id FK
        string email
        string role
        string token UK
        datetime expires_at
    }

    %% ======================= PROJETS / TÂCHES (M1) =======================
    ORGANIZATIONS ||--o{ PROJECTS : "contient"
    USERS ||--o{ PROJECTS : "owner"
    PROJECTS ||--o{ PROJECT_MEMBERS : "a"
    USERS ||--o{ PROJECT_MEMBERS : "participe"
    PROJECTS ||--o{ TASKS : "regroupe"
    ORGANIZATIONS ||--o{ TASKS : "scope"
    TASKS ||--o{ TASKS : "parent_id (sous-tâches)"
    USERS ||--o{ TASKS : "assignee_id / created_by"
    TASKS ||--o{ TASK_COMMENTS : "a"
    USERS ||--o{ TASK_COMMENTS : "écrit"

    PROJECTS {
        bigint id PK
        bigint organization_id FK
        bigint owner_id FK
        string name
        text description
        string status "upcoming|in_progress|on_hold|done"
        date start_date
        date end_date
        datetime archived_at
    }
    PROJECT_MEMBERS {
        bigint project_id FK
        bigint user_id FK
    }
    TASKS {
        bigint id PK
        bigint organization_id FK
        bigint project_id FK
        bigint parent_id FK "→ tasks.id (sous-tâche)"
        bigint assignee_id FK
        bigint created_by FK
        string title
        string status "todo|in_progress|review|done"
        string priority "low|normal|high|urgent"
        date due_date
        uint position
        datetime completed_at
    }
    TASK_COMMENTS {
        bigint id PK
        bigint organization_id FK
        bigint task_id FK
        bigint user_id FK
        text body
    }

    %% ======================= CRM / BIZDEV (M3) =======================
    ORGANIZATIONS ||--o{ CLIENTS : "possède"
    USERS ||--o{ CLIENTS : "owner"
    CLIENTS ||--o{ OPPORTUNITIES : "a"
    USERS ||--o{ OPPORTUNITIES : "owner"
    OPPORTUNITIES }o--o| PROJECTS : "project_id (auto si won)"

    CLIENTS {
        bigint id PK
        bigint organization_id FK
        bigint owner_id FK
        string name
        string company
        string email
        string phone
        text notes
    }
    OPPORTUNITIES {
        bigint id PK
        bigint organization_id FK
        bigint client_id FK
        bigint owner_id FK
        bigint project_id FK "créé auto si stage=won"
        string title
        decimal amount
        string stage "prospect|contacted|proposal|won|lost"
        date next_follow_up
        datetime closed_at
    }

    %% ======================= SOCIAL (M4) =======================
    ORGANIZATIONS ||--o{ POSTS : "fil interne"
    USERS ||--o{ POSTS : "auteur"
    POSTS ||--o{ POST_REACTIONS : "a"
    POSTS ||--o{ POST_COMMENTS : "a"
    USERS ||--o{ POST_REACTIONS : "réagit"
    USERS ||--o{ POST_COMMENTS : "commente"

    POSTS {
        bigint id PK
        bigint organization_id FK
        bigint author_id FK
        text body
        bool pinned
        datetime pinned_at
    }
    POST_REACTIONS {
        bigint id PK
        bigint post_id FK
        bigint user_id FK
        string emoji
    }
    POST_COMMENTS {
        bigint id PK
        bigint organization_id FK
        bigint post_id FK
        bigint author_id FK
        text body
    }

    %% ======================= TRANSVERSES =======================
    ATTACHMENTS }o--|| ORGANIZATIONS : "scope"
    ATTACHMENTS }o--|| USERS : "uploaded_by"
    ACTIVITIES }o--|| ORGANIZATIONS : "scope"
    ACTIVITIES }o--|| USERS : "user_id"

    ATTACHMENTS {
        bigint id PK
        bigint organization_id FK
        bigint uploaded_by FK
        string attachable_type "polymorphe"
        bigint attachable_id
        string path
        string name
        string mime
        bigint size
    }
    ACTIVITIES {
        bigint id PK
        bigint organization_id FK
        bigint user_id FK
        string subject_type "polymorphe"
        bigint subject_id
        string action "client.created, opportunity.stage_changed, …"
        json meta
    }
```

## MongoDB (service realtime)

Les collections sont écrites par `apps/realtime` et synchronisées depuis Laravel via Redis pub/sub (`wine:project:events`).

```mermaid
erDiagram
    CHANNELS ||--o{ MESSAGES : "contient"

    CHANNELS {
        objectid _id PK
        int organization_id
        string type "project|direct"
        int project_id "si type=project"
        array member_ids "liste user_id"
        string name
    }
    MESSAGES {
        objectid _id PK
        int organization_id
        objectid channel_id FK
        int sender_id
        text body
        array attachments
        array read_by
        datetime created_at
    }
```

## Règles clés par module

| Module | Scope automatique | Règle métier |
|---|---|---|
| M0 Core | — | 1 user peut appartenir à N orgs ; un `role` par (user, org) |
| M1 Projets | `organization_id` injecté par trait `BelongsToOrganization` | `project_members` filtre la visibilité pour `member` et `guest` |
| M1 Tâches | idem | `parent_id` → sous-tâches ; `assignee_id` doit être membre de l'org (validation serveur) |
| M3 CRM | idem | `opportunity.stage = won` → **crée automatiquement** un `project` lié (owner = user qui gagne) |
| M4 Social | idem | `pinned` réservé owner/admin ; réaction unique par (post, user, emoji) |
| Transverses | idem | `attachments` et `activities` sont polymorphes (clé `*_type` + `*_id`) |
| Chat (Mongo) | `organization_id` répliqué dans chaque document | Index composé `(organization_id, channel_id, created_at)` |

## Flux inter-modules

```mermaid
flowchart LR
    CRM[CRM: Opportunity won] -->|crée| PROJ[Projet]
    PROJ -->|contient| TASK[Tâches]
    TASK -->|notifications| REDIS((Redis))
    REDIS --> REALTIME[Realtime Socket.io]
    REALTIME -->|notification:new| USER[Utilisateur]

    PROJ -->|project.created| REDIS
    REDIS --> REALTIME
    REALTIME -->|upsert| CHANNEL[Channel Mongo]

    TASK -->|loguer| ACT[Activities]
    CRM -->|loguer| ACT
    ACT -->|lu par| DATA[Service data FastAPI]
    DATA -->|GET /stats/*| API[API Laravel]
    API -->|/analytics/*| USER
```

**Lecture rapide** :
- Chaque action métier (créer projet, gagner une opportunité, assigner une tâche) laisse une trace dans `activities` → alimente Analytics.
- Les événements temps réel (notification, création de projet) passent par Redis → relayés par le realtime en WebSocket.
- Le service `data` lit Postgres en direct, jamais exposé publiquement (secret interne).
