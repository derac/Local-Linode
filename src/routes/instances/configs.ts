import express from "express";

const router = express.Router({ mergeParams: true });

// ===== Linode Instances Disks API =====
// /v4/linode/instances/:linodeId/disks

// Configuration Profiles List
router.get("/", (req, res) => {});

// Configuration Profile Create
router.post("/", (req, res) => {});

// Configuration Profile Delete
router.delete("/:configId", (req, res) => {});

// Configuration Profile View
router.get("/:configId", (req, res) => {});

// Configuration Profile Update
router.put("/:configId", (req, res) => {});

export default router;
