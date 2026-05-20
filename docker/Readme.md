# Docker

## 1er conteneurs
```shell
docker run -it --rm python:3.13-slim 
docker run -it --rm python:3.14-slim

docker run -it --rm python:3.13-slim bash

docker run -it --rm -v "$(PWD)/docker/app-coucou:/usr/src" python:3.13-slim bash

docker run -it --rm -v "$(PWD)/docker/app-coucou:/usr/src" python:3.13-slim python /usr/src/coucou.py
```

## Image personnalisée
```
docker build -t python-data-ia:1.0 docker/python-data-ia
docker run -it --rm python-data-ia:1.0

docker build -t python-data-ia:1.1 docker/python-data-ia
docker run -it --rm python-data-ia:1.1

docker run -it --rm -v "$(PWD)/docker/app-data:/usr/src" python-data-ia:1.1 python /usr/src/app-data.py
```

## Docker compose et base de données
Dans le dossier docker/db-movie:

```shell
docker compose up -d
```