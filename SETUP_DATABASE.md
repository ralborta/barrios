# 🗄️ Setup Completo de Base de Datos

## 📋 Pasos para Configurar la Base de Datos

### Paso 1: Crear Base de Datos en Railway

1. **Railway Dashboard** → **New** → **Database** → **Add PostgreSQL**
2. Espera a que se cree (puede tardar 1-2 minutos)
3. Anota el nombre del servicio (ej: "Postgres" o "barrios-db")

---

### Paso 2: Obtener DATABASE_URL

1. En el servicio **Postgres** que acabas de crear
2. Ve a la pestaña **Variables**
3. Busca `DATABASE_URL` o `POSTGRES_URL`
4. **Copia el valor completo** (algo como: `postgresql://postgres:password@host:port/railway`)

---

### Paso 3: Configurar DATABASE_URL en el Backend

1. En Railway → Tu servicio **backend**
2. Ve a **Variables**
3. Agrega nueva variable:
   - **Nombre:** `DATABASE_URL`
   - **Valor:** (pega el DATABASE_URL que copiaste del Postgres)

**O si Railway te permite referenciar variables del plugin:**
- Railway puede tener una opción para "Reference" variables del plugin Postgres
- Si es así, úsala en lugar de copiar el valor

---

### Paso 4: Crear Migración Inicial (Localmente)

**IMPORTANTE:** Necesitas tener `DATABASE_URL` configurado localmente primero.

1. Crea un archivo `.env` en `/backend/`:
```bash
cd backend
cp env.example .env
```

2. Edita `.env` y agrega tu `DATABASE_URL` de Railway (o usa una DB local para desarrollo)

3. Genera Prisma Client:
```bash
pnpm prisma:generate
```

4. Crea la primera migración:
```bash
pnpm prisma:migrate dev --name init
```

Esto creará la carpeta `prisma/migrations/` con todas las tablas.

---

### Paso 5: Aplicar Migraciones en Railway

**Opción A: Desde Railway CLI (Recomendado)**

```bash
# Conecta Railway CLI
railway link

# Ejecuta migraciones en el servicio backend
railway run --service backend pnpm prisma:migrate deploy
```

**Opción B: Desde Railway Dashboard**

1. Railway → Tu servicio **backend**
2. **Settings** → **Deploy** → **Deploy Command**
3. Agrega antes del `start`:
   ```
   pnpm prisma:generate && pnpm prisma:migrate deploy && pnpm start
   ```
4. O crea un script en `package.json`:
   ```json
   "deploy": "prisma generate && prisma migrate deploy && node dist/index.js"
   ```

**Opción C: Manualmente desde Railway Shell**

1. Railway → Tu servicio **backend**
2. **Settings** → **Shell**
3. Ejecuta:
   ```bash
   pnpm prisma:generate
   pnpm prisma:migrate deploy
   ```

---

### Paso 6: Ejecutar Seed (Crear Usuarios)

**Opción A: Desde Railway CLI**

```bash
railway run --service backend pnpm prisma:seed
```

**Opción B: Desde Railway Shell**

1. Railway → Tu servicio **backend** → **Settings** → **Shell**
2. Ejecuta:
   ```bash
   pnpm prisma:seed
   ```

**Opción C: Agregar al Deploy Command**

Modifica el deploy command para incluir seed (solo la primera vez):
```
pnpm prisma:generate && pnpm prisma:migrate deploy && pnpm prisma:seed && pnpm start
```

---

## ✅ Verificación

Después de completar todos los pasos:

1. **Health Check:**
   ```bash
   curl https://barrios-production.up.railway.app/health
   ```
   Debe devolver: `{"status":"ok",...}`

2. **Login:**
   ```bash
   curl -X POST https://barrios-production.up.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@barrios.com","password":"admin123"}'
   ```
   Debe devolver: `{"success":true,"token":"...","user":{...}}`

---

## 🔧 Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"
- Verifica que agregaste `DATABASE_URL` en las Variables del servicio backend
- Verifica que el valor es correcto (debe empezar con `postgresql://`)

### Error: "Migration failed"
- Verifica que Prisma Client está generado: `pnpm prisma:generate`
- Verifica que la base de datos está accesible desde Railway
- Revisa los logs de Railway para ver el error específico

### Error: "Table already exists"
- Las migraciones ya fueron aplicadas
- Puedes saltarte el paso de migraciones y solo ejecutar el seed

---

## 📝 Notas

- **No ejecutes migraciones en producción** sin hacer backup primero
- El seed es idempotente (puedes ejecutarlo múltiples veces sin problemas)
- Si cambias el schema, crea nuevas migraciones con `pnpm prisma:migrate dev`
