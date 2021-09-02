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
router.post("/", (req, res) => {});

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
