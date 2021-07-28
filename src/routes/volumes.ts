import path from "path";

import express from "express";
import Docker from "dockerode";
import sqlite3 from "sqlite3";

import regions from "../data/regions.json";

const router = express.Router();
const docker = new Docker();
const db = new sqlite3.Database(
  path.join(__dirname, "../data/database.sqlite3")
);

// ===== Linode Volumes API =====
// /v4/volumes

// Volumes List
router.get("/", (req, res) => {
  db.all("SELECT * FROM volumes", (err, rows) => {
    rows = rows.map((row) => ({ data: row["data"] }));
    rows.length;
    return res.json({
      data: rows,
      page: 1,
      pages: 1,
      results: rows.length,
    });
  });
});

// Volume Create
router.post("/", (req, res) => {
  let config_id: number | null,
    label: string = req.headers.label
      ? (req.headers.label as string)
      : [...Array(32)]
          .map(() => (~~(Math.random() * 36)).toString(36))
          .join(""),
    linode_id: number | null = req.headers.linode_id
      ? parseInt(req.headers.linode_id as string)
      : null,
    region: string | null,
    size: number = req.headers.size ? parseInt(req.headers.size as string) : 20,
    tags: string[] | null,
    datetime = new Date().toISOString();
  docker
    .createVolume({ name: label })
    .then((volume) => {
      let id: number;
      db.get("SELECT MAX(id) from volumes", (err, row) => {
        if (row["MAX(id)"]) {
          id = row["MAX(id)"] + 1;
        } else {
          id = 1;
        }
        let res_json = {
          created: datetime,
          filesystem_path: `/dev/disk/by-id/scsi-0Linode_Volume_${label}`,
          id: id,
          label: label,
          size: size,
          status: "active",
          updated: datetime,
        };
        db.run(
          `INSERT INTO volumes ('data') VALUES ('${JSON.stringify(res_json)}')`
        );
        return res.json(res_json);
      });
    })
    .catch((err) => {
      return res.status(500).json({ errors: [{ reason: err }] });
    });
});

// Volume Delete
router.delete("/:volumeId", (req, res) => {
  if (isNaN(req.params.volumeId as any)) {
    return res.status(500).json({
      errors: [{ field: "volumeId", reason: "volumeId must be a valid value" }],
    });
  }
  db.run(`DELETE FROM volumes WHERE id=${req.params.volumeId}`, (err) => {
    if (err) {
      return res
        .status(500)
        .json({ errors: [{ field: "volumeId", reason: err }] });
    }
    return res.json({});
  });
});

// Volume View
router.get("/:volumeId", (req, res) => {
  if (isNaN(req.params.volumeId as any)) {
    return res.status(500).json({
      errors: [{ field: "volumeId", reason: "volumeId must be a valid value" }],
    });
  }
  db.get(
    `SELECT data FROM volumes WHERE id=${req.params.volumeId}`,
    (err, row) => {
      if (err) {
        return res
          .status(500)
          .json({ errors: [{ field: "volumeId", reason: err }] });
      }
      if (!row) {
        return res.status(500).json({
          errors: [{ field: "volumeId", reason: "volumeId does not exist" }],
        });
      }
      return res.json(row["data"]);
    }
  );
});

// Volume Update
router.put("/:volumeId", (req, res) => {});

// Volume Attach
router.post("/:volumeId/attach", (req, res) => {});

// Volume Clone
router.post("/:volumeId/clone", (req, res) => {});

// Volume Detach
router.post("/:volumeId/detach", (req, res) => {});

// Volume Resize
router.post("/:volumeId/resize", (req, res) => {
  if (isNaN(req.params.volumeId as any)) {
    return res.status(500).json({
      errors: [{ field: "volumeId", reason: "volumeId must be a valid value" }],
    });
  }
  if (!req.headers.size || isNaN(req.headers.size as any)) {
    return res.status(500).json({
      errors: [{ field: "size", reason: "size must be a valid value" }],
    });
  }
  db.get(
    `SELECT data FROM volumes WHERE id=${req.params.volumeId}`,
    (err, row) => {
      if (err) {
        return res
          .status(500)
          .json({ errors: [{ field: "volumeId", reason: err }] });
      }
      if (!row) {
        return res.status(500).json({
          errors: [{ field: "volumeId", reason: "volumeId does not exist" }],
        });
      }
      let updated_json = JSON.parse(row["data"]);
      updated_json["size"] = Number(req.headers.size);
      db.run(
        `UPDATE volumes SET data='${JSON.stringify(updated_json)}' WHERE id=${
          req.params.volumeId
        }`,
        (err) => {
          if (err) {
            return res
              .status(500)
              .json({ errors: [{ field: "volumeId", reason: err }] });
          }
          return res.json({});
        }
      );
    }
  );
});

export default router;
