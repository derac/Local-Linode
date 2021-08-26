# Linode API Sandbox

## Setup

1. install [VirtualBox](https://www.virtualbox.org/wiki/Downloads) onto the system
1. setup VirtualBox _below_
1. `npm install`
1. `npm run build`
1. `npm start`

_VirtualBox setup_

1. TODO: figure out where to put template OVF so we don't need to set that up
2. figure out networking
   - Host-only networking will be best
   - Need to test network setup more on virtualbox, the user may need to adjust the ip settings for the host-only network to attach to.

# Explanation

This project uses VirtualBox as a local backend for the Linode API. Much of the functionality of the Instances, Volumes, and Types APIs are implemented. This is only tested to work on Linux.

# API Reference Pages

- [Linode API](https://www.linode.com/docs/api/)
- [sqlite3 library](https://github.com/mapbox/node-sqlite3/wiki/API)
