# Guía de Despliegue - GitHub, Vercel y Railway

## ✅ Git Local Configurado

El repositorio local está listo. Ahora necesitamos:

1. Crear repositorio en GitHub (público)
2. Conectar y hacer push
3. Configurar Vercel (Frontend)
4. Configurar Railway (Backend + PostgreSQL)

---

## 📦 Paso 1: Crear Repositorio en GitHub

### Opción A: Usando GitHub CLI (si lo tienes instalado)

```bash
gh repo create barrios --public --source=. --remote=origin --push
```

### Opción B: Manualmente desde GitHub Web

1. Ve a https://github.com/new
2. Nombre del repositorio: `barrios` (o el que prefieras)
3. **IMPORTANTE: Selecciona "Public"** (repositorio público)
4. **NO** marques "Initialize with README" (ya tenemos código)
5. Click en "Create repository"
6. Copia la URL del repositorio (ej: `https://github.com/tu-usuario/barrios.git`)

### Luego conecta y haz push:

```bash
git remote add origin https://github.com/tu-usuario/barrios.git
git push -u origin main
```

---

## 🚀 Paso 2: Configurar Vercel (Frontend)

### 2.1 Crear Proyecto en Vercel

1. Ve a https://vercel.com y inicia sesión
2. Click en "Add New..." → "Project"
3. Importa el repositorio `barrios` de GitHub
4. Configuración:
   - **Framework Preset:** Next.js (auto-detectado)
   - **Root Directory:** `frontend`
   - **Build Command:** `cd frontend && pnpm install && pnpm build` (o dejar default)
   - **Output Directory:** `.next` (default)

### 2.2 Variables de Entorno en Vercel

En la configuración del proyecto, agrega:

```
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
```

(Reemplaza con la URL de tu backend en Railway, la obtendrás después)

### 2.3 Deploy

- Click en "Deploy"
- Vercel construirá y desplegará automáticamente
- Obtendrás una URL como: `https://barrios.vercel.app`

---

## 🚂 Paso 3: Configurar Railway (Backend + PostgreSQL)

### 3.1 Crear Proyecto en Railway

1. Ve a https://railway.app y inicia sesión
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Conecta tu cuenta de GitHub si es necesario
5. Selecciona el repositorio `barrios`

### 3.2 Configurar PostgreSQL

1. En el proyecto de Railway, click en "+ New"
2. Selecciona "Database" → "Add PostgreSQL"
3. Railway creará automáticamente la base de datos
4. Copia la **DATABASE_URL** de las variables de entorno

### 3.3 Configurar Backend Service

1. En el proyecto, click en "+ New" → "GitHub Repo"
2. Selecciona el mismo repositorio `barrios`
3. Railway detectará que es un proyecto Node.js
4. Configuración:
   - **Root Directory:** `backend`
   - **Build Command:** `cd backend && pnpm install && pnpm prisma generate && pnpm build`
   - **Start Command:** `cd backend && pnpm start`
   - **Watch Paths:** `backend/**`

### 3.4 Variables de Entorno en Railway

En la configuración del servicio backend, agrega:

```env
# Database (copiar de PostgreSQL service)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT
JWT_SECRET=tu-secret-super-seguro-aqui-genera-uno-aleatorio

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tu-frontend.vercel.app

# Email (configurar después)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=tu-email@gmail.com
EMAIL_SMTP_PASS=tu-password-app
EMAIL_FROM=noreply@barrios.com

# WhatsApp (configurar después)
WHATSAPP_API_KEY=
WHATSAPP_API_URL=
WHATSAPP_WEBHOOK_SECRET=

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads
```

### 3.5 Generar JWT Secret

```bash
# En tu terminal local
openssl rand -base64 32
```

Copia el resultado y úsalo como `JWT_SECRET`

### 3.6 Ejecutar Migraciones

1. En Railway, ve al servicio backend
2. Click en "Deployments" → selecciona el último deployment
3. Click en "View Logs"
4. Abre una terminal en Railway (o usa Railway CLI):

```bash
railway run --service backend pnpm prisma migrate deploy
```

O desde la terminal de Railway:
- Click en el servicio backend
- Click en "Settings" → "Deploy" → "Generate Domain"
- Usa Railway CLI para ejecutar migraciones

### 3.7 Obtener URL del Backend

1. En Railway, ve al servicio backend
2. Click en "Settings" → "Networking"
3. Click en "Generate Domain" (si no está generado)
4. Copia la URL (ej: `https://barrios-production.up.railway.app`)

### 3.8 Actualizar Frontend con URL del Backend

1. Ve a Vercel
2. Edita las variables de entorno del proyecto
3. Actualiza `NEXT_PUBLIC_API_URL` con la URL de Railway
4. Haz un nuevo deploy (o se actualizará automáticamente)

---

## 🔄 Paso 4: Configurar Deploy Automático

### Vercel
- ✅ Ya está configurado automáticamente
- Cada push a `main` desplegará automáticamente

### Railway
- ✅ Ya está configurado automáticamente
- Cada push a `main` desplegará automáticamente

---

## ✅ Verificación Final

### Frontend (Vercel)
- [ ] Accesible en la URL de Vercel
- [ ] Muestra la página de login
- [ ] Puede conectarse al backend

### Backend (Railway)
- [ ] Health check funciona: `https://tu-backend.railway.app/health`
- [ ] Responde con `{"status":"ok",...}`
- [ ] Base de datos conectada

### Base de Datos
- [ ] Migraciones ejecutadas
- [ ] Tablas creadas correctamente

---

## 🐛 Troubleshooting

### Backend no responde
- Verifica que el servicio esté "Active" en Railway
- Revisa los logs en Railway
- Verifica variables de entorno

### Frontend no conecta con backend
- Verifica `NEXT_PUBLIC_API_URL` en Vercel
- Verifica CORS en backend (debe incluir URL de Vercel)
- Revisa la consola del navegador

### Error de base de datos
- Verifica `DATABASE_URL` en Railway
- Ejecuta migraciones: `pnpm prisma migrate deploy`
- Verifica que PostgreSQL esté activo

---

## 📝 Notas Importantes

1. **Repositorio Público:** Asegúrate de que el repo en GitHub sea público
2. **Variables Sensibles:** Nunca commitees `.env` files
3. **JWT Secret:** Debe ser único y seguro en producción
4. **CORS:** El backend debe permitir el origen de Vercel
5. **Migraciones:** Ejecutar siempre después del primer deploy

---

## 🎯 Próximos Pasos

Una vez desplegado:
1. Crear usuario administrador inicial
2. Configurar email SMTP
3. Configurar WhatsApp (si aplica)
4. Cargar datos de prueba
5. Testing en producción
