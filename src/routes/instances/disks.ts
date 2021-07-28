import express from "express";

const router = express.Router({ mergeParams: true });

// ===== Linode Instances Disks API =====
// /v4/linode/instances/:linodeId/disks

// Disks List
router.get("/", (req, res) => {});

// Disk Create
router.post("/", (req, res) => {});

// Disk Delete
router.delete("/:diskId", (req, res) => {});

// Disk View
router.get("/:diskId", (req, res) => {
  res.send(`${(req.params as any).linodeId} ${req.params.diskId}`);
});

// Disk Update
router.put("/:diskId", (req, res) => {});

// Disk Clone
router.post("/:diskId/clone", (req, res) => {});

// Disk Root Password Reset
router.post("/:diskId/password", (req, res) => {});

// Disk Resize
router.post("/:diskId/resize", (req, res) => {});

export default router;
