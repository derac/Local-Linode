# Linode API Sandbox

## Setup

1. `npm install`
1. `npm start`

I added the following to my Docker daemon.json config file:

```
"hosts": [
"0.0.0.0:2375",
"npipe://"
]
```
