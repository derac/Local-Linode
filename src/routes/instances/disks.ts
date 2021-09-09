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

    // check that this linode instance is on
    let linode_json = JSON.parse(row["data"]);
    if (linode_json["status"] != "running") {
      return res.status(500).json({
        errors: [
          {
            reason:
              "The linode you've chosen is not running. This information is taken from the database.",
          },
        ],
      });
    }
    let current_config = row["current_config"];
    let configs_list: any[] = JSON.parse(row["configs"]);
    let config_index = configs_list.findIndex((el) => {
      return el["id"] == current_config;
    });
    // sanity check that the current config exists
    if (!config_index) {
      return res.status(500).json({
        errors: [
          {
            reason:
              "The current config isn't in the list of configs. This indicates a corrupt sqlite database.",
          },
        ],
      });
    }
    // get the hdd slot we will attach to.
    let device_config: any[] = configs_list[config_index]["devices"];
    let hdd_slot = "";
    for (const [k, v] of Object.entries(device_config)) {
      if (v["disk_id"] == null && v["volume_id"] == null) {
        hdd_slot = k;
        break;
      } else if (k == "sdh") {
        return res.status(500).json({
          errors: [
            {
              field: "current_config",
              reason: "Current config does not have any open hard disk slots.",
            },
          ],
        });
      }
    }
    let port_number = hdd_slot[2].charCodeAt(0) - 97;
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
        // TODO: we need to log into the machine and format the drive as ext4
        // TODO: after creation, we need to add the disk to the current config and disks list
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
