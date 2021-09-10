import express from "express";
import { db } from "../../setup/sqlite3_db";

const router = express.Router({ mergeParams: true });

// ===== Linode Instances Configs API =====
// /v4/linode/instances/:linodeId/configs

// Configuration Profiles List
router.get("/", (req, res) => {
  db.get(
    `SELECT configs FROM instances WHERE id='${(req.params as any).linodeId}'`,
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
      return res.json(JSON.parse(row["configs"]));
    }
  );
});

// Configuration Profile Create
// implemenet comments, devices, label
// ignore helpers, interfaces, kernel, memory_limit, root_device, run_level, virt_mode
router.post("/", (req, res) => {
  let linode_id = (req.params as any).linodeId;
  let comments = req.headers.comments ? req.headers.comments : "";
  let devices = req.headers.devices;
  console.log(devices);
  res.json({});
  // get linode instance info from database
  db.get(`SELECT * FROM instances WHERE id='${linode_id}'`, (err, row) => {
    if (err) {
      return res.status(500).json({ errors: [{ reason: err }] });
    }
    if (!row) {
      return res.status(500).json({
        errors: [{ reason: "linode_id does not exist" }],
      });
    }
    let disks_list: any[] = JSON.parse(row["disks"]);
    let configs_list: any[] = JSON.parse(row["configs"]);
  });
});

// Configuration Profile Delete
router.delete("/:configId", (req, res) => {});

// Configuration Profile View
router.get("/:configId", (req, res) => {
  db.get(
    `SELECT configs FROM instances WHERE id='${(req.params as any).linodeId}'`,
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
      let config_json = JSON.parse(row["configs"]).filter((config: any) => {
        return req.params.configId == config["id"];
      });
      if (config_json) {
        return res.json(config_json);
      } else {
        return res.status(500).json({
          errors: [
            {
              field: "linodeId",
              reason: "configId does not exist on this instance",
            },
          ],
        });
      }
    }
  );
});

// Configuration Profile Update
router.put("/:configId", (req, res) => {});

export default router;
