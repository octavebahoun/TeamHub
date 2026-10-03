from sqlalchemy import text

from app import stats
from tests.conftest import seed_org


def test_overview_counts_and_profitability(session):
    seed_org(session)
    result = stats.overview(session, 1)

    assert result["active_projects"] == 1
    assert result["overdue_tasks"] == 1
    assert result["completed_tasks"] == 1
    assert any(row["name"] == "Ada" and row["open_tasks"] == 1 for row in result["workload"])
    assert any(row["name"] == "Ben" and row["open_tasks"] == 1 for row in result["workload"])
    assert result["late_projects"][0]["id"] == 10
    assert result["profitability"]["won_amount"] == 800000
    assert result["profitability"]["lost_amount"] == 200000
    assert result["profitability"]["open_amount"] == 1500000
    assert result["profitability"]["won_count"] == 1
    assert result["profitability"]["win_rate"] == 0.5


def test_overview_scopes_to_owner_projects(session):
    seed_org(session)
    session.execute(
        text(
            "INSERT INTO projects (id, organization_id, owner_id, name, status) "
            "VALUES (20, 1, 2, 'Autre', 'in_progress')"
        )
    )
    session.execute(
        text(
            "INSERT INTO tasks (id, organization_id, project_id, assignee_id, created_by, title, status, due_date) "
            "VALUES (200, 1, 20, 2, 2, 'Tâche Ben', 'todo', '2000-01-01')"
        )
    )
    session.commit()

    scoped = stats.overview(session, 1, owner_id=1)
    assert scoped["overdue_tasks"] == 1
    assert all(row["id"] != 20 for row in scoped["late_projects"])


def test_other_organization_is_invisible(session):
    seed_org(session, org=1)
    empty = stats.overview(session, 99)
    assert empty["active_projects"] == 0
    assert empty["overdue_tasks"] == 0
    assert empty["profitability"]["open_count"] == 0
