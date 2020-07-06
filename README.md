# udacity-capstone-tango-graphing

- [udacity-capstone-tango-graphing](#udacity-capstone-tango-graphing)
  - [Project](#project)
    - [Live Graphing Endpoint](#live-graphing-endpoint)
    - [REST API](#rest-api)
  - [Structure](#structure)
  - [Monitoring](#monitoring)
  - [Postman Collection](#postman-collection)
    - [Graphing Endpoint](#graphing-endpoint)
    - [Rest API](#rest-api-1)
      - [Test Sequence](#test-sequence)

Captone project for Cloud Developer course. This REST API demonstrates Option 2 for the review criteria.

## Project

A previous hobby project of mine was to graph device servers from the [Tango Controls](https://www.tango-controls.org/) framework with a script. This project puts the functionality into a webserver running on the Fargate container server. There are two parts to the project.

No front end is provided, the project has been developed against Postman collection (provided)

### Live Graphing Endpoint

An endpoint is provided to access the Fargate graphing webserver and graph device servers on request. This could be integrated into a build process, for example, to provide a map of the device server on each commit or release. It would also be integrated into markdown style documents to provide up to date device server images.

Only png and svg image formats are supported currently.

A proposed frontend would be a stream of the latest graphs, but this does not fulfil the project rubric. 

### REST API

A small REST API is build around the server to demonstrate a social media style API of creating, deleting, updating graphs for a unique user. Its built on top of functionality in the Live Graphing Endpoint.

## Structure

A quick note on the structure. The Live Graphing endpoint uses its own bucket (this is due to the fact it was going to diverge in usage, i.e. have a time to live and a caching mechanism, not finished). The REST API has its own long term storage and a database.

Both parts of the project use call the graphing webserver deployed in as Fargate container. It was not possible to put this deployed into a serverless.yml file, so it remains separate with setup instructions under [Faraget](Fargate).

It should be noted that since no domain names are used, redeploying the Fargate container generates a new IP address and the REST API has to be updated with this via the config.dev.json file.

## Monitoring

The deployment has Tracing enable (see [screenshots](screenshots) an image) and logging to CloudWatch to debug issues.

## Postman Collection

### Graphing Endpoint

The graphing endpoint does not use authentication, it is intended as a demo for public usage. Several valid and invalid calls are provided to test with in Postman.

### Rest API

The Rest API has a collection or both valid and invalid calls to test the API. To use the Rest API collections, an OAUTH2 authentication needs to be added to Postman as the variable auth_token.

The simplest way is to use an auth0 test token as follows:

- Login to auth0
- Click APIs -> Auth0 Management API -> Test
- Copy the response token and paste this into the auth_token variable in Postman.

#### Test Sequence 

A typical test sequence is as follows:

- Create several graphs using the createGraph endpoint. Copy one graphId to the Postman variable graph_id, this will be the tested graph.
- Use getGraphs to see a list of graphs.
- Call getGraph (Postman variable graph_id must be set) to return a single graph.
- Use update to update a graph (Postman variable graph_id must be set), then getGraph to see the changes.
- Delete the graph by calling delete, and ensure it does not exist with getGraph.