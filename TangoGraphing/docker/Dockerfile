FROM python:3-slim

RUN apt-get update && \
    apt-get install -y graphviz && \
    apt-get autoremove && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY build-files/requirements.txt \
    build-files/app.py \
    build-files/graph.py \
    build-files/graph_endpoint.py \
    /app/

RUN pip3 install --upgrade pip
RUN pip3 install -r /app/requirements.txt

ENTRYPOINT ["gunicorn", "--workers=2", "--threads=4", "--bind", "0.0.0.0:8000", "app:api"]