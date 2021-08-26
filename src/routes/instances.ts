import path from "path";

import express from "express";
import sqlite3 from "sqlite3";

import types from "../data/types.json";
import regions from "../data/regions.json";
import disks from "./instances/disks";
import configs from "./instances/configs";

const virtualbox = require("virtualbox");
const router = express.Router();
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
  virtualbox.vmImport(
    "F:\\downloads\\ubuntu_server_template.ova",
    { vmname: label, cpus: 1, memory: 1024 },
    (err: Error) => {
      if (err) {
        return res.status(500).json({
          errors: [
            {
              reason: err,
            },
          ],
        });
      }
      // get vm reference
      virtualbox.start(label, (err: Error) => {
        if (err) {
          return res.status(500).json({
            errors: [
              {
                reason: err,
              },
            ],
          });
        } else {
          virtualbox.guestproperty.get(
            { vm: label, key: "/VirtualBox/GuestInfo/Net/0/V4/IP" },
            (address: string) => {
              let res_json = { ip: address };
              /*
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
            ipv4: data.NetworkSettings.IPAddress,
            ipv6: data.NetworkSettings.GlobalIPv6Address,
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
          );*/
              console.log(res_json);
              return res.json(res_json);
            }
          );
        }
      });
    }
  );
});

/*

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
router.put("/:linodeId", (req, res) => {
  let label: string | null = req.headers.label
      ? (req.headers.label as string)
      : null,
    tags: string[] | null = null;
  if (label) {
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
  }
  // process tags header if present
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
      let updated_json = JSON.parse(row["data"]);
      if (label) {
        updated_json["label"] = label;
      }
      if (tags) {
        updated_json["tags"] = tags;
      }
      let datetime = new Date().toISOString();
      updated_json["updated"] = datetime;
      db.run(
        `UPDATE instances SET data='${JSON.stringify(
          updated_json
        )}' WHERE id='${req.params.linodeId}'`,
        (err) => {
          if (err) {
            return res
              .status(500)
              .json({ errors: [{ field: "linodeId", reason: err }] });
          }
          return res.json(updated_json);
        }
      );
    }
  );
});

// Linode Boot
router.post("/:linodeId/boot", (req, res) => {
  docker.getContainer(req.params.linodeId).start({}, (err) => {
    if (err) {
      return res.status(500).json({
        field: "linodeId",
        errors: [{ reason: err }],
      });
    } else {
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
              errors: [
                { field: "linodeId", reason: "linodeId does not exist" },
              ],
            });
          }
          let updated_json = JSON.parse(row["data"]);
          updated_json["status"] = "running";
          db.run(
            `UPDATE instances SET data='${JSON.stringify(
              updated_json
            )}' WHERE id='${req.params.linodeId}'`,
            (err) => {
              if (err) {
                return res
                  .status(500)
                  .json({ errors: [{ field: "linodeId", reason: err }] });
              }
              return res.json({});
            }
          );
        }
      );
    }
  });
});

// IP Address View
router.get("/:linodeId/ips/:address", (req, res) => {
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
      let json_data = JSON.parse(row["data"]);
      if (req.params.address != json_data["ipv4"]) {
        return res.status(500).json({
          errors: [
            {
              field: "address",
              reason: "address does not exist on the node specified.",
            },
          ],
        });
      }
      let container = docker
        .getContainer(json_data["id"])
        .inspect()
        .then((data) => {
          const createNetmaskAddr = (bitCount: number) => {
            let mask = [];
            let n;
            for (let i = 0; i < 4; i++) {
              n = Math.min(bitCount, 8);
              mask.push(256 - Math.pow(2, 8 - n));
              bitCount -= n;
            }
            return mask.join(".");
          };
          let json_response = {
            address: json_data["ipv4"],
            gateway: data.NetworkSettings.Gateway,
            linode_id: json_data["id"],
            prefix: data.NetworkSettings.IPPrefixLen,
            public: true,
            rdns: "",
            region: json_data["region"],
            subnet_mask: createNetmaskAddr(data.NetworkSettings.IPPrefixLen),
            type: "ipv4",
          };
          return res.json(json_response);
        });
    }
  );
});

// Linode Resize
router.post("/:linodeId/resize", (req, res) => {
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
      let updated_json = JSON.parse(row["data"]);
      updated_json["type"] = req.headers.type;
      updated_json["specs"] = {
        disk: typeData[0].disk,
        memory: typeData[0].memory,
        transfer: typeData[0].transfer,
        vcpus: typeData[0].vcpus,
      };
      let datetime = new Date().toISOString();
      updated_json["updated"] = datetime;
      db.run(
        `UPDATE instances SET data='${JSON.stringify(
          updated_json
        )}' WHERE id='${req.params.linodeId}'`,
        (err) => {
          if (err) {
            return res
              .status(500)
              .json({ errors: [{ field: "linodeId", reason: err }] });
          }
          return res.json(updated_json);
        }
      );
    }
  );
});

// Linode Shut Down
router.post("/:linodeId/shutdown", (req, res) => {
  docker.getContainer(req.params.linodeId).stop({}, (err) => {
    if (err) {
      return res.status(500).json({
        field: "linodeId",
        errors: [{ reason: err }],
      });
    } else {
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
              errors: [
                { field: "linodeId", reason: "linodeId does not exist" },
              ],
            });
          }
          let updated_json = JSON.parse(row["data"]);
          updated_json["status"] = "stopped";
          db.run(
            `UPDATE instances SET data='${JSON.stringify(
              updated_json
            )}' WHERE id='${req.params.linodeId}'`,
            (err) => {
              if (err) {
                return res
                  .status(500)
                  .json({ errors: [{ field: "linodeId", reason: err }] });
              }
              return res.json({});
            }
          );
        }
      );
    }
  });
});

// Linode Upgrade
router.post("/:linodeId/mutate", (req, res) => {
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
      return res.json({});
    }
  );
});

// Linode Root Password Reset
// NOTE - Linode requires the machine to be shut down to change the pass.
// This can't be done with Docker afaik, the container must be up.
router.post("/:linodeId/password", (req, res) => {});

// Linode Reboot
// TO DO - add config logic if needed
router.post("/:linodeId/reboot", (req, res) => {
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
      return res.json({});
    }
  );
});

// Linode's Volumes List
router.get("/:linodeId/volumes", (req, res) => {});


*/

// ===== not implemented =====

// Linode Rebuild
router.post("/:linodeId/rebuild", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// IP Address Update
router.put("/:linodeId/ips/:address", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Firewalls List
router.get("/:linodeId/firewalls", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Networking Information List
router.get("/:linodeId/ips", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Backups List
router.get("/:linodeId/backups", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Snapshot Create
router.post("/:linodeId/backups", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Backups Cancel
router.post("/:linodeId/backups/cancel", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Backups Enable
router.post("/:linodeId/backups/enable", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Backup View
router.get("/:linodeId/backups/:backupId", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Backup Restore
router.post("/:linodeId/backups/:backupId/restore", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Linode Clone
router.post("/:linodeId/clone", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// IPv4 Address Allocate
router.post("/:linodeId/ips", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// IPv4 Address Delete
router.delete("/:linodeId/ips/:address", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// DC Migration/Pending Host Migration Initiate
router.post("/:linodeId/migrate", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Linode Boot Into Rescue Mode
router.post("/:linodeId/rescue", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Linode Statistics View
router.get("/:linodeId/stats", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Statistics View (year/month)
router.get("/:linodeId/stats/:year/:month", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Linode Statistics View
router.get("/:linodeId/transfer", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

// Statistics View (year/month)
router.get("/:linodeId/transfer/:year/:month", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

export default router;
