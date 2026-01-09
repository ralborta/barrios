# 🚂 Setup Completo de Railway - Paso a Paso

## Paso 1: Autenticación

Si no estás autenticado:

```bash
railway login
```

Esto abrirá el navegador para autenticarte.

---

## Paso 2: Crear Proyecto

### Opción A: Desde la Web (Recomendado - Más Fácil)

1. Ve a: **https://railway.app/new**
2. Inicia sesión con GitHub
3. Click en **"New Project"**
4. Selecciona **"Deploy from GitHub repo"**
5. Autoriza Railway si es necesario
6. Selecciona el repositorio: **`ralborta/barrios`**
7. Railway creará el proyecto automáticamente

### Opción B: Desde CLI

```bash
cd /Users/ralborta/barrios
railway init
# Selecciona: "Empty Project"
# Nombre: barrios (o el que prefieras)
```

---

## Paso 3: Agregar PostgreSQL

### Desde la Web:
1. En tu proyecto, click en **"+ New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará automáticamente la base de datos

### Desde CLI:
```bash
railway add postgresql
```

---

## Paso 4: Crear Servicio Backend

### Desde la Web:
1. En el proyecto, click en **"+ New"** → **"GitHub Repo"**
2. Selecciona el mismo repositorio: **`ralborta/barrios`**
3. Railway detectará que es Node.js

### Desde CLI:
```bash
railway service
# Si pregunta, selecciona "Create New Service"
railway link
```

---

## Paso 5: Configurar Root Directory y Build

### Desde Railway Dashboard:

1. Click en el servicio backend
2. **Settings** → **Root Directory:** `backend`
3. **Build Command:** `pnpm install && pnpm prisma generate && pnpm build`
4. **Start Command:** `pnpm start`
5. Guarda cambios

---

## Paso 6: Variables de Entorno

### Generar JWT Secret:

```bash
openssl rand -base64 32
```

Copia el resultado.

### Configurar en Railway:

#### Desde la Web:
1. Click en el servicio backend
2. **Variables** tab
3. Agrega estas variables:

```env
# Database (se configura automáticamente desde PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT (usa el que generaste)
JWT_SECRET=TU_SECRET_AQUI

# Server
PORT=3001
NODE_ENV=production

# Frontend URL (actualizarás después con la URL de Vercel)
FRONTEND_URL=https://tu-frontend.vercel.app

# Email (opcional por ahora)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_FROM=noreply@barrios.com

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads
```

#### Desde CLI:
```bash
# Generar JWT Secret primero
openssl rand -base64 32

# Luego configurar variables
railway variables set JWT_SECRET=TU_SECRET_GENERADO
railway variables set PORT=3001
railway variables set NODE_ENV=production
railway variables set FRONTEND_URL=https://tu-frontend.vercel.app
railway variables set STORAGE_TYPE=local
railway variables set STORAGE_PATH=./uploads
```

**Nota:** `DATABASE_URL` se configura automáticamente cuando agregas PostgreSQL.

---

## Paso 7: Generar Dominio Público

### Desde la Web:
1. Click en el servicio backend
2. **Settings** → **Networking**
3. Click en **"Generate Domain"**
4. **Copia la URL** (ej: `https://barrios-production.up.railway.app`)

### Desde CLI:
```bash
railway domain
```

---

## Paso 8: Ejecutar Migraciones

### Opción 1: Desde Railway Dashboard
1. Click en el servicio backend
2. **Deployments** → último deployment
3. Click en **"View Logs"**
4. Usa el terminal integrado

### Opción 2: Desde CLI
```bash
railway run --service backend pnpm prisma migrate deploy
```

### Opción 3: Desde Railway Dashboard Terminal
1. Click en el servicio backend
2. **Deployments** → **View Logs**
3. Abre terminal
4. Ejecuta: `pnpm prisma migrate deploy`

---

## Paso 9: Ejecutar Seed (Crear Usuarios)

```bash
railway run --service backend pnpm prisma:seed
```

O desde el terminal de Railway Dashboard:
```bash
pnpm prisma:seed
```

Esto creará:
- `admin@barrios.com` / `admin123`
- `operador@barrios.com` / `operador123`

---

## Paso 10: Verificar

### Health Check:
```bash
curl https://tu-backend.railway.app/health
```

Debería responder: `{"status":"ok",...}`

---

## Paso 11: Actualizar Frontend en Vercel

1. Ve a Vercel Dashboard
2. Tu proyecto → **Settings** → **Environment Variables**
3. Actualiza `NEXT_PUBLIC_API_URL` con la URL de Railway
4. **Redeploy**

---

## ✅ Checklist Final

- [ ] Proyecto creado en Railway
- [ ] PostgreSQL agregado
- [ ] Servicio backend creado
- [ ] Root Directory: `backend`
- [ ] Variables de entorno configuradas
- [ ] Dominio público generado
- [ ] Migraciones ejecutadas
- [ ] Seed ejecutado (usuarios creados)
- [ ] Health check funciona
- [ ] Frontend actualizado con URL de Railway

---

## 🔗 URLs Importantes

- **Railway Dashboard:** https://railway.app/dashboard
- **Repositorio:** https://github.com/ralborta/barrios

---

## 🆘 Troubleshooting

### Error: "Unauthorized"
```bash
railway login
```

### Error: "No service found"
```bash
railway service
railway link
```

### Error de build
- Verifica Root Directory: `backend`
- Verifica Build Command
- Revisa logs en Railway Dashboard

### Error de base de datos
- Verifica que PostgreSQL esté activo
- Verifica DATABASE_URL en variables
- Ejecuta migraciones
