# Setup Rápido - Vercel y Railway

## ✅ Repositorio GitHub Creado

**URL:** https://github.com/ralborta/barrios  
**Estado:** Público ✅  
**Código:** Subido ✅

---

## 🚀 Paso 1: Configurar Vercel (Frontend)

### Opción A: Desde la Web (Recomendado - 5 minutos)

1. **Ve a:** https://vercel.com/new
2. **Inicia sesión** con GitHub
3. **Importa el repositorio:**
   - Busca `ralborta/barrios`
   - Click en "Import"

4. **Configuración del proyecto:**
   - **Framework Preset:** Next.js (auto-detectado)
   - **Root Directory:** `frontend` ⚠️ IMPORTANTE
   - **Build Command:** (dejar default o `cd frontend && pnpm build`)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `cd frontend && pnpm install`

5. **Variables de Entorno:**
   - Agrega: `NEXT_PUBLIC_API_URL`
   - Valor: Lo configurarás después de crear Railway (por ahora déjalo vacío o usa `http://localhost:3001`)

6. **Click en "Deploy"**
7. Espera 2-3 minutos
8. Obtendrás una URL como: `https://barrios-xxx.vercel.app`

### Opción B: Usando Vercel CLI

```bash
cd frontend
npx vercel
# Sigue las instrucciones
# Root Directory: frontend
# Variables de entorno: NEXT_PUBLIC_API_URL (configurar después)
```

---

## 🚂 Paso 2: Configurar Railway (Backend + PostgreSQL)

### Opción A: Desde la Web (Recomendado - 10 minutos)

#### 2.1 Crear Proyecto

1. **Ve a:** https://railway.app/new
2. **Inicia sesión** con GitHub
3. **Click en "New Project"**
4. **Selecciona "Deploy from GitHub repo"**
5. **Autoriza Railway** si es necesario
6. **Selecciona el repositorio:** `ralborta/barrios`

#### 2.2 Agregar PostgreSQL

1. En el proyecto, click en **"+ New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará automáticamente la base de datos
4. **Copia la DATABASE_URL:**
   - Click en el servicio PostgreSQL
   - Click en "Variables"
   - Copia el valor de `DATABASE_URL`

#### 2.3 Configurar Backend Service

1. En el proyecto, click en **"+ New"** → **"GitHub Repo"**
2. Selecciona el mismo repositorio `ralborta/barrios`
3. Railway detectará que es Node.js

4. **Configuración:**
   - Click en el servicio
   - Click en "Settings"
   - **Root Directory:** `backend`
   - **Build Command:** (dejar default o `cd backend && pnpm install && pnpm prisma generate && pnpm build`)
   - **Start Command:** `cd backend && pnpm start`

#### 2.4 Variables de Entorno en Railway

En el servicio backend, click en "Variables" y agrega:

```env
# Database (copiar de PostgreSQL service)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT (generar uno seguro)
JWT_SECRET=TU_SECRET_AQUI_GENERA_CON_openssl_rand_-base64_32

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://TU-FRONTEND.vercel.app

# Email (configurar después)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=
EMAIL_SMTP_PASS=
EMAIL_FROM=noreply@barrios.com

# WhatsApp (configurar después)
WHATSAPP_API_KEY=
WHATSAPP_API_URL=
WHATSAPP_WEBHOOK_SECRET=

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads
```

**Para generar JWT_SECRET:**
```bash
openssl rand -base64 32
```

#### 2.5 Generar Dominio Público

1. En el servicio backend, click en "Settings"
2. Click en "Networking"
3. Click en "Generate Domain"
4. **Copia la URL** (ej: `https://barrios-production.up.railway.app`)

#### 2.6 Ejecutar Migraciones

**Opción 1: Desde Railway Dashboard**
1. Click en el servicio backend
2. Click en "Deployments" → último deployment
3. Click en "View Logs"
4. Usa el terminal integrado o Railway CLI

**Opción 2: Usando Railway CLI**
```bash
railway login
railway link
railway run --service backend pnpm prisma migrate deploy
```

#### 2.7 Actualizar Frontend con URL del Backend

1. Ve a Vercel
2. Edita el proyecto
3. Ve a "Settings" → "Environment Variables"
4. Actualiza `NEXT_PUBLIC_API_URL` con la URL de Railway
5. Click en "Redeploy" o espera el auto-deploy

---

## ✅ Verificación

### Frontend (Vercel)
- [ ] URL accesible
- [ ] Muestra página de login
- [ ] No hay errores en consola

### Backend (Railway)
- [ ] Health check: `https://tu-backend.railway.app/health`
- [ ] Responde: `{"status":"ok",...}`
- [ ] Logs sin errores

### Base de Datos
- [ ] Migraciones ejecutadas
- [ ] Tablas creadas

---

## 🔗 URLs Importantes

- **GitHub:** https://github.com/ralborta/barrios
- **Vercel:** https://vercel.com/dashboard (tu proyecto)
- **Railway:** https://railway.app/dashboard (tu proyecto)

---

## 🆘 Si algo falla

### Backend no responde
- Verifica que el servicio esté "Active"
- Revisa logs en Railway
- Verifica variables de entorno

### Frontend no conecta
- Verifica `NEXT_PUBLIC_API_URL` en Vercel
- Verifica CORS en backend
- Revisa consola del navegador

### Error de base de datos
- Verifica `DATABASE_URL`
- Ejecuta migraciones
- Verifica que PostgreSQL esté activo

---

## 📝 Próximos Pasos

1. ✅ Repositorio creado
2. ⏳ Configurar Vercel
3. ⏳ Configurar Railway
4. ⏳ Ejecutar migraciones
5. ⏳ Crear usuario administrador
6. ⏳ Testing en producción
