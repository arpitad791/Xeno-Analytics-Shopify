// Shopify webhook receiver + per-tenant event feed for the dashboard.
//
// Flow:
//   Shopify  --POST /api/webhooks/shopify-->  verify HMAC -> find tenant by shop domain
//            -> sync that resource into the DB (in the background)
//            -> queue a lightweight event for that tenant only
//   Dashboard --GET /api/webhooks/check (JWT)-->  receives only its own tenant's events
//
// Requires env SHOPIFY_WEBHOOK_SECRET: the signing key shown under
// Shopify admin -> Settings -> Notifications -> Webhooks (or the app's client secret
// if the webhooks are registered through an app).

const express = require("express");
const crypto = require("crypto");

const MAX_EVENTS_PER_TENANT = 50;

function normalizeDomain(domain) {
  return String(domain || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

function isValidHmac(rawBody, hmacHeader, secret) {
  if (!hmacHeader || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(hmacHeader), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function resourceFromTopic(topic) {
  const t = String(topic || "").toLowerCase();
  if (t.startsWith("orders/")) return "orders";
  if (t.startsWith("products/")) return "products";
  if (t.startsWith("customers/")) return "customers";
  return null;
}

/**
 * @param {object} deps
 * @param {import('@prisma/client').PrismaClient} deps.prisma
 * @param {object} deps.shopifyService  needs syncOrders/syncProducts/syncCustomers(tenantId)
 * @param {Function} deps.authenticateToken  JWT middleware that sets req.user.tenantId
 * @param {Function} [deps.onDataChanged]  called after a successful sync (e.g. clear caches)
 */
function createWebhookRouter({
  prisma,
  shopifyService,
  authenticateToken,
  onDataChanged = () => {},
}) {
  const router = express.Router();

  // tenantId -> recent events (each with an increasing `seq`). Events are not removed
  // when read, so several open dashboards for the same tenant all see them.
  const queues = new Map();
  let seq = 0;
  // `${tenantId}:${resource}` -> { running: boolean, again: boolean }
  const syncState = new Map();

  function pushEvent(tenantId, ev) {
    const q = queues.get(tenantId) || [];
    q.push({ ...ev, seq: ++seq });
    if (q.length > MAX_EVENTS_PER_TENANT) q.shift();
    queues.set(tenantId, q);
  }

  // Run at most one sync per tenant+resource at a time. A webhook arriving while a
  // sync is running schedules exactly one follow-up run instead of piling up.
  async function scheduleSync(tenantId, resource, ev) {
    const key = `${tenantId}:${resource}`;
    const state = syncState.get(key) || { running: false, again: false };
    syncState.set(key, state);
    if (state.running) {
      state.again = true;
      return;
    }

    state.running = true;
    try {
      do {
        state.again = false;
        const fn = {
          orders: shopifyService.syncOrders,
          products: shopifyService.syncProducts,
          customers: shopifyService.syncCustomers,
        }[resource];
        await fn.call(shopifyService, tenantId);
        onDataChanged(tenantId);
      } while (state.again);
      pushEvent(tenantId, { ...ev, synced: true, syncedAt: Date.now() });
      console.log(`✅ Webhook sync done: ${resource} for tenant ${tenantId}`);
    } catch (err) {
      console.error(`❌ Webhook sync failed: ${resource} for tenant ${tenantId}:`, err.message);
      pushEvent(tenantId, { ...ev, synced: false, error: "sync_failed" });
    } finally {
      state.running = false;
    }
  }

  // Body arrives as a raw Buffer (express.raw is applied in simple-server.js),
  // which is required to verify Shopify's HMAC signature.
  router.post("/shopify", async (req, res) => {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("❌ Webhook rejected: SHOPIFY_WEBHOOK_SECRET is not set");
      return res.status(401).send("Webhook secret not configured");
    }

    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    if (!isValidHmac(raw, req.get("x-shopify-hmac-sha256"), secret)) {
      console.warn("⚠️ Webhook rejected: invalid HMAC signature");
      return res.status(401).send("Invalid signature");
    }

    const topic = req.get("x-shopify-topic") || "unknown";
    const shopDomain = normalizeDomain(req.get("x-shopify-shop-domain"));
    const resource = resourceFromTopic(topic);

    let body = {};
    try {
      body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
    } catch {
      return res.status(400).send("Invalid JSON");
    }

    // Find the tenant this store belongs to (stored domains may differ in case/protocol).
    let tenant = null;
    try {
      const candidates = await prisma.tenant.findMany({
        where: {
          isActive: true,
          shopDomain: { contains: shopDomain, mode: "insensitive" },
        },
        select: { id: true, shopDomain: true },
      });
      tenant = candidates.find((t) => normalizeDomain(t.shopDomain) === shopDomain) || null;
    } catch (err) {
      console.error("❌ Webhook tenant lookup failed:", err.message);
      return res.status(500).send("Lookup failed");
    }

    // Acknowledge quickly; Shopify retries anything that isn't 2xx within a few seconds.
    res.status(200).send("OK");

    if (!tenant) {
      console.warn(`ℹ️ Webhook for unknown shop ${shopDomain} (${topic}) ignored`);
      return;
    }
    if (!resource) {
      console.log(`ℹ️ Webhook topic ${topic} not handled`);
      return;
    }

    const ev = {
      topic,
      resource,
      shopDomain,
      webhookId: req.get("x-shopify-webhook-id") || null,
      payload: {
        id: body.id ?? null,
        name: body.name ?? body.title ?? body.email ?? null,
      },
      receivedAt: Date.now(),
    };
    console.log("📩 Webhook received:", topic, shopDomain, ev.payload);
    scheduleSync(tenant.id, resource, ev);
  });

  // Dashboard polls this with ?after=<last seq it saw>; it only ever sees its own
  // tenant's events. The first poll (no `after`) just returns the current cursor.
  router.get("/check", authenticateToken, (req, res) => {
    const tenantId = req.user && req.user.tenantId;
    const q = (tenantId && queues.get(tenantId)) || [];
    let after = Number.parseInt(req.query.after, 10);
    if (Number.isFinite(after) && after > seq) after = 0; // server restarted, counter reset
    const events = Number.isFinite(after) ? q.filter((e) => e.seq > after) : [];
    return res.json({ events, cursor: seq });
  });

  return router;
}

module.exports = createWebhookRouter;
module.exports.isValidHmac = isValidHmac;
module.exports.normalizeDomain = normalizeDomain;
