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
  //docker.listContainers({ all: true }).then((a) => console.log(a));
});

// Linode Create
router.post("/", (req, res) => {
  let label: string = req.headers.label
    ? (req.headers.label as string)
    : [...Array(32)].map(() => (~~(Math.random() * 36)).toString(36)).join("");
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
  docker
    .createContainer({
      Image: "ubuntu",
      name: label,
      Tty: false,
    })
    .then((container) => {
      return container.start((err, data) => {
        console.log(err);
        console.log(data);
      });
    })
    .then((data) => {
      return res.send(data);
    });
});

// Linode Delete
router.delete("/:linodeId", (req, res) => {
  //docker.getContainer()
});

// Linode View
router.get("/:linodeId", (req, res) => {});

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
