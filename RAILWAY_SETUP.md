# 🚂 Setup Railway - Paso a Paso

## Paso 1: Autenticación

Si no estás autenticado, ejecuta:

```bash
railway login
```

Esto abrirá el navegador para autenticarte.

---

## Paso 2: Crear Proyecto

```bash
cd /Users/ralborta/barrios
railway init
```

Cuando te pregunte:
- **Project Name:** `barrios` (o el que prefieras)
- Selecciona: **"Empty Project"**

---

## Paso 3: Agregar PostgreSQL

```bash
railway add postgresql
```

Esto creará automáticamente una base de datos PostgreSQL.

---

## Paso 4: Crear Servicio Backend

```bash
railway service
```

Si te pregunta, selecciona "Create New Service" o similar.

Luego:

```bash
railway link
```

Esto vinculará el servicio al directorio actual.

---

## Paso 5: Configurar Variables de Entorno

Primero, genera un JWT Secret seguro:

```bash
openssl rand -base64 32
```

Copia el resultado.

Luego, configura las variables:

```bash
# Database (se configura automáticamente, pero verifica)
railway variables

# JWT Secret (reemplaza TU_SECRET con el que generaste)
railway variables set JWT_SECRET=TU_SECRET_AQUI

# Server
railway variables set PORT=3001
railway variables set NODE_ENV=production

# Frontend URL (la actualizarás después con la URL de Vercel)
railway variables set FRONTEND_URL=https://tu-frontend.vercel.app

# Email (opcional por ahora)
railway variables set EMAIL_SMTP_HOST=smtp.gmail.com
railway variables set EMAIL_SMTP_PORT=587
railway variables set EMAIL_FROM=noreply@barrios.com

# Storage
railway variables set STORAGE_TYPE=local
railway variables set STORAGE_PATH=./uploads
```

---

## Paso 6: Configurar Root Directory

En Railway Dashboard:

1. Ve a tu proyecto
2. Click en el servicio backend
3. Settings → **Root Directory:** `backend`
4. **Build Command:** `pnpm install && pnpm prisma generate && pnpm build`
5. **Start Command:** `pnpm start`
6. Guarda cambios

---

## Paso 7: Generar Dominio Público

```bash
railway domain
```

O desde el dashboard:
- Settings → Networking → Generate Domain

Copia la URL que te dé (ej: `https://barrios-production.up.railway.app`)

---

## Paso 8: Ejecutar Migraciones

```bash
railway run --service backend pnpm prisma migrate deploy
```

O desde el dashboard:
- Click en el servicio backend
- Abre terminal
- Ejecuta: `pnpm prisma migrate deploy`

---

## Paso 9: Deploy

```bash
railway up
```

O simplemente haz push a GitHub y Railway desplegará automáticamente.

---

## Paso 10: Verificar

1. Obtén la URL del backend:
   ```bash
   railway domain
   ```

2. Prueba el health check:
   ```bash
   curl https://tu-backend.railway.app/health
   ```

   Debería responder: `{"status":"ok",...}`

---

## ✅ Checklist

- [ ] Autenticado en Railway
- [ ] Proyecto creado
- [ ] PostgreSQL agregado
- [ ] Servicio backend creado
- [ ] Root Directory: `backend`
- [ ] Variables de entorno configuradas
- [ ] Dominio público generado
- [ ] Migraciones ejecutadas
- [ ] Deploy exitoso
- [ ] Health check funciona

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
