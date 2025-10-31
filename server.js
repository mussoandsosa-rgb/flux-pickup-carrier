// server.js — SOLO RETIRO, SOLO TAG, STORE_ID variable + CORS
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors()); // ← IMPRESCINDIBLE para fetch desde el checkout

// ENV
const ENV_STORE_ID = process.env.STORE_ID;         // fallback
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;     // token de la tienda (debe corresponder al store_id que uses)
const USER_AGENT = process.env.USER_AGENT || "Flux Pickup Carrier (tucorreo@dominio.com)";
const PORT = process.env.PORT || 3000;

// Sucursales (tag → label)
const BRANCHES = [
  { tag: "madryn", name: "Retiro en Puerto Madryn" },
  { tag: "rawson", name: "Retiro en Rawson" },
  { tag: "trelew", name: "Retiro en Trelew" },
  { tag: "gaiman", name: "Retiro en Gaiman" }
];

// Helper: obtener tags del PRODUCTO para un store_id dado
async function getProductTags(storeId, productId) {
  const url = `https://api.tiendanube.com/v1/${storeId}/products/${productId}`;
  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "User-Agent": USER_AGENT,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) {
    console.error(`getProductTags(${storeId}, ${productId}) -> ${res.status} ${await res.text()}`);
    return [];
  }
  const product = await res.json();
  return Array.isArray(product.tags) ? product.tags.map(t => String(t).toLowerCase().trim()) : [];
}

// /rates — decide por TAG (una sola sucursal) y SOLO retiro
app.post("/rates", async (req, res) => {
  try {
    const storeId = String(req.body?.store_id || ENV_STORE_ID || "").trim();
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!storeId) return res.json({ rates: [] });
    if (items.length === 0) return res.json({ rates: [] });

    // Recolectar tags por item
    const tagSets = await Promise.all(items.map(i => getProductTags(storeId, i.product_id)));
    const all = new Set(tagSets.flat());

    const hit = BRANCHES.filter(b => all.has(b.tag));
    if (hit.length !== 1) {
      // Si no es una única sucursal clara (o no hay tag), no mostramos nada (política estricta)
      return res.json({ rates: [] });
    }

    const only = hit[0];
    const rate = {
      name: only.name,
      type: "pickup",
      price: 0,
      currency: "ARS",
      // opcionales:
      min_delivery_time: 0,
      max_delivery_time: 0
    };
    return res.json({ rates: [rate] });
  } catch (e) {
    console.error("rates error:", e);
    return res.json({ rates: [] });
  }
});

// health
app.get("/", (_, res) => res.send("OK"));
app.listen(PORT, () => console.log(`Carrier running on :${PORT}`));
