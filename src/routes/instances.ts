import path from "path";

import express from "express";

import types from "../data/types.json";
import regions from "../data/regions.json";
import disks from "./instances/disks";
import configs from "./instances/configs";
import { virtualbox, default_machine_folder } from "../setup/virtualbox";
import { db } from "../setup/sqlite3_db";

const router = express.Router();

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
    path.join(default_machine_folder, "ubuntu_server_template.ova"),
    { vmname: label, cpus: typeData[0].vcpus, memory: typeData[0].memory }, // there aren't error checks when creating invalid machines or starting them :( might not be necessary
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
      // like ip until it's up, can set those later
      virtualbox.start(label, (err: Error) => {
        if (err) {
          return res.status(500).json({ errors: [{ reason: err }] });
        }
        // Retry getting the IP, will only work when machine is fully up.
        (function retry_loop() {
          setTimeout(() => {
            virtualbox.guestproperty.get(
              { vm: label, key: "/VirtualBox/GuestInfo/Net/0/V4/IP" },
              (ipv4_address: string) => {
                if (ipv4_address) {
                  virtualbox.vboxmanage(
                    ["showvminfo", "--machinereadable", label],
                    (err: Error, stdout: string) => {
                      // get disk filename from kv output of showvminfo
                      let disk_uuid, disk_filename;
                      stdout.split("\n").forEach((line) => {
                        let kv_arr = line.split("=");
                        if (kv_arr[0].includes("UUID")) {
                          disk_uuid = kv_arr[1].trim().replace(/['"]+/g, "");
                        }
                        if (kv_arr[0].includes("SATA-0-0")) {
                          disk_filename = kv_arr[1]
                            .trim()
                            .replace(/['"]+/g, "");
                        }
                      });
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
                        id: label,
                        image: "linode/ubuntu20.04",
                        ipv4: ipv4_address,
                        ipv6: "",
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
                      let default_disk_json = {
                        created: datetime,
                        filesystem_path: disk_filename,
                        filesystem: "ext4",
                        id: disk_uuid,
                        label: "default",
                        size: typeData[0].disk,
                        status: "ready",
                        updated: datetime,
                      };
                      let default_config_json = {
                        comments:
                          "This is the default config for this instance.",
                        devices: {
                          sda: {
                            disk_id: label,
                            volume_id: null,
                          },
                          sdb: {
                            disk_id: null,
                            volume_id: null,
                          },
                          sdc: {
                            disk_id: null,
                            volume_id: null,
                          },
                          sdd: {
                            disk_id: null,
                            volume_id: null,
                          },
                          sde: {
                            disk_id: null,
                            volume_id: null,
                          },
                          sdf: {
                            disk_id: null,
                            volume_id: null,
                          },
                          sdg: {
                            disk_id: null,
                            volume_id: null,
                          },
                          sdh: {
                            disk_id: null,
                            volume_id: null,
                          },
                        },
                        helpers: {
                          devtmpfs_automount: false,
                          distro: false,
                          modules_dep: false,
                          network: true,
                          updatedb_disabled: true,
                        },
                        id: label,
                        interfaces: [], // An empty interfaces array results in a default public interface configuration only.
                        kernel: "linode/latest-64bit",
                        label: "default",
                        memory_limit: typeData[0].memory,
                        root_device: "/dev/sda",
                        run_level: "default",
                        virt_mode: "paravirt",
                      };
                      db.run(
                        `INSERT INTO instances ( id,data,disks,configs ) VALUES ('${label}','${JSON.stringify(
                          res_json
                        )}','[${JSON.stringify(
                          default_disk_json
                        )}]','[${JSON.stringify(default_config_json)}]')`
                      );
                      return res.json(res_json);
                    }
                  );
                } else {
                  retry_loop();
                }
              }
            );
          }, 100);
        })();
      });
    }
  );
});

// Gives up any IP addresses the Linode was assigned.
// Deletes all Disks, Backups, Configs, etc.
// Linode Delete
router.delete("/:linodeId", (req, res) => {
  let label = req.params.linodeId;
  db.get(`SELECT data FROM instances WHERE id='${label}'`, (err, row) => {
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
    db.run(`DELETE FROM instances WHERE id='${label}'`, (err) => {
      if (err) {
        return res
          .status(500)
          .json({ errors: [{ field: "linodeId", reason: err }] });
      }
      virtualbox.poweroff(label, (err: Error | null) => {
        virtualbox.vboxmanage(
          ["unregistervm", label, "--delete"],
          (err: Error, stdout: string) => {
            if (err) {
              return res.status(500).json({
                errors: [{ reason: err }],
              });
            } else {
              return res.json({});
            }
          }
        );
      });
    });
  });
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
  virtualbox.start(req.params.linodeId, (err: Error) => {
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

// Linode Shut Down
router.post("/:linodeId/shutdown", (req, res) => {
  virtualbox.stop(req.params.linodeId, (err: Error) => {
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

// Linode Reboot
router.post("/:linodeId/reboot", (req, res) => {
  let label = req.params.linodeId;
  db.get(`SELECT data FROM instances WHERE id='${label}'`, (err, row) => {
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
    virtualbox.reset(label, (err: Error) => {
      if (err) {
        return res
          .status(500)
          .json({ errors: [{ field: "linodeId", reason: err }] });
      }
      // for simplicity, only return once machine is fully booted, check IP to find this state
      setTimeout(() => {
        (function retry_loop() {
          setTimeout(() => {
            virtualbox.guestproperty.get(
              { vm: label, key: "/VirtualBox/GuestInfo/Net/0/V4/IP" },
              (ipv4_address: string) => {
                if (ipv4_address) {
                  return res.json({});
                } else {
                  retry_loop();
                }
              }
            );
          }, 100);
        })();
      }, 100);
    });
  });
});

// IP Address View
router.get("/:linodeId/ips/:address", (req, res) => {
  let label = req.params.linodeId;
  db.get(`SELECT data FROM instances WHERE id='${label}'`, (err, row) => {
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
    virtualbox.guestproperty.get(
      { vm: label, key: "/VirtualBox/GuestInfo/Net/0/V4/Netmask" },
      (netmask: string) => {
        let json_response = {
          address: json_data["ipv4"],
          gateway: "0.0.0.0",
          linode_id: json_data["id"],
          prefix: netmask
            .split(".")
            .reduce((c, o) => c - Math.log2(256 - +o), 32),
          public: true,
          rdns: "",
          region: json_data["region"],
          subnet_mask: netmask,
          type: "ipv4",
        };
        return res.json(json_response);
      }
    );
  });
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

// Linode's Volumes List
router.get("/:linodeId/volumes", (req, res) => {});

// Linode Root Password Reset
router.post("/:linodeId/password", (req, res) => {});

// ===== not implemented =====

// Linode Clone
router.post("/:linodeId/clone", (req, res) => {
  return res.status(501).json({ errors: [{ reason: "Not implemented." }] });
});

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
