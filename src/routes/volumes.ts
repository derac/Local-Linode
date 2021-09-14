import path from "path";

import express from "express";

import { db } from "../setup/sqlite3_db";
import { virtualbox, default_machine_folder } from "../setup/virtualbox";

const router = express.Router();

// ===== Linode Volumes API =====
// /v4/volumes

// Volumes List
router.get("/", (req, res) => {
  db.all("SELECT * FROM volumes", (err, rows) => {
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

// Volume Create
router.post("/", (req, res) => {
  let config_id: number | null;
  let label: string = req.headers.label
    ? (req.headers.label as string)
    : [...Array(32)].map(() => (~~(Math.random() * 36)).toString(36)).join("");
  let linode_id: number | null = req.headers.linode_id
    ? parseInt(req.headers.linode_id as string)
    : null;
  let region: string | null;
  let size: number = req.headers.size
    ? parseInt(req.headers.size as string)
    : 20;
  let tags: string[] = [];
  let datetime = new Date().toISOString();
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
  db.get(`SELECT * FROM volumes WHERE id='${label}'`, (err, row) => {
    if (err) {
      return res.status(500).json({
        errors: [{ reason: err }],
      });
    }
    if (row) {
      return res.status(500).json({
        errors: [
          { field: "volumeId", reason: "volumeId (label) already exists." },
        ],
      });
    } else {
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
          let medium_uuid = stdout.split(": ")[1].trim();
          let res_json = {
            created: datetime,
            filesystem_path: path.join(default_machine_folder, label),
            id: medium_uuid,
            label: label,
            size: size,
            status: "active",
            updated: datetime,
            tags: tags,
            region: region,
            linode_id: "",
            linode_label: "",
          };
          db.run(
            `INSERT INTO volumes ('id','data') VALUES ('${medium_uuid}','${JSON.stringify(
              res_json
            )}')`
          );
          return res.json(res_json);
        }
      );
    }
  });
});

// Volume Delete
router.delete("/:volumeId", (req, res) => {
  let volume_id = req.params.volumeId;
  db.get(`SELECT data FROM volumes WHERE id='${volume_id}'`, (err, row) => {
    if (err) {
      return res
        .status(500)
        .json({ errors: [{ field: "volumeId", reason: err }] });
    }
    if (!row) {
      return res.status(500).json({
        errors: [{ field: "volumeId", reason: "volumeId does not exist." }],
      });
    }
    db.run(`DELETE FROM volumes WHERE id='${volume_id}'`, (err) => {
      if (err) {
        return res
          .status(500)
          .json({ errors: [{ field: "volumeId", reason: err }] });
      }
      virtualbox.vboxmanage(
        ["closemedium", "disk", volume_id, "--delete"],
        (err: Error) => {
          if (err) {
            return res.status(500).json({ errors: [{ reason: err }] });
          }
          return res.json({});
        }
      );
    });
  });
});

// Volume View
router.get("/:volumeId", (req, res) => {
  db.get(
    `SELECT data FROM volumes WHERE id='${req.params.volumeId}'`,
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
      return res.json(JSON.parse(row["data"]));
    }
  );
});

// Volume Update
router.put("/:volumeId", (req, res) => {
  let label = req.headers.label as string;
  let volumedId = req.params.volumeId as string;
  if (!label) {
    return res.status(500).json({
      errors: [{ field: "label", reason: "label must be a valid value" }],
    });
  }
  let tags: string[] | null = null;
  try {
    if (req.headers.tags) {
      tags = JSON.parse(req.headers.tags as string);
      if (!tags?.every((el) => typeof el === "string")) {
        throw "All values of tags array must be strings";
      }
    }
  } catch {
    return res.status(500).json({
      errors: [{ field: "tags", reason: "tags must be a valid value" }],
    });
  }
  let datetime: string = new Date().toISOString();
  db.get(`SELECT data FROM volumes WHERE id='${volumedId}'`, (err, row) => {
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
    virtualbox.vboxmanage(
      [
        "modifymedium",
        volumedId,
        "--move",
        path.join(default_machine_folder, `${label}.vdi`),
      ],
      (err: Error) => {
        if (err) {
          return res.status(500).json({ errors: [{ reason: err }] });
        }
        updated_json["label"] = label;
        updated_json["updated"] = datetime;
        if (tags) {
          updated_json["tags"] = tags;
        }
        db.run(
          `UPDATE volumes SET data='${JSON.stringify(
            updated_json
          )}' WHERE id='${volumedId}'`,
          (err) => {
            if (err) {
              return res
                .status(500)
                .json({ errors: [{ field: "volumeId", reason: err }] });
            }
            return res.json(updated_json);
          }
        );
      }
    );
  });
});

// Volume Resize
router.post("/:volumeId/resize", (req, res) => {
  let size = Number(req.headers.size);
  let volumeId = req.params.volumeId as string;
  if (!size || isNaN(size as any)) {
    return res.status(500).json({
      errors: [{ field: "size", reason: "size must be a valid value" }],
    });
  }
  let datetime = new Date().toISOString();
  db.get(`SELECT data FROM volumes WHERE id='${volumeId}'`, (err, row) => {
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
    virtualbox.vboxmanage(
      ["modifymedium", volumeId, "--resize", size * 1024],
      (err: Error) => {
        if (err) {
          return res.status(500).json({ errors: [{ reason: err }] });
        }
        updated_json["size"] = size;
        updated_json["updated"] = datetime;
        db.run(
          `UPDATE volumes SET data='${JSON.stringify(
            updated_json
          )}' WHERE id='${volumeId}'`,
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
});

// Volume Attach
// disallow persist_across_boots being false to work around mounting device name issue
router.post("/:volumeId/attach", (req, res) => {
  let config_id = req.headers.config_id;
  let linode_id = req.headers.linode_id;
  if (req.headers.persist_across_boots == "false") {
    return res.status(500).json({
      errors: [
        {
          field: "persist_across_boots",
          reason: "persist_across_boots must be true in this implementation.",
        },
      ],
    });
  }
  let volumeId = req.params.volumeId as string;
  if (!linode_id) {
    return res.status(500).json({
      errors: [
        {
          field: "linode_id",
          reason: "linode_id is a required header.",
        },
      ],
    });
  }

  // get the volume data
  db.get(`SELECT data FROM volumes WHERE id='${volumeId}'`, (err, row) => {
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
    let volume_json = JSON.parse(row["data"]);

    // get instance data
    db.get(`SELECT * FROM instances WHERE id='${linode_id}'`, (err, row) => {
      if (err) {
        return res
          .status(500)
          .json({ errors: [{ field: "linode_id", reason: err }] });
      }
      if (!row) {
        return res.status(500).json({
          errors: [
            {
              field: "linode_id",
              reason: "linode_id does not exist",
            },
          ],
        });
      }
      let datetime = new Date().toISOString();
      let linode_json = JSON.parse(row["data"]);
      let configs_list: any[] = JSON.parse(row["configs"]);
      let current_config: string = row["current_config"];
      if (!config_id) {
        config_id = current_config;
      }
      // get index of config_id in configs_list
      let config_index = configs_list.findIndex((el) => {
        return el["id"] == config_id;
      });

      // find the first open slot in the config
      let device_config: Object = configs_list[config_index]["devices"];
      let hdd_slot = "";

      for (const [k, v] of Object.entries(device_config)) {
        if (v["disk_id"] == null && v["volume_id"] == null) {
          hdd_slot = k;
          break;
        } else if (k == "sdh") {
          return res.status(500).json({
            errors: [
              {
                field: "config_id",
                reason: "config_id does not have any open hard disk slots.",
              },
            ],
          });
        }
      }

      // get port number to attach to
      let port_number = hdd_slot[2].charCodeAt(0) - 97;

      // now we're ready to attach
      virtualbox.vboxmanage(
        [
          "storageattach",
          linode_json["id"],
          "--storagectl",
          "SATA",
          "--medium",
          volume_json["id"],
          "--type",
          "hdd",
          "--port",
          port_number,
        ],
        (err: Error, _stdout: string) => {
          if (err) {
            return res.status(500).json({ errors: [{ reason: err }] });
          }
          // successfully attached

          // set updated fields
          configs_list[config_index]["devices"][hdd_slot]["volume_id"] =
            volumeId;
          volume_json["linode_id"] = linode_json["id"];
          volume_json["linode_label"] = linode_json["label"];
          linode_json["updated"] = datetime;
          volume_json["updated"] = datetime;

          db.run(
            `UPDATE instances SET data = '${JSON.stringify(
              linode_json
            )}', configs = '${JSON.stringify(
              configs_list
            )}' WHERE id='${linode_id}'`,
            (err) => {
              if (err) {
                return res
                  .status(500)
                  .json({ errors: [{ field: "linode_id", reason: err }] });
              }
              db.run(
                `UPDATE volumes SET data = '${JSON.stringify(
                  volume_json
                )}' WHERE id='${volumeId}'`,
                (err) => {
                  if (err) {
                    return res.status(500).json({
                      errors: [{ field: "volumeId", reason: err }],
                    });
                  }
                  // complete :)
                  return res.json(volume_json);
                }
              );
            }
          );
        }
      );
    });
  });
});

// Volume Detach
router.post("/:volumeId/detach", (req, res) => {
  let volume_id = req.params.volumeId;
  db.get(`SELECT data FROM volumes WHERE id='${volume_id}'`, (err, row) => {
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
    let datetime = new Date().toISOString();
    let volume_json = JSON.parse(row["data"]);
    let linode_id = volume_json["linode_id"];
    if (!linode_id) {
      return res.status(500).json({
        errors: [
          { reason: "This volume isn't attached to any linode instance" },
        ],
      });
    }

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
      let configs_list: any[] = JSON.parse(row["configs"]);
      let current_config = row["current_config"];
      // get index of config_id in configs_list
      let config_index = configs_list.findIndex((el) => {
        return el["id"] == current_config;
      });

      let port_number;

      // find the hdd slot this volume is on, exit if it's not on the current config
      let device_config: Object = configs_list[config_index]["devices"];
      for (const [k, v] of Object.entries(device_config)) {
        if (v["volume_id"] == volume_id) {
          port_number = k[2].charCodeAt(0) - 97;
          configs_list[config_index]["devices"][k]["volume_id"] = null;
          break;
        } else if (k == "sdh") {
          return res.status(500).json({
            errors: [
              {
                reason: "The current config does not have this volume mounted.",
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
                  reason: `Failed to detach Volume from Instance. In virtualbox, this drive may not have hotswappable set.\n${err}`,
                },
              ],
            });
          }
          // successfully detached

          volume_json["linode_id"] = "";
          volume_json["linode_label"] = "";
          linode_json["updated"] = datetime;
          volume_json["updated"] = datetime;

          // update sql
          db.run(
            `UPDATE instances SET data = '${JSON.stringify(
              linode_json
            )}', configs = '${JSON.stringify(
              configs_list
            )}' WHERE id='${linode_id}'`,
            (err) => {
              if (err) {
                return res
                  .status(500)
                  .json({ errors: [{ field: "linode_id", reason: err }] });
              }
              db.run(
                `UPDATE volumes SET data = '${JSON.stringify(
                  volume_json
                )}' WHERE id='${volume_id}'`,
                (err) => {
                  if (err) {
                    return res.status(500).json({
                      errors: [{ field: "volumeId", reason: err }],
                    });
                  }
                  // complete :)
                  return res.json({});
                }
              );
            }
          );
        }
      );
    });
  });
});

export default router;
