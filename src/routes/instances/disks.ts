import path from "path";

import express from "express";
import { db } from "../../setup/sqlite3_db";

const router = express.Router({ mergeParams: true });

// ===== Linode Instances Disks API =====
// /v4/linode/instances/:linodeId/disks

// Disks List
router.get("/", (req, res) => {
  db.get(
    `SELECT disks FROM instances WHERE id='${(req.params as any).linodeId}'`,
    (err, row) => {
      if (err) {
        return res
          .status(500)
          .json({ errors: [{ field: "linodeId", reason: err }] });
      }
      if (!row) {
        return res.status(500).json({
          errors: [{ field: "linodeId", reason: "linodeId does not exist" }],
        });
      }
      return res.json(JSON.parse(row["disks"]));
    }
  );
});

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
