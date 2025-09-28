# Restaurante · Órdenes (Node + Express + PostgreSQL + Frontend puro)

Cumple con el enunciado:
- **Backend en Node.js + Express** con endpoints:
  - `POST /clientes/registrar`
  - `POST /clientes/login`
  - `POST /ordenes`
  - `GET  /ordenes/:clienteId`
  - `PATCH /ordenes/:id/estado` (created → preparing → delivered)
- **Base de datos PostgreSQL** (script en `schema.sql`).
- **Frontend HTML/CSS/JS puro** servido por Express (carpeta `public/`).
- Deploy listo para **Render**.

---

## 1) Correr en local (opcional)

1. Crea una base de datos en tu PostgreSQL local y exporta `DATABASE_URL`, por ejemplo:  
   ```bash
   export DATABASE_URL="postgresql://postgres:tu_pass@localhost:5432/restaurante_ordenes_db"
   ```
2. Ejecuta el script SQL:
   ```bash
   psql "$DATABASE_URL" -f schema.sql
   ```
3. Instala y corre:
   ```bash
   npm install
   npm start
   ```
4. Abre `http://localhost:3000`

---

## 2) Deploy paso a paso en Render (todo desde cero)

> Con humor pero sin drama: 10 minutos de clics y a comer 🍔

### A. Subir el código a GitHub
1. Crea un repo en GitHub (privado o público).
2. Sube **toda** esta carpeta (incluyendo `package.json`, `index.js`, `public/`, `schema.sql`).

### B. Crear la base de datos PostgreSQL en Render
1. En Render: **New → PostgreSQL**.
2. Nómbrala: `restaurante_ordenes_db` (o como quieras).
3. Espera a que esté **Available**.
4. En la página de la DB, copia el **External Database URL** (es un `postgresql://...` con usuario/clave/host).
5. Importa el esquema:
   - **Opción 1 (recomendada)**: desde tu PC con `psql` instalado:  
     ```bash
     psql "PEGAR_AQUI_EL_EXTERNAL_DATABASE_URL" -f schema.sql
     ```
   - **Opción 2**: abre una sesión `psql` (desde tu terminal) con el URL externo, pega el contenido de `schema.sql` y ejecútalo.

### C. Crear el servicio web (backend + frontend) en Render
1. En Render: **New → Web Service**.
2. Conecta tu GitHub y selecciona el repo.
3. **Root Directory**: `/` (la raíz del proyecto).
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. **Environment**: Node.
7. Variables de entorno (**Environment** → **Add Environment Variable**):
   - `DATABASE_URL`: pega el **External Database URL** de tu DB.
   - No definas `PORT` (Render la inyecta).
8. Deploy.

> El servidor detecta automáticamente SSL si el URL contiene `render.com` o `sslmode=require`.

### D. Probar
- Abre el dominio `onrender.com` que te da el servicio.
- Revisa `GET /health` → debe responder `{ ok: true }`.
- Abre la raíz `/` para usar la interfaz web.

---

## 3) Uso rápido de los endpoints (cURL)

**Registrar cliente**
```bash
curl -s -X POST $URL/clientes/registrar   -H "Content-Type: application/json"   -d '{"nombre":"Damian","email":"damian@example.com","telefono":"555-1234"}'
```

**Login (email + teléfono)**
```bash
curl -s -X POST $URL/clientes/login   -H "Content-Type: application/json"   -d '{"email":"damian@example.com","telefono":"555-1234"}'
```

**Crear orden**
```bash
curl -s -X POST $URL/ordenes   -H "Content-Type: application/json"   -d '{"cliente_id":1,"plato":"Tacos","extras":"sin cebolla"}'
```

**Listar órdenes de un cliente**
```bash
curl -s $URL/ordenes/1
```

**Avanzar estado**
```bash
curl -s -X PATCH $URL/ordenes/1/estado
```

---

## 4) Notas técnicas

- El servidor crea las tablas si no existen al iniciar **(idempotente)**, pero **debes** correr `schema.sql` al provisionar la DB por primera vez.
- El flujo de estado es: `created → preparing → delivered`. Si ya está en `delivered`, permanece ahí.
- `index.js` sirve la carpeta `public/`, así que el frontend y backend viven en el mismo servicio Render.
- Node 20+ (especificado en `package.json`).
- CORS está habilitado por si quieres separar el frontend en otro lado.

¡Listo! Subes, das clic y… **deploy exitoso**. Si se cae, yo no fui, fue el `sslmode` 😅.
