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
  let devices: any;
  try {
    devices = JSON.parse(req.headers.devices as string);
  } catch {
    return res
      .status(500)
      .json({ errors: [{ reason: "Invalid devices JSON." }] });
  }
  let label: string = req.headers.label
    ? (req.headers.label as string)
    : [...Array(48)].map(() => (~~(Math.random() * 36)).toString(36)).join("");
  console.log(devices);
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
    let configs_list: any[] = JSON.parse(row["configs"]);
    // we don't bother to check if it's valid
    // if there is an issue with the config, it will be obvious when booting it
    let config_json = {
      comments: comments,
      devices: devices,
      helpers: {
        devtmpfs_automount: false,
        distro: false,
        modules_dep: false,
        network: true,
        updatedb_disabled: true,
      },
      id: label,
      interfaces: [],
      kernel: "linode/latest-64bit",
      label: label,
      memory_limit: 2048,
      root_device: "/dev/sda",
      run_level: "default",
      virt_mode: "paravirt",
    };
    configs_list.push(config_json);

    // update sql

    res.json(configs_list);
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
