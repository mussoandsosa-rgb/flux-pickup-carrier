/**
 * Pickup Carrier – Script de Checkout con Nube SDK (post 30/10)
 * Reemplaza las opciones de retiro según tags de los productos (madryn/trelew/rawson/gaiman).
 */
(function () {
  // Cambiá esta URL por la de tu deploy en Render/Railway/Vercel si es diferente
  const CARRIER_ENDPOINT = "https://flux-pickup-carrier.onrender.com/rates";
  const REQUEST_TIMEOUT_MS = 6000;

  function fetchWithTimeout(url, opts = {}, t = REQUEST_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const id = setTimeout(() => reject(new Error("timeout")), t);
      fetch(url, opts).then(
        (res) => { clearTimeout(id); resolve(res); },
        (err) => { clearTimeout(id); reject(err); }
      );
    });
  }

  function showNotice(msg) {
    try {
      let el = document.querySelector("#pickup-carrier-notice");
      if (!el) {
        el = document.createElement("div");
        el.id = "pickup-carrier-notice";
        el.style.cssText = "margin:8px 0;padding:8px;border-radius:6px;background:#f5f5f7;font-size:14px;line-height:1.35;";
        const container = document.querySelector('[data-checkout-section="shipping"]') || document.body;
        container.prepend(el);
      }
      el.textContent = msg;
    } catch (_) {}
  }

  async function updatePickupOptions(cartItems) {
    try {
      const res = await fetchWithTimeout(CARRIER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems })
      });
      const data = await res.json();
      const rates = Array.isArray(data?.rates) ? data.rates : [];

      const api = window?.NuvemShop?.Checkout;
      if (!api) return;

      if (typeof api.updateShippingOptions === "function") {
        api.updateShippingOptions(rates);
      } else if (typeof api.setShippingOptions === "function") {
        api.setShippingOptions(rates);
      }

      if (rates.length === 1) {
        showNotice(`Mostramos únicamente: “${rates[0].name}”.`);
      } else if (rates.length === 0) {
        showNotice("Carrito con productos de distintas sucursales. Separá la compra por sucursal.");
      } else {
        showNotice("Tenés productos de distintas sucursales. Elegí el retiro correspondiente o separá la compra.");
      }
    } catch (e) {
      console.warn("Pickup Carrier – error:", e);
      showNotice("No pudimos calcular el retiro automáticamente. Probá nuevamente.");
    }
  }

  function ready(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") return fn();
    document.addEventListener("DOMContentLoaded", fn);
  }

  function mount() {
    let tries = 0;
    const iv = setInterval(() => {
      const api = window?.NuvemShop?.Checkout;
      if (api || ++tries > 20) {
        clearInterval(iv);
        if (api) attachHandlers(api);
      }
    }, 200);
  }

  function attachHandlers(Checkout) {
    const pick = (ctx) => {
      const items = (ctx?.cart?.items || []).map(i => ({
        product_id: i.product_id,
        variant_id: i.variant_id,
        quantity: i.quantity
      }));
      updatePickupOptions(items);
    };

    if (typeof Checkout.on === "function") {
      Checkout.on("shipping.update", pick);
      Checkout.on("cart.update", pick);
    } else {
      try {
        const g = Checkout.getState?.();
        pick(g);
      } catch (_) {}
    }
  }

  ready(mount);
})();
