from fastapi import Depends, FastAPI, Query
from sqlalchemy.orm import Session

from app import relances, stats, summary
from app.config import config
from app.db import get_session
from app.security import require_internal_secret

app = FastAPI(title="WINE data service", version="0.2.0")


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "data",
        "gemini": bool(config.gemini_api_key),
        "mongo": bool(config.mongo_url),
    }


@app.get("/stats/overview", dependencies=[Depends(require_internal_secret)])
def stats_overview(
    org: int = Query(..., gt=0),
    owner_id: int | None = Query(None, gt=0),
    session: Session = Depends(get_session),
):
    return stats.overview(session, org, owner_id)


@app.get("/stats/pipeline", dependencies=[Depends(require_internal_secret)])
def stats_pipeline(
    org: int = Query(..., gt=0),
    owner_id: int | None = Query(None, gt=0),
    session: Session = Depends(get_session),
):
    return stats.pipeline(session, org, owner_id)


@app.get("/stats/profitability", dependencies=[Depends(require_internal_secret)])
def stats_profitability(
    org: int = Query(..., gt=0),
    owner_id: int | None = Query(None, gt=0),
    session: Session = Depends(get_session),
):
    return stats.profitability(session, org, owner_id)


@app.get("/stats/activity", dependencies=[Depends(require_internal_secret)])
def stats_activity(
    org: int = Query(..., gt=0),
    days: int = Query(30, gt=0, le=365),
    session: Session = Depends(get_session),
):
    return stats.activity(session, org, days)


@app.get("/summary", dependencies=[Depends(require_internal_secret)])
def weekly_summary(
    org: int = Query(..., gt=0),
    owner_id: int | None = Query(None, gt=0),
    session: Session = Depends(get_session),
):
    return summary.build(session, org, owner_id)


@app.get("/relances", dependencies=[Depends(require_internal_secret)])
def follow_ups(
    org: int = Query(..., gt=0),
    owner_id: int | None = Query(None, gt=0),
    limit: int = Query(8, gt=0, le=20),
    session: Session = Depends(get_session),
):
    return relances.suggest(session, org, owner_id, limit)
