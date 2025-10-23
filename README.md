# Flux Pickup Carrier (4 sucursales)

Este paquete contiene todo lo necesario para que el checkout de Tiendanube muestre **solo** el punto de retiro correcto según los **tags** de los productos del carrito.

Sucursales soportadas: `madryn`, `trelew`, `rawson`, `gaiman`.

---

## 1) Backend `/rates` (Render / Railway / Vercel)

1. Creá un servicio web y subí **server.js** y **package.json**.
2. Configurá variables de entorno (en Render → *Environment*), usando **.env.example** como referencia:

```
STORE_ID=tu_store_id_demo
ACCESS_TOKEN=tu_access_token_demo
USER_AGENT=Flux Pickup Carrier (tucorreo@dominio.com)
PORT=3000
```

3. Build: `npm install` — Start: `npm start`.
4. Probar `GET /` (debe responder `OK`).
5. URL esperada (podés cambiar el nombre): `https://flux-pickup-carrier.onrender.com`

> El endpoint que usa el checkout es: `POST /rates` con body `{ items: [{ product_id, variant_id, quantity }, ...] }`.

---

## 2) App Externa + App Scripts (Partner Portal)

1. En **Tiendanube Partners** → **Aplicaciones** → *Crear aplicación* → **Aplicación Externa** → *Para tus clientes*.
2. Instalar la app en tu **tienda demo** (Conectar con la API).
3. En la pestaña **Scripts** → **Crear script**:
   - Página/Ámbito: **Checkout**
   - Posición: **End of body**
   - Fuente: **Subir archivo** → `pickup-carrier-checkout.js`
4. Editá dentro del script el valor `CARRIER_ENDPOINT` si tu URL es distinta.

---

## 3) Productos y tags

En la tienda DEMO, asegurate de tener productos con estos **tags**:

- `madryn`
- `trelew`
- `rawson`
- `gaiman`

> En producción, podés sincronizar estos tags automáticamente desde Contabilium mapeando *Depósito → tag*.

---

## 4) Pruebas

- Carrito con productos **solo `madryn`** → debe aparecer **Retiro en Puerto Madryn**.
- **solo `trelew`** → **Retiro en Trelew**.
- **solo `rawson`** → **Retiro en Rawson**.
- **solo `gaiman`** → **Retiro en Gaiman**.
- **Mixto** (`madryn` + `trelew`, etc.) → verás el mensaje “Carrito mixto…” (política editable en `server.js`).

---

## 5) Pasar a producción

1. Instalá la app en tu **tienda real** desde el Partner Portal.
2. Cambiá las variables de entorno del backend a tu tienda real (`STORE_ID`, `ACCESS_TOKEN`, etc.).
3. Asegurate de que Contabilium sincronice los tags correctos según depósito.
4. Activá el **App Script** para la tienda real.

---

## Notas

- El backend sólo **lee** productos para obtener **tags**; no modifica el checkout directamente.
- El **App Script** usa el **Nube SDK** (nuevo checkout) para **reemplazar** las opciones de envío/retito con las devueltas por `/rates`.
