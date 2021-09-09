import path from "path";

import express from "express";
import { db } from "../../setup/sqlite3_db";
import { virtualbox, default_machine_folder } from "../../setup/virtualbox";

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
router.post("/", (req, res) => {
  let size: number = req.headers.size
    ? parseInt(req.headers.size as string)
    : 20;
  let label: string = req.headers.label
    ? (req.headers.label as string)
    : [...Array(48)].map(() => (~~(Math.random() * 36)).toString(36)).join("");
  let datetime: string = new Date().toISOString();
  let linode_id = (req.params as any).linodeId;
  // first get linode instance data from sqlite
  db.get(`SELECT * FROM instances WHERE id='${linode_id}'`, (err, row) => {
    if (err) {
      return res.status(500).json({ errors: [{ reason: err }] });
    }
    if (!row) {
      return res.status(500).json({
        errors: [{ reason: "linode_id does not exist" }],
      });
    }
    virtualbox.vboxmanage(
      [
        "createmedium",
        "--format",
        "VDI",
        "--size",
        size * 1024,
        "--filename",
        path.join(default_machine_folder, label),
      ],
      (err: Error, stdout: string) => {
        if (err) {
          return res.status(500).json({
            errors: [{ reason: err }],
          });
        }
        let disk_uuid = stdout.split(": ")[1].trim();
        let disk_json = {
          created: datetime,
          filesystem: "ext4",
          id: disk_uuid,
          label: label,
          size: size,
          status: "ready",
          updated: datetime,
        };
        let disks_list = JSON.parse(row["disks"]).append(disk_json);
        return res.json(disks_list);
      }
    );
  });
});

// Disk Delete
router.delete("/:diskId", (req, res) => {});

// Disk View
router.get("/:diskId", (req, res) => {
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
      let disk_json = JSON.parse(row["disks"]).filter((disk: any) => {
        return req.params.diskId == disk["id"];
      });
      if (disk_json) {
        return res.json(disk_json);
      } else {
        return res.status(500).json({
          errors: [
            {
              field: "linodeId",
              reason: "diskId does not exist on this instance",
            },
          ],
        });
      }
    }
  );
});

// Disk Update
router.put("/:diskId", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Disk Clone
router.post("/:diskId/clone", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Disk Root Password Reset
router.post("/:diskId/password", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Disk Resize
router.post("/:diskId/resize", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

export default router;
