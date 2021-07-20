# Linode API Sandbox

## Setup

1. `npm install`
1. `npm start`

I added the following to my Docker daemon.json config file, needs further testing:

```
"hosts": [
"0.0.0.0:2375",
"npipe://"
]
```
