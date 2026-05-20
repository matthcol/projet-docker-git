from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from pydantic import BaseModel
from typing import Optional
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://movies:movies@db:5432/movies")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

app = FastAPI(title="Movies API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def db():
    with engine.connect() as conn:
        yield conn


# ─── Schemas ──────────────────────────────────────────────────────────────────

class PersonIn(BaseModel):
    name: str
    birthdate: Optional[str] = None


class MovieIn(BaseModel):
    title: str
    year: int
    duration: Optional[int] = None
    synopsis: Optional[str] = None
    poster_uri: Optional[str] = None
    color: Optional[str] = None
    pg: Optional[str] = None
    director_id: Optional[int] = None


# ─── Persons ──────────────────────────────────────────────────────────────────

@app.get("/persons")
def list_persons(conn=Depends(db)):
    rows = conn.execute(
        text("SELECT id, name, birthdate FROM person ORDER BY name")
    ).mappings().all()
    return [dict(r) for r in rows]


@app.get("/persons/{pid}")
def get_person(pid: int, conn=Depends(db)):
    row = conn.execute(
        text("SELECT id, name, birthdate FROM person WHERE id=:id"), {"id": pid}
    ).mappings().first()
    if not row:
        raise HTTPException(404)
    return dict(row)


@app.post("/persons", status_code=201)
def create_person(p: PersonIn, conn=Depends(db)):
    row = conn.execute(
        text("INSERT INTO person(name, birthdate) VALUES(:name, :birthdate) RETURNING id, name, birthdate"),
        {"name": p.name, "birthdate": p.birthdate},
    ).mappings().first()
    conn.commit()
    return dict(row)


@app.put("/persons/{pid}")
def update_person(pid: int, p: PersonIn, conn=Depends(db)):
    row = conn.execute(
        text("UPDATE person SET name=:name, birthdate=:birthdate WHERE id=:id RETURNING id, name, birthdate"),
        {"name": p.name, "birthdate": p.birthdate, "id": pid},
    ).mappings().first()
    if not row:
        raise HTTPException(404)
    conn.commit()
    return dict(row)


@app.delete("/persons/{pid}", status_code=204)
def delete_person(pid: int, conn=Depends(db)):
    result = conn.execute(text("DELETE FROM person WHERE id=:id"), {"id": pid})
    conn.commit()
    if result.rowcount == 0:
        raise HTTPException(404)


# ─── Movies ───────────────────────────────────────────────────────────────────

MOVIE_SELECT = """
    SELECT m.id, m.title, m.year, m.duration, m.pg, m.color,
           m.poster_uri, m.director_id, p.name AS director_name
    FROM movie m
    LEFT JOIN person p ON p.id = m.director_id
"""


@app.get("/movies")
def list_movies(conn=Depends(db)):
    rows = conn.execute(
        text(MOVIE_SELECT + "ORDER BY m.title LIMIT 200")
    ).mappings().all()
    return [dict(r) for r in rows]


@app.get("/movies/{mid}")
def get_movie(mid: int, conn=Depends(db)):
    row = conn.execute(
        text(MOVIE_SELECT + "WHERE m.id=:id"), {"id": mid}
    ).mappings().first()
    if not row:
        raise HTTPException(404)
    return dict(row)


@app.post("/movies", status_code=201)
def create_movie(m: MovieIn, conn=Depends(db)):
    row = conn.execute(
        text("""
            INSERT INTO movie(title, year, duration, synopsis, poster_uri, color, pg, director_id)
            VALUES(:title, :year, :duration, :synopsis, :poster_uri, :color, :pg, :director_id)
            RETURNING id, title, year, duration, pg, color, poster_uri, director_id
        """),
        m.model_dump(),
    ).mappings().first()
    conn.commit()
    return dict(row)


@app.put("/movies/{mid}")
def update_movie(mid: int, m: MovieIn, conn=Depends(db)):
    row = conn.execute(
        text("""
            UPDATE movie
            SET title=:title, year=:year, duration=:duration, synopsis=:synopsis,
                poster_uri=:poster_uri, color=:color, pg=:pg, director_id=:director_id
            WHERE id=:id
            RETURNING id, title, year, duration, pg, color, poster_uri, director_id
        """),
        {**m.model_dump(), "id": mid},
    ).mappings().first()
    if not row:
        raise HTTPException(404)
    conn.commit()
    return dict(row)


@app.delete("/movies/{mid}", status_code=204)
def delete_movie(mid: int, conn=Depends(db)):
    conn.execute(text("DELETE FROM play WHERE movie_id=:id"), {"id": mid})
    conn.execute(text("DELETE FROM have_genre WHERE movie_id=:id"), {"id": mid})
    result = conn.execute(text("DELETE FROM movie WHERE id=:id"), {"id": mid})
    conn.commit()
    if result.rowcount == 0:
        raise HTTPException(404)


# ─── Search ───────────────────────────────────────────────────────────────────

@app.get("/search")
def search(
    name: Optional[str] = Query(None),
    title: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    conn=Depends(db),
):
    result = {}
    if name:
        rows = conn.execute(
            text("SELECT id, name, birthdate FROM person WHERE name ILIKE :q ORDER BY name"),
            {"q": f"%{name}%"},
        ).mappings().all()
        result["persons"] = [dict(r) for r in rows]

    if title or year:
        where, params = [], {}
        if title:
            where.append("m.title ILIKE :title")
            params["title"] = f"%{title}%"
        if year:
            where.append("m.year = :year")
            params["year"] = year
        clause = ("WHERE " + " AND ".join(where)) if where else ""
        rows = conn.execute(
            text(MOVIE_SELECT + clause + " ORDER BY m.title"),
            params,
        ).mappings().all()
        result["movies"] = [dict(r) for r in rows]

    return result
