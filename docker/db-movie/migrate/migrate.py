import os, time
import psycopg2
import psycopg2.extras
from pymongo import MongoClient

PG_DSN  = os.getenv("PG_DSN",    "postgresql://movies:movies@db:5432/movies")
MONGO   = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("MONGO_DB",  "movies")

# wait for both services to be ready
for attempt in range(10):
    try:
        pg = psycopg2.connect(PG_DSN)
        break
    except Exception as e:
        print(f"Waiting for PostgreSQL... ({e})")
        time.sleep(3)
else:
    raise SystemExit("PostgreSQL unreachable after retries")

mongo_col = MongoClient(MONGO)[DB_NAME]["movies"]

cur = pg.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
cur.execute("""
    SELECT m.id, m.title, m.year, m.duration, m.pg, m.color,
           m.synopsis, m.poster_uri,
           p.name AS director
    FROM movie m
    LEFT JOIN person p ON p.id = m.director_id
""")
movies = cur.fetchall()
cur.close()
pg.close()

docs = [
    {
        "postgres_id": row["id"],
        "title":       row["title"],
        "year":        row["year"],
        "duration":    row["duration"],
        "pg":          row["pg"],
        "color":       row["color"],
        "synopsis":    row["synopsis"],
        "poster_uri":  row["poster_uri"],
        "director":    row["director"],
    }
    for row in movies
]

mongo_col.drop()
result = mongo_col.insert_many(docs)
print(f"Inserted {len(result.inserted_ids)} movies into MongoDB '{DB_NAME}.movies'")
