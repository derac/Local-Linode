# Linode API Sandbox

## Setup

1. Install [VirtualBox](https://www.virtualbox.org/wiki/Downloads) onto the system.
1. Follow the VirtualBox machine template setup instructions below.
1. `npm install`
1. `npm run build`
1. `npm start`

## VirtualBox machine template setup

1. Download [Ubuntu Server 20.04](https://ubuntu.com/download/server)
1. In VirtualBox Manager:
   1. Machine > New... (or ctrl+n)
      1. Name it `ubuntu server template` > Create
      1. File Size: 1 TB+ > Create
      1. Go to settings for `ubuntu server template`
      1. Storage > IDE optical drive (says "Empty") > Click disk icon dropdown > Choosea disk file... > Select the ISO you downloaded
      1. Click OK and start the VM.
1. Ubuntu setup. (ctrl+c view mode is nice)
   1. Click next until you get to "Guided Storage configuration"
   1. Select "Custom storage layout" > Done
   1. Select the VBOX_HARDDISK and press enter > Add GPT Partition
   1. Size: 20G > Format: ext4 > Mount: / > Create
   1. Add another GPT Partition
   1. Size: 512M > Format: swap > Create
   1. Done > Continue
   1. Enter `local-linode` for all options > Done
   1. Check Install OpenSSH Server > Done
   1. Done > Wait for intallation to complete > Reboot Now
   1. Power off machine > Settings > Unmount install CD > Power on
   1. Machine GUI Menu > Devices > Insert Guest Additions image (may need to remove ubuntu iso)
1. Log into the machine and run bash commands below.
1. In Virtualbox Manager
   1. Machine GUI Menu > Devices > Optical Drives > Remove disk
   1. Power off machine > Machine settings
   1. Navigate to Network > Adapter 1 > Attached to:
   1. Select Host-only Adapter > OK
   1. Right click machine > Export to OCI
   1. Format: Open Virtualization Format 2.0
   1. MAC Address Policy: Strip all network adapter MAC addresses
   1. Un-check Write Manifest file, might be faster
   1. File: "{**default VirtualBox VMs folder**}/ubuntu_server_template.ova"
1. You can delete the Template you created in VirtualBox. If you need to update the OVA, you can edit a machine spawned by the script, re-export, and overwrite the template OVA.

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install build-essential linux-headers-$(uname -r) -y
sudo mount /dev/cdrom /media
sudo /media/VBoxLinuxAdditions.run
sudo ufw allow ssh
sudo ufw enable
```

## API Reference Pages

- [Linode API](https://www.linode.com/docs/api/)
- [node-sqlite3](https://github.com/mapbox/node-sqlite3/wiki/API)
- [node-virtualbox](https://github.com/Node-Virtualization/node-virtualbox)
  - Look at the source for most up-to-date API usage info
- [vboxmanage](https://www.virtualbox.org/manual/ch08.html)
  - this is what node-virtualbox uses under the hood to control virtualbox
