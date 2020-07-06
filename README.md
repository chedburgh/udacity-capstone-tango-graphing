# udacity-capstone-tango-graphing

Captone project for Cloud Developer course. This REST API demonstrates Option 2 for the review criteria.

## Project

A previous hobby project of mine was to graph device servers from the [Tango Controls](https://www.tango-controls.org/) framework with a script. This project puts the functionality into a webserver running on the Fargate container server. There are two parts to the project.

No front end is provided, the project has been developed against Postman collection (provided)

### Live Graphing Endpoint

An endpoint is provided to access the Fargate webserver and graph device servers on request. This could be integrated into a build process, for example, to provide a map of the device server on each commit or release. It would also be integrated into markdown style documents to provide up to date device server images.

### REST API

A small REST API is build around the server to demonstrate a social media style API of creating, deleting, updating graphs for a unique user.


## Monitoring

The deployment has Tracing enable (see [screenshots](screenshots) an image) and logging to CloudWatch to debug issues.

## Postman Collection

### Graphing Endpoint

### Test Sequence 