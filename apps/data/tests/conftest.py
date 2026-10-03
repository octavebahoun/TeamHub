from datetime import date, datetime, timedelta

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

SCHEMA = """
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT
);
CREATE TABLE memberships (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    role TEXT
);
CREATE TABLE projects (
    id INTEGER PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    status TEXT,
    archived_at TEXT
);
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    parent_id INTEGER,
    assignee_id INTEGER,
    created_by INTEGER,
    title TEXT,
    status TEXT,
    due_date TEXT,
    completed_at TEXT
);
CREATE TABLE clients (
    id INTEGER PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    owner_id INTEGER,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT
);
CREATE TABLE opportunities (
    id INTEGER PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    owner_id INTEGER,
    project_id INTEGER,
    title TEXT NOT NULL,
    amount REAL DEFAULT 0,
    stage TEXT,
    next_follow_up TEXT,
    notes TEXT,
    closed_at TEXT,
    created_at TEXT
);
CREATE TABLE activities (
    id INTEGER PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    user_id INTEGER,
    subject_type TEXT,
    subject_id INTEGER,
    action TEXT,
    kind TEXT,
    body TEXT,
    meta TEXT,
    created_at TEXT
);
"""


@pytest.fixture()
def session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as conn:
        for statement in SCHEMA.strip().split(";"):
            sql = statement.strip()
            if sql:
                conn.execute(text(sql))
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = factory()
    try:
        yield db
    finally:
        db.close()
        engine.dispose()


def seed_org(session: Session, org: int = 1) -> dict:
    today = date.today()
    session.execute(text("INSERT INTO users (id, name, email) VALUES (1, 'Ada', 'ada@test'), (2, 'Ben', 'ben@test')"))
    session.execute(
        text(
            "INSERT INTO memberships (id, user_id, organization_id, role) VALUES "
            "(1, 1, :org, 'owner'), (2, 2, :org, 'member')"
        ),
        {"org": org},
    )
    session.execute(
        text(
            "INSERT INTO projects (id, organization_id, owner_id, name, status, archived_at) VALUES "
            "(10, :org, 1, 'Site vitrine', 'in_progress', NULL), "
            "(11, :org, 1, 'Ancien', 'done', :archived)"
        ),
        {"org": org, "archived": today.isoformat()},
    )
    session.execute(
        text(
            "INSERT INTO tasks (id, organization_id, project_id, assignee_id, created_by, title, status, due_date, completed_at) VALUES "
            "(100, :org, 10, 1, 1, 'Maquette', 'todo', :yesterday, NULL), "
            "(101, :org, 10, 2, 1, 'API', 'done', NULL, :today), "
            "(102, :org, 10, 2, 1, 'Texte', 'in_progress', :tomorrow, NULL)"
        ),
        {
            "org": org,
            "yesterday": (today - timedelta(days=1)).isoformat(),
            "today": datetime.combine(today, datetime.min.time()).isoformat(),
            "tomorrow": (today + timedelta(days=1)).isoformat(),
        },
    )
    session.execute(
        text(
            "INSERT INTO clients (id, organization_id, owner_id, name, company, email) VALUES "
            "(50, :org, 1, 'Hôtel Palmiers', 'Palmiers SA', 'contact@palmiers.test')"
        ),
        {"org": org},
    )
    session.execute(
        text(
            "INSERT INTO opportunities (id, organization_id, client_id, owner_id, title, amount, stage, next_follow_up, closed_at, created_at) VALUES "
            "(70, :org, 50, 1, 'Site hôtel', 1500000, 'proposal', :today, NULL, :week), "
            "(71, :org, 50, 1, 'Ancien site', 800000, 'won', NULL, :today, :week), "
            "(72, :org, 50, 1, 'Refus', 200000, 'lost', NULL, :today, :week)"
        ),
        {"org": org, "today": today.isoformat(), "week": today.isoformat()},
    )
    session.execute(
        text(
            "INSERT INTO activities (id, organization_id, user_id, subject_type, subject_id, action, kind, body, created_at) VALUES "
            "(1, :org, 1, 'App\\\\Models\\\\Client', 50, 'client.note', 'call', 'Appel de prise de contact', :today)"
        ),
        {"org": org, "today": today.isoformat()},
    )
    session.commit()
    return {"org": org, "today": today}
