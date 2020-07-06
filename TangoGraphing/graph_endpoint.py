import falcon
import json
import logging
import requests
import io
import logging

from graph import graph_file

logger = logging.getLogger("graphing-server")


ALLOWED_FORMATS = (
    "png",
    "svg"
)


def validate_format(req, resp, resource, params):
    if req.get_param("format"):
        if req.get_param("format") not in ALLOWED_FORMATS:
            msg = "Format not allowed. Must be png, svg, dot"
            raise falcon.HTTPBadRequest(
                title="400 Bad Request", description=msg)


class Resource(object):

    def __init__(self):
        self.logger = logging.getLogger("graph_endpoint")

    @falcon.before(validate_format)
    def on_get(self, req, resp):
        url = req.get_param("input_url", required=True)
        format = req.get_param("format", required=True)

        try:
            with requests.get(url, stream=True) as response:
                try:
                    response.raise_for_status()
                except requests.exceptions.HTTPError as error:
                    logger.error("Failed to download: {}. Error: {}".format(url, error))

                    raise falcon.HTTPError(
                        falcon.HTTP_400,
                        title="Url Download Error",
                        description="An error occurred when downloading from the url. Error: {}".format(error))

                try:

                    logger.info("Downloaded: {}".format(url))

                    # at this point, we should have the file, so graph it
                    xmi = bytes(bytearray(response.text, encoding="utf-8"))
                    file_stream = io.BytesIO(xmi)
                    graph_stream = graph_file(file_stream, format)

                    if req.get_param("format") == "png":
                        resp.content_type = falcon.MEDIA_PNG

                    elif req.get_param("format") == "svg":
                        resp.content_type = "image/svg+xml"

                    logger.info("Returning image as {} for: {}".format(format, url))

                    resp.data = graph_stream.read()
                    resp.status = falcon.HTTP_200

                except Exception as error:
                    logger.error("Failed to graph, error: {}".format(error))

                    raise falcon.HTTPError(
                        falcon.HTTP_500,
                        title="Graphing Failed",
                        description="Graphing failed with error: {}".format(error))

        except Exception as error:
            raise falcon.HTTPNotFound(
                title="Connection Failed",
                description="Can not connect to the url: {}. Error: {}".format(url, error))
