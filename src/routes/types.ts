import express from "express";

import types from "../data/types.json";

const router = express.Router();

// ===== Linode Types API =====
// /v4/linode/types

// Types List
router.get("/", (req, res) => {
  res.send(types);
});

// Type View
router.get("/:typeId", (req, res) => {
  let typeData = types.data.filter((type) => type.id == req.params.typeId);
  if (typeData.length) {
    res.send(typeData);
  } else {
    res.status(404).json({ errors: [{ reason: "Not found" }] });
  }
});

export default router;
