# Local Linode

Uses VirtualBox as a local backend for the Linode API. Much of the functionality of the Instances, Volumes, and Types APIs are implemented.

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
   1. Navigate to Network > Adapter 1 > Attached to: Select Host-only Adapter
   1. Navigate to Storage > Controller: SATA > Port Count > Enter `8`
   1. Hit OK
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

## TODO

- Volume Attach/Detach - finish logic, more detail in files
- When attaching storage, it always goes to the next sdX device name. I haven't been able to find a way around this behavior. Instead, the only way you can add volumes to a config is through disk/volume create, so just create it at the last port available. When removing a disk/volume from a config, need to shift down drives further down the list.
- just manage the list of drives through the disk create/delete and volume attach/remove while disallowing updating the list of drives directly unless the drives are filled starting from "sda" without gaps - and managing the adding of drives chronologically so that they have the correct names.
- Linode Reboot - Boot from config
- Linode Delete - cycle through all associated disks and delete them
- Volume Create - attach to Linode instance
- Volume Delete - need to detach from current linode and add code to and config switching behavior to check if the volume exists
- Disk Create - attach to linode instance, add to config, etc.
- Disk Delete - unmount it, delete the volume, delete from disks list in sql, look through all configs and delete it.
- Require a pass when using linode create
- Linode Password Reset - Linode requires the machine to be shut down to change the pass. This is contrary to what must be the case with virtualbox. need to turn it on, change pass and turn it back off I suppose.
- Use disk size variable from type when creating insance, probably won't implement this any time soon
- Linode Resize - actually resize the disk
- Finalize template VM process and add automation of it's creation to the setup script. Add instructions on how to modify the template to the README.
