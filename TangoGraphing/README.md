# Tango Graphing

Simple webserver built on Falcon. The webserver integrates the graph functionality to offer it via an endpoint.

## Tests

Run as follows:

```bash
python -m venv env
pip3 install -r requirements.txt
pytest3
```

## Docker Image

To build the image:

```bash
cd docker
make clean; make
```

The image can be pushed to docker hub as follows:

```bash
make push
```

Test the docker image as follows:

```bash
docker run -it -p 8000:8000 chedburgh/tango-device-graphing:latest
```

Then query the webserver with a get request. A request is available in the Postman collection.