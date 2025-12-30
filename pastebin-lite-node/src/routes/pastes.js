const express = require("express");
const { nanoid } = require("nanoid");
const escapeHtml = require("escape-html");
const redis = require("../redis");
const now = require("../utils/time");

const router = express.Router();

router.post("/pastes", async (req, res) => {
  const { content, ttl_seconds, max_views } = req.body;
  if (!content || typeof content !== "string") return res.status(400).json({ error: "Invalid content" });

  const id = nanoid(8);
  const created = Date.now();

  await redis.set(`paste:${id}`, JSON.stringify({
    content,
    created_at: created,
    expires_at: ttl_seconds ? created + ttl_seconds * 1000 : null,
    max_views: max_views ?? null,
    views: 0
  }));

  res.json({ id, url: `${process.env.BASE_URL}/p/${id}` });
});

router.get("/pastes/:id", async (req, res) => {
  const key = `paste:${req.params.id}`;
  const raw = await redis.get(key);
  if (!raw) return res.status(404).json({ error: "Not found" });

  const p = JSON.parse(raw);
  const t = now(req);

  if (p.expires_at && t >= p.expires_at) {
    await redis.del(key);
    return res.status(404).json({ error: "Expired" });
  }

  if (p.max_views !== null && p.views >= p.max_views) {
    return res.status(404).json({ error: "View limit exceeded" });
  }

  p.views++;
  await redis.set(key, JSON.stringify(p));

  res.json({
    content: p.content,
    remaining_views: p.max_views ? p.max_views - p.views : null,
    expires_at: p.expires_at ? new Date(p.expires_at).toISOString() : null
  });
});

router.get("/p/:id", async (req, res) => {
  const raw = await redis.get(`paste:${req.params.id}`);
  if (!raw) return res.status(404).send("Not Found");
  res.send(`<pre>${escapeHtml(JSON.parse(raw).content)}</pre>`);
});

module.exports = router;