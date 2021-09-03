import path from "path";

import express from "express";
import sqlite3 from "sqlite3";

import { virtualbox, default_machine_folder } from "../setup/virtualbox";

const router = express.Router();
const db = new sqlite3.Database(
  path.join(__dirname, "../data/database.sqlite3")
);

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
    tags: string[] = [],
    datetime = new Date().toISOString();
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
router.post("/:volumeId/attach", (req, res) => {
  let config_id = req.headers.config_id;
  let linode_id = req.headers.linode_id;
  let persist_across_boots =
    req.headers.persist_across_boots == "false" ? false : true;
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
  console.log(persist_across_boots, config_id, linode_id);
  if (persist_across_boots) {
    db.get(`SELECT * FROM instances WHERE id='${linode_id}'`, (err, row) => {
      if (err) {
        return res
          .status(500)
          .json({ errors: [{ field: "linode_id", reason: err }] });
      }
      if (!row) {
        return res.status(500).json({
          errors: [{ field: "linode_id", reason: "linode_id does not exist" }],
        });
      }
      let datetime = new Date().toISOString();
      let linode_json = JSON.parse(row["data"]);
      // vboxmanage storageattach VMID --storagectl "SATA" --medium VOLUMEORDISKUUID --type hdd --port PORT NUMBER ASSOCIATED WITH CONFIG SPOT
      // update "updated" field with current datetime for volume and linode instance (and config)
    });
  } else {
    // find port number to attach to
    virtualbox.vboxmanage(
      ["showvminfo", "--machinereadable", linode_id],
      (err: Error, stdout: string) => {
        console.log(
          stdout.split("\n").filter((line) => {
            let kv_list = line.split("=");
            if (kv_list[0].includes("SATA") && kv_list[1].includes("none")) {
              return true;
            }
          })
        );
      }
    );
    // vboxmanage storageattach VMID --storagectl "SATA" --medium VOLUMEORDISKUUID --type hdd --port PORT NUMBER ASSOCIATED WITH CONFIG SPOT
    // update "updated" field with current datetime for volume and linode instance
  }
});

// Volume Detach
router.post("/:volumeId/detach", (req, res) => {
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
      let datetime = new Date().toISOString();
      let volume_json = JSON.parse(row["data"]);
      let volume_uuid = volume_json["id"];
      let linode_id = volume_json["linode_id"];
      if (!linode_id) {
        return res.status(500).json({
          errors: [
            { reason: "This volume isn't attached to any linode instance" },
          ],
        });
      }
      virtualbox.vboxmanage(
        ["showvminfo", "--machinereadable", linode_id],
        (err: Error, stdout: string) => {
          if (err) {
            return res.status(500).json({ errors: [{ reason: err }] });
          }
          let SATA_drives = stdout.split("\n").filter((line) => {
            return line.includes("SATA");
          });
          volume_json["updated"] = datetime;
          console.log(SATA_drives);
        }
      );
      // get port number associated with this uuid
      // vboxmanage storageattach volumeId --storagectl "SATA" --medium none --type hdd --port PORTNUM
      // if successful
      // remove linode_id and linode_label from the config sql
      return res.json({});
    }
  );
});

export default router;
