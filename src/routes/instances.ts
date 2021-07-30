import path from "path";

import express from "express";
import Docker from "dockerode";
import sqlite3 from "sqlite3";

import types from "../data/types.json";
import regions from "../data/regions.json";
import disks from "./instances/disks";
import configs from "./instances/configs";

const router = express.Router();
const docker = new Docker();

const db = new sqlite3.Database(
  path.join(__dirname, "../data/database.sqlite3")
);

// ===== Linode Instances API =====
// /v4/linode/instances

router.use("/:linodeId/disks", disks);
router.use("/:linodeId/configs", configs);

// Linodes List
router.get("/", (req, res) => {
  db.all("SELECT * FROM instances", (err, rows) => {
    rows = rows.map((row) => ({ data: JSON.parse(row["data"]) }));
    rows.length;
    return res.json({
      data: rows,
      page: 1,
      pages: 1,
      results: rows.length,
    });
  });
});

// Linode Create
router.post("/", (req, res) => {
  let label: string = req.headers.label
      ? (req.headers.label as string)
      : [...Array(32)]
          .map(() => (~~(Math.random() * 36)).toString(36))
          .join(""),
    datetime: string = new Date().toISOString(),
    tags: string[] = [];

  // process tags header
  try {
    if (req.headers.tags) {
      tags = JSON.parse(req.headers.tags as string);
      if (!tags?.every((el) => typeof el === "string")) {
        throw "All values of tags array must be strings";
      }
    }
  } catch {
    return res.status(500).json({
      errors: [{ field: "tags", reason: "tags must be a valid value." }],
    });
  }

  // check type header for validity
  if (!req.headers.type) {
    return res.status(500).json({
      errors: [{ field: "type", reason: "type is a required request header." }],
    });
  }
  let typeData = types.data.filter((type) => type.id == req.headers.type);
  if (!typeData.length) {
    return res.status(500).json({
      errors: [
        {
          field: "type",
          reason: "type was not found in allowed types list.",
        },
      ],
    });
  }

  // check region header for validity
  if (!req.headers.region) {
    return res.status(500).json({
      errors: [
        { field: "region", reason: "region is a required request header." },
      ],
    });
  }
  let regionData = regions.data.filter(
    (region) => region.id == req.headers.region
  );
  if (!regionData.length) {
    return res.status(500).json({
      errors: [
        {
          field: "region",
          reason: "region was not found in allowed regions list.",
        },
      ],
    });
  }

  // check the label header for validity
  if (!(2 < label.length && label.length < 33)) {
    return res.status(500).json({
      errors: [
        {
          field: "label",
          reason: "label must be between 2 and 32 characters.",
        },
      ],
    });
  }

  // start creating the container
  docker.createContainer(
    {
      Image: "ubuntu:latest",
      Tty: true,
      name: label,
    },
    (err, container) => {
      if (err) {
        return res.status(500).json({
          errors: [
            {
              reason: "Container could not be created.",
            },
          ],
        });
      }
      if (container) {
        container.start({}, (err, data) => {
          if (err) {
            return res.status(500).json({
              errors: [
                {
                  reason: "Container could not be started.",
                },
              ],
            });
          } else {
            let res_json = {
              alerts: {
                cpu: 180,
                io: 10000,
                network_in: 10,
                network_out: 10,
                transfer_quota: 80,
              },
              backups: {
                enabled: false,
              },
              created: datetime,
              group: "Linode-Group",
              hypervisor: "kvm",
              id: container.id,
              image: "linode/ubuntu20.04",
              ipv4: ["203.0.113.1", "192.0.2.1"],
              ipv6: "c001:d00d::1337/128",
              label: label,
              region: req.headers.region,
              specs: {
                disk: typeData[0].disk,
                memory: typeData[0].memory,
                transfer: typeData[0].transfer,
                vcpus: typeData[0].vcpus,
              },
              status: "running",
              tags: tags,
              type: req.headers.type,
              updated: datetime,
              watchdog_enabled: true,
            };
            db.run(
              `INSERT INTO instances ('id','data') VALUES ('${
                container.id
              }','${JSON.stringify(res_json)}')`
            );
            return res.json(res_json);
          }
        });
      }
    }
  );
});

// Linode Delete
router.delete("/:linodeId", (req, res) => {
  db.get(
    `SELECT data FROM instances WHERE id='${req.params.linodeId}'`,
    (err, row) => {
      if (err) {
        return res
          .status(500)
          .json({ errors: [{ field: "linodeId", reason: err }] });
      }
      if (!row) {
        return res.status(500).json({
          errors: [{ field: "linodeId", reason: "linodeId does not exist." }],
        });
      }
      db.run(
        `DELETE FROM instances WHERE id='${req.params.linodeId}'`,
        (err) => {
          if (err) {
            return res
              .status(500)
              .json({ errors: [{ field: "linodeId", reason: err }] });
          }
          docker
            .getContainer(req.params.linodeId)
            .remove({ force: true }, (err) => {
              if (err) {
                return res.status(500).json({
                  errors: [{ reason: err }],
                });
              } else {
                return res.json({});
              }
            });
        }
      );
    }
  );
});

// Linode View
router.get("/:linodeId", (req, res) => {
  db.get(
    `SELECT data FROM instances WHERE id='${req.params.linodeId}'`,
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
      return res.json(JSON.parse(row["data"]));
    }
  );
});

// Linode Update
router.put("/:linodeId", (req, res) => {});

// Linode Boot
router.post("/:linodeId/boot", (req, res) => {});

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
