import express from "express";

const router = express.Router();

// ===== Linode Instances API =====
// /v4/linode/instances

// Linodes List
router.get("/", (req, res) => {
  //docker.listContainers({ all: true }).then((a) => console.log(a));
});

// Linode Create
router.post("/", (req, res) => {});

// Linode Delete
router.delete("/:linodeId", (req, res) => {});

// Linode View
router.get("/:linodeId", (req, res) => {});

// Linode Update
router.put("/:linodeId", (req, res) => {});

// Linode Boot
router.post("/:linodeId/boot", (req, res) => {});

// Configuration Profiles List
router.get("/:linodeId/configs", (req, res) => {});

// Configuration Profile Create
router.post("/:linodeId/configs", (req, res) => {});

// Configuration Profile Delete
router.delete("/:linodeId/configs/:configId", (req, res) => {});

// Configuration Profile View
router.get("/:linodeId/configs/:configId", (req, res) => {});

// Configuration Profile Update
router.put("/:linodeId/configs/:configId", (req, res) => {});

// Disks List
router.get("/:linodeId/disks", (req, res) => {});

// Disk Create
router.post("/:linodeId/disks", (req, res) => {});

// Disk Delete
router.delete("/:linodeId/disks/:diskId", (req, res) => {});

// Disk View
router.get("/:linodeId/disks/:diskId", (req, res) => {});

// Disk Update
router.put("/:linodeId/disks/:diskId", (req, res) => {});

// Disk Clone
router.post("/:linodeId/disks/:diskId/clone", (req, res) => {});

// Disk Root Password Reset
router.post("/:linodeId/disks/:diskId/password", (req, res) => {});

// Disk Resize
router.post("/:linodeId/disks/:diskId/resize", (req, res) => {});

// Firewalls List
router.get("/:linodeId/firewalls", (req, res) => {});

// Networking Information List
router.get("/:linodeId/ips", (req, res) => {});

// IP Address View
router.get("/:linodeId/ips/:address", (req, res) => {});

// IP Address Update
router.put("/:linodeId/ips/:address", (req, res) => {});

// Linode Upgrade
router.post("/:linodeId/mutate", (req, res) => {});

// Linode Root Password Reset
router.post("/:linodeId/password", (req, res) => {});

// Linode Reboot
router.post("/:linodeId/reboot", (req, res) => {});

// Linode Rebuild
router.post("/:linodeId/rebuild", (req, res) => {});

// Linode Resize
router.post("/:linodeId/resize", (req, res) => {});

// Linode Shut Down
router.post("/:linodeId/shutdown", (req, res) => {});

// Linode's Volumes List
router.get("/:linodeId/volumes", (req, res) => {});

export default router;
