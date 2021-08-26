# Linode API Sandbox

## Setup

1. install [VirtualBox](https://www.virtualbox.org/wiki/Downloads) onto the system
1. setup VirtualBox _below_
1. `npm install`
1. `npm run build`
1. `npm start`

_VirtualBox setup_

1. TODO: figure out where to put template OVF so we don't need to set that up. commands used below, may change default osboxes password:

```bash
# install virtualbox guest additions from ubuntu multiverse repo
sudo apt update
sudo apt upgrade
sudo add-apt-repository multiverse
sudo apt install virtualbox-guest-dkms virtualbox-guest-x11
# install and enable ssh server, allow through firewall, enable firewall
sudo apt install openssh-server
sudo ufw allow ssh
sudo ufw enable
sudo systemctl enable sshd
# shutdown system to prepare for export to OVA
sudo shutdown -P 0
```

2. figure out networking
   - Host-only networking will be best
   - Need to test network setup more on virtualbox, the user may need to adjust the ip settings for the host-only network to attach to.

# Explanation

This project uses VirtualBox as a local backend for the Linode API. Much of the functionality of the Instances, Volumes, and Types APIs are implemented. This is only tested to work on Linux.

# API Reference Pages

- [Linode API](https://www.linode.com/docs/api/)
- [node-sqlite3](https://github.com/mapbox/node-sqlite3/wiki/API)
- [node-virtualbox](https://github.com/Node-Virtualization/node-virtualbox)
  - Look at the source for most up-to-date API usage info
- [vboxmanage](https://www.virtualbox.org/manual/ch08.html)
  - this is what node-virtualbox uses under the hood to control virtualbox
