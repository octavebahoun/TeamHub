FROM python:3.11-slim AS base
WORKDIR /app

# psycopg[binary] pour Postgres
RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev && uv pip install --system "psycopg[binary]"

COPY app ./app
COPY main.py ./main.py

ENV PORT=8001
EXPOSE 8001

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
