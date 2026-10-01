from fastapi import Depends, FastAPI, Query
from sqlalchemy.orm import Session

from app import stats
from app.db import get_session
from app.security import require_internal_secret

app = FastAPI(title="WINE data service", version="0.1.0")


@app.get("/health")
def health():
    return {"ok": True, "service": "data"}


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


@app.get("/stats/activity", dependencies=[Depends(require_internal_secret)])
def stats_activity(
    org: int = Query(..., gt=0),
    days: int = Query(30, gt=0, le=365),
    session: Session = Depends(get_session),
):
    return stats.activity(session, org, days)
