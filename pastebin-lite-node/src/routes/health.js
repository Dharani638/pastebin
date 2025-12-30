const express = require("express");
const redis = require("../redis");
const router = express.Router();

router.get("/healthz", async (_, res) => {
  try {
    await redis.ping();
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

module.exports = router;