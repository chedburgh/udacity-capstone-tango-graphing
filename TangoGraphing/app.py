import falcon
import graph_endpoint
import logging
import logging.handlers

from falcon import media

logger = logging.getLogger("graphing-server")
logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.INFO)


class ResponseLoggerMiddleware(object):
    def process_response(self, req, resp, resource, req_succeeded):
        logger.info("Exist {0} {1} {2}".format(
            req.method, req.relative_uri, resp.status[:3]))


class RequestLoggerMiddleware(object):
    def process_request(self, req, resp):
        logger.info("Enter {0} {1}".format(req.method, req.relative_uri))


def generic_error_handler(ex, req, resp, params):
    logger.exception(ex)
    raise ex


api = application = falcon.API(
    middleware=[ResponseLoggerMiddleware(), RequestLoggerMiddleware()])

api.add_error_handler(Exception, generic_error_handler)

graph = graph_endpoint.Resource()
api.add_route("/graph", graph)
