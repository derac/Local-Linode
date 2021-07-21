import express from "express";

const router = express.Router();

// ===== Linode Volumes API =====
// /v4/volumes

// Volumes List
router.get("/", (req, res) => {});

// Volume Create
router.post("/", (req, res) => {});

// Volume Delete
router.delete("/:volumeId", (req, res) => {});

// Volume View
router.get("/:volumeId", (req, res) => {});

// Volume Update
router.put("/:volumeId", (req, res) => {});

// Volume Attach
router.post("/:volumeId/attach", (req, res) => {});

// Volume Clone
router.post("/:volumeId/clone", (req, res) => {});

// Volume Detach
router.post("/:volumeId/detach", (req, res) => {});

// Volume Resize
router.post("/:volumeId/resize", (req, res) => {});

export default router;
