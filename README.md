# Linode API Sandbox

## Setup

1. install docker on the system
1. In bash: `docker pull ubuntu:latest`
1. `npm install`
1. `npm run build`
1. `npm start`

# Explanation

This project uses Docker as a local backend for the Linode API. Much of the functionality of the Instances, Volumes, and Types APIs are implemented. This is only tested to work on Linux. Local networking doesn't work with Docker for Windows.

# API Reference Pages

- [Linode API](https://www.linode.com/docs/api/)
- [Docker Engine API](https://docs.docker.com/engine/api/latest)
- [dockerode library](https://www.npmjs.com/package/dockerode)
- [sqlite3 library](https://github.com/mapbox/node-sqlite3/wiki/API)
