# Linode API Sandbox

## Setup

1. Install [VirtualBox](https://www.virtualbox.org/wiki/Downloads) onto the system.
1. Setup VirtualBox. (instructions below)
1. `npm install`
1. `npm run build`
1. `npm start`

## VirtualBox setup

**Put this machine in your default VirtualBox VMs folder and call it "ubuntu_server_template.ova"**

1. Download an osbox VDI image from https://www.osboxes.org/ubuntu-server/ or install from iso. Optionally use the desktop version, it will end up being a bit larger.
1. Load it up in VirtualBox
1. In VM Settings:
   1. Navigate to Network > Adapter 1 > Attached to:
   1. Select Host-only Adapter
1. Run the set of commands in the textbox below on the machine.
1. Export to OCI
   1. Format: Open Virtualization Format 2.0
   1. MAC Address Policy: Strip all network adapter MAC addresses
   1. Un-check Write Manifest file, might be faster
   1. File: "{**default VirtualBox VMs folder**}/ubuntu_server_template.ova"

```bash
# install virtualbox guest additions from ubuntu multiverse repo
sudo apt update
sudo apt upgrade -y
sudo add-apt-repository multiverse
sudo apt install virtualbox-guest-dkms virtualbox-guest-x11 -y
# install and enable ssh server, allow through firewall, enable firewall
sudo apt install openssh-server -y
sudo ufw allow ssh
sudo ufw enable
sudo systemctl enable sshd
# set target to console mode.
systemctl set-default multi-user.target
# shutdown system to prepare for export to OVA
sudo shutdown -P 0
```

# API Reference Pages

- [Linode API](https://www.linode.com/docs/api/)
- [node-sqlite3](https://github.com/mapbox/node-sqlite3/wiki/API)
- [node-virtualbox](https://github.com/Node-Virtualization/node-virtualbox)
  - Look at the source for most up-to-date API usage info
- [vboxmanage](https://www.virtualbox.org/manual/ch08.html)
  - this is what node-virtualbox uses under the hood to control virtualbox
