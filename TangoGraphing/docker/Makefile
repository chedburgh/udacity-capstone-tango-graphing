NAME=chedburgh/tango-device-graphing
VERSION=latest

default: image

./build-files/.built: Dockerfile
	mkdir -p build-files
	cp ../requirements.txt build-files/
	cp ../graph.py build-files/
	cp ../graph_endpoint.py build-files/
	cp ../app.py build-files/
	docker build -t ${NAME} .
	touch ./build-files/.built

lint:
	docker run --rm -i hadolint/hadolint < Dockerfile

image: ./build-files/.built

push: build-files/.built
	docker tag ${NAME}:${VERSION} ${NAME}
	docker push ${NAME}

clean:
	rm -rf ./build-files

.PHONY: default image clean