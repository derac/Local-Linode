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
    if (config_index == -1) {
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
        // attach disk to linode intance
        virtualbox.vboxmanage(
          [
            "storageattach",
            linode_id,
            "--storagectl",
            "SATA",
            "--medium",
            disk_uuid,
            "--type",
            "hdd",
            "--port",
            port_number,
          ],
          (err: Error, _stdout: string) => {
            if (err) {
              return res.status(500).json({ errors: [{ reason: err }] });
            }
            let disk_json = {
              created: datetime,
              filesystem: "ext4",
              id: disk_uuid,
              label: label,
              size: size,
              status: "ready",
              updated: datetime,
            };
            let disks_list = JSON.parse(row["disks"]);
            disks_list.push(disk_json);
            configs_list[config_index]["devices"][hdd_slot]["disk_id"] =
              disk_uuid;
            linode_json["updated"] = datetime;
            // create partition and format the drive as ext4
            // need to wait for storage to actually be attached.
            // TODO: make this retry for x seconds ever so often rather than waiting for 2s
            setTimeout(() => {
              virtualbox.vboxmanage(
                [
                  "guestcontrol",
                  "f06xh9gqtyo6nxr342svzenw4ulysfv1",
                  "--username",
                  "local-linode",
                  "--password",
                  "local-linode",
                  "run",
                  "/bin/sh",
                  "--",
                  "-c",
                  `echo local-linode | sudo -S parted /dev/${hdd_slot} mklabel gpt`,
                ],
                (err: Error, stdout: string) => {
                  if (err) {
                    return res.status(500).json({
                      errors: [
                        {
                          message:
                            "If you're seeing this error, it may be because the drive hasn't been created yet. Need to improve code for checking this. For now there is a simple wait.",
                          reason: err,
                        },
                      ],
                    });
                  }
                  virtualbox.vboxmanage(
                    [
                      "guestcontrol",
                      "f06xh9gqtyo6nxr342svzenw4ulysfv1",
                      "--username",
                      "local-linode",
                      "--password",
                      "local-linode",
                      "run",
                      "/bin/sh",
                      "--",
                      "-c",
                      `echo local-linode | sudo -S parted /dev/${hdd_slot} mkpart primary ext4 0% 100%`,
                    ],
                    (err: Error, stdout: string) => {
                      if (err) {
                        return res
                          .status(500)
                          .json({ errors: [{ reason: err }] });
                      }
                      console.log(stdout);
                      // we need to update disks list, config, and linode data in sqlite
                      db.run(
                        `UPDATE instances SET data = '${JSON.stringify(
                          linode_json
                        )}', configs = '${JSON.stringify(
                          configs_list
                        )}', disks = '${JSON.stringify(
                          disks_list
                        )}' WHERE id='${linode_id}'`,
                        (err) => {
                          if (err) {
                            return res.status(500).json({
                              errors: [{ field: "linode_id", reason: err }],
                            });
                          }
                          // return successfully
                          return res.json(disk_json);
                        }
                      );
                    }
                  );
                }
              );
            }, 3000);
          }
        );
      }
    );
  });
});

// Disk Delete
router.delete("/:diskId", (req, res) => {
  let disk_id = req.params.diskId;
  let linode_id = (req.params as any).linodeId;
  let datetime = new Date().toISOString();
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
    let linode_json = JSON.parse(row["data"]);
    let current_config = row["current_config"];
    let disks_list: any[] = JSON.parse(row["disks"]);
    let configs_list: any[] = JSON.parse(row["configs"]);
    // get index of config_id in configs_list
    let config_index = configs_list.findIndex((el) => {
      return el["id"] == current_config;
    });

    let port_number;

    // find the hdd slot this volume is on, exit if it's not on the current config
    let device_config: any[] = configs_list[config_index]["devices"];
    for (const [k, v] of Object.entries(device_config)) {
      if (v["disk_id"] == disk_id) {
        port_number = k[2].charCodeAt(0) - 97;
        configs_list[config_index]["devices"][k]["disk_id"] = null;
        break;
      } else if (k == "sdh") {
        return res.status(500).json({
          errors: [
            {
              reason: "The current config does not have this disk mounted.",
            },
          ],
        });
      }
    }

    virtualbox.vboxmanage(
      [
        "storageattach",
        linode_id,
        "--storagectl",
        "SATA",
        "--medium",
        "none",
        "--type",
        "hdd",
        "--port",
        port_number,
      ],
      (err: Error, _stdout: string) => {
        if (err) {
          return res.status(500).json({
            errors: [
              {
                reason: `Failed to detach Disk from Instance. In virtualbox, this drive may not have hotswappable set.\n${err}`,
              },
            ],
          });
        }
        // successfully deleted drive
        // filter disk id out of disks list
        disks_list = disks_list.filter((el) => {
          return el["id"] != disk_id;
        });
        linode_json["updated"] = datetime;
        // update disks, configs, and linode data in sql
        db.run(
          `UPDATE instances SET data = '${JSON.stringify(
            linode_json
          )}', configs = '${JSON.stringify(
            configs_list
          )}', disks = '${JSON.stringify(disks_list)}' WHERE id='${linode_id}'`,
          (err) => {
            if (err) {
              return res
                .status(500)
                .json({ errors: [{ field: "linode_id", reason: err }] });
            }
            return res.json({});
          }
        );
      }
    );
  });
});

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
