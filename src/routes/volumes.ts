import express from "express";
import Docker from "dockerode";

import regions from "../data/regions.json";

const router = express.Router();
const docker = new Docker();

// ===== Linode Volumes API =====
// /v4/volumes

// Volumes List
router.get("/", (req, res) => {
  docker.listVolumes().then(() => {
    //res.send(a);
  });
});

// Volume Create
router.post("/", (req, res) => {
  let config_id: number | null,
    label: string,
    linode_id: number | null,
    region: string | null,
    size: number,
    tags: string[] | null;
  let datetime = new Date().toISOString();
  // optional, size in GB defaults to 20
  size = req.headers.size ? parseInt(req.headers.size as string) : 20;
  // optional, linode id to attach to
  linode_id = req.headers.linode_id
    ? parseInt(req.headers.linode_id as string)
    : null;
  // optional, label will be created if not supplied
  label = req.headers.label
    ? (req.headers.label as string)
    : [...Array(32)].map(() => (~~(Math.random() * 36)).toString(36)).join("");
  docker
    .createVolume({ name: label })
    .then((volume) => {
      res.send(volume);
    })
    .catch((err) => {
      res.status(500).json({ errors: [{ reason: err }] });
    });
});

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
