# ✅ Resumen del Setup Completado

## 🎉 Estado Actual

### ✅ Completado

1. **Git Repositorio**
   - ✅ Repositorio inicializado
   - ✅ Código commiteado
   - ✅ Repositorio público creado en GitHub
   - **URL:** https://github.com/ralborta/barrios

2. **Configuración**
   - ✅ Archivos de configuración creados
   - ✅ `.gitignore` configurado
   - ✅ Documentación de deploy creada

---

## 🚀 Próximos Pasos (5-10 minutos)

### 1. Vercel (Frontend) - 5 minutos

**Opción más simple: Desde la Web**

1. Ve a: **https://vercel.com/new**
2. Inicia sesión con GitHub
3. Click en **"Import Git Repository"**
4. Busca y selecciona: **`ralborta/barrios`**
5. **Configuración IMPORTANTE:**
   - **Root Directory:** `frontend` ⚠️
   - **Framework:** Next.js (auto-detectado)
   - **Build Command:** `pnpm install && pnpm build` (o dejar default)
   - **Output Directory:** `.next` (default)

6. **Variables de Entorno:**
   - Agrega: `NEXT_PUBLIC_API_URL`
   - Valor: Lo configurarás después (por ahora déjalo vacío)

7. Click en **"Deploy"**
8. Espera 2-3 minutos
9. **Copia la URL de producción** (ej: `https://barrios-xxx.vercel.app`)

---

### 2. Railway (Backend + PostgreSQL) - 10 minutos

#### Paso 1: Login en Railway

```bash
railway login
```

Esto abrirá el navegador para autenticarte.

#### Paso 2: Crear Proyecto

```bash
cd /Users/ralborta/barrios
railway init
# Selecciona: "Empty Project"
```

#### Paso 3: Agregar PostgreSQL

```bash
railway add postgresql
```

#### Paso 4: Configurar Backend Service

```bash
railway service
# Selecciona el servicio backend o crea uno nuevo
railway link
```

#### Paso 5: Configurar Variables de Entorno

```bash
# Generar JWT Secret
openssl rand -base64 32

# Agregar variables (reemplaza los valores)
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
railway variables set JWT_SECRET=TU_SECRET_GENERADO
railway variables set PORT=3001
railway variables set NODE_ENV=production
railway variables set FRONTEND_URL=https://TU-FRONTEND.vercel.app
```

#### Paso 6: Configurar Root Directory

En Railway Dashboard:
1. Ve al servicio backend
2. Settings → Root Directory: `backend`
3. Build Command: `pnpm install && pnpm prisma generate && pnpm build`
4. Start Command: `pnpm start`

#### Paso 7: Generar Dominio Público

```bash
railway domain
# O desde el dashboard: Settings → Networking → Generate Domain
```

#### Paso 8: Ejecutar Migraciones

```bash
railway run --service backend pnpm prisma migrate deploy
```

#### Paso 9: Deploy

```bash
railway up
```

O simplemente haz push a GitHub y Railway desplegará automáticamente.

---

### 3. Conectar Frontend con Backend

1. **Obtén la URL de Railway:**
   ```bash
   railway domain
   ```

2. **Actualiza Vercel:**
   - Ve a Vercel Dashboard
   - Tu proyecto → Settings → Environment Variables
   - Actualiza `NEXT_PUBLIC_API_URL` con la URL de Railway
   - Click en "Redeploy"

---

## ✅ Verificación Final

### Frontend
- [ ] URL de Vercel accesible
- [ ] Muestra página de login
- [ ] No hay errores en consola

### Backend
- [ ] Health check funciona: `https://tu-backend.railway.app/health`
- [ ] Responde: `{"status":"ok",...}`

### Base de Datos
- [ ] Migraciones ejecutadas
- [ ] Tablas creadas

---

## 🔗 URLs Importantes

- **GitHub:** https://github.com/ralborta/barrios
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Railway Dashboard:** https://railway.app/dashboard

---

## 📝 Comandos Útiles

### Git
```bash
git status
git add .
git commit -m "mensaje"
git push
```

### Vercel
```bash
cd frontend
vercel --prod
```

### Railway
```bash
railway status
railway logs
railway variables
railway domain
```

---

## 🆘 Si algo falla

Revisa los archivos:
- `DEPLOY.md` - Guía completa de deploy
- `SETUP_VERCEL_RAILWAY.md` - Instrucciones detalladas
