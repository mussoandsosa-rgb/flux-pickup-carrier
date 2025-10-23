// server.js
// Flux Pickup Carrier — Backend /rates con 4 sucursales
// Puerto Madryn, Trelew, Rawson y Gaiman

import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Variables de entorno
const STORE_ID = process.env.STORE_ID;           // ej: "1234567" (DEMO primero)
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;   // token OAuth/privado de la tienda DEMO
const USER_AGENT = process.env.USER_AGENT || "Flux Pickup Carrier (tucorreo@dominio.com)";
const PORT = process.env.PORT || 3000;

// Helper: obtener tags de un producto
async function getProductTags(productId) {
  const url = `https://api.tiendanube.com/v1/${STORE_ID}/products/${productId}`;
  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "User-Agent": USER_AGENT,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) {
    console.error(`getProductTags(${productId}) -> ${res.status} ${await res.text()}`);
    return [];
  }
  const product = await res.json();
  return Array.isArray(product.tags)
    ? product.tags.map(t => String(t).toLowerCase().trim())
    : [];
}

// Endpoint /rates — devuelve opciones de retiro según tags de productos del carrito
app.post("/rates", async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    // Si no hay items, devolver vacío
    if (items.length === 0) {
      return res.json({ rates: [] });
    }

    // Obtener tags de todos los productos
    const tagSets = await Promise.all(items.map(i => getProductTags(i.product_id)));
    const all = new Set(tagSets.flat());

    const hasMadryn = all.has("madryn");
    const hasTrelew = all.has("trelew");
    const hasRawson = all.has("rawson");
    const hasGaiman = all.has("gaiman");

    const count = [hasMadryn, hasTrelew, hasRawson, hasGaiman].filter(Boolean).length;
    const rates = [];

    if (count === 1) {
      if (hasMadryn) {
        rates.push({ name: "Retiro en Puerto Madryn", currency: "ARS", price: 0, type: "pickup", min_delivery_time: 0, max_delivery_time: 0 });
      }
      if (hasTrelew) {
        rates.push({ name: "Retiro en Trelew", currency: "ARS", price: 0, type: "pickup", min_delivery_time: 0, max_delivery_time: 0 });
      }
      if (hasRawson) {
        rates.push({ name: "Retiro en Rawson", currency: "ARS", price: 0, type: "pickup", min_delivery_time: 0, max_delivery_time: 0 });
      }
      if (hasGaiman) {
        rates.push({ name: "Retiro en Gaiman", currency: "ARS", price: 0, type: "pickup", min_delivery_time: 0, max_delivery_time: 0 });
      }
    } else if (count > 1) {
      // Carrito con productos de distintas sucursales — política default
      rates.push({
        name: "Carrito mixto (productos de distintas sucursales)",
        currency: "ARS",
        price: 0,
        type: "pickup",
        min_delivery_time: 0,
        max_delivery_time: 0
      });
    }

    return res.json({ rates });
  } catch (e) {
    console.error("rates error:", e);
    return res.json({ rates: [] });
  }
});

// Healthcheck
app.get("/", (_, res) => res.send("OK"));

// Start
app.listen(PORT, () => console.log(`Carrier running on :${PORT}`));
