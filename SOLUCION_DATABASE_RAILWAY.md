# 🔧 Solución: Error de Conexión a Base de Datos en Railway

## ❌ Problema Actual

El servidor está crasheando con:
```
Can't reach database server at 'postgres.railway.internal:5432'
```

El servicio muestra estado **"Crashed"** en Railway.

---

## ✅ Solución Paso a Paso

### Paso 1: Verificar que Postgres esté Online

1. **Railway Dashboard** → Tu proyecto
2. Busca el servicio **Postgres** (o PostgreSQL)
3. Verifica que esté **"Online"** (círculo verde)
4. Si está "Offline" o "Stopped":
   - Click en el servicio Postgres
   - Click en **"Start"** o **"Restart"**
   - Espera 1-2 minutos a que arranque

---

### Paso 2: Obtener la URL Pública del Postgres

**IMPORTANTE:** Si estás usando `postgres.railway.internal`, Railway a veces no puede resolverla. Necesitas la URL pública.

#### Opción A: Desde Variables del Postgres (Más Fácil)

1. **Railway Dashboard** → Click en el servicio **Postgres**
2. Ve a la pestaña **"Variables"**
3. Busca `DATABASE_URL` o `POSTGRES_URL`
4. **Copia el valor completo**

**Si la URL tiene `postgres.railway.internal`:**
- Railway puede mostrar múltiples variables
- Busca una que tenga un dominio público como `containers-us-west-xxx.railway.app`
- O ve a la Opción B

#### Opción B: Desde Settings → Networking

1. **Railway Dashboard** → Servicio **Postgres**
2. **Settings** → **Networking**
3. Busca **"Public Networking"** o **"External Access"**
4. Si está disponible, **habilítala**
5. Railway generará una URL pública
6. Copia esa URL

#### Opción C: Usar Railway CLI

```bash
# Instalar Railway CLI si no lo tienes
npm i -g @railway/cli

# Login
railway login

# Link al proyecto
railway link

# Ver variables del Postgres
railway variables --service Postgres
```

---

### Paso 3: Identificar URL Pública vs Interna

**URL Interna (NO funciona si Postgres está offline o hay problemas de red):**
```
postgresql://postgres:password@postgres.railway.internal:5432/railway
```

**URL Pública (Siempre funciona):**
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```
O:
```
postgresql://postgres:password@xxxxx.railway.app:5432/railway
```

**Características de URL Pública:**
- ✅ Tiene un dominio como `containers-us-west-xxx.railway.app`
- ✅ O un dominio personalizado
- ❌ **NO** tiene `postgres.railway.internal`

---

### Paso 4: Configurar DATABASE_URL en el Backend

1. **Railway Dashboard** → Servicio **backend** (o el nombre de tu servicio)
2. Ve a la pestaña **"Variables"**
3. Busca `DATABASE_URL`
4. **Edita** o **agrega** la variable:
   - **Nombre:** `DATABASE_URL`
   - **Valor:** (pega la URL pública que copiaste en el Paso 2)
5. **Guarda** los cambios

**IMPORTANTE:** Si Railway te permite "Reference" variables del plugin Postgres:
- Busca una opción como `${{Postgres.DATABASE_URL}}`
- Esto hace que Railway actualice automáticamente la URL
- Pero asegúrate de que sea la URL pública, no la interna

---

### Paso 5: Redeploy el Servicio Backend

Después de cambiar `DATABASE_URL`, Railway debería hacer redeploy automáticamente. Si no:

1. **Railway Dashboard** → Servicio backend
2. **Deployments** tab
3. Click en **"Redeploy"** o haz un nuevo commit a GitHub

---

## 🔍 Verificación

Después del redeploy, verifica los logs:

1. **Railway Dashboard** → Servicio backend → **"Deploy Logs"**
2. Debes ver:
   ```
   📡 Database host: containers-us-west-xxx.railway.app
   📡 Database port: 5432
   ✅ Prisma connected successfully
   ✅ Database tables already exist
   ✅ Server successfully started on http://0.0.0.0:3001
   ```

**Si ves `postgres.railway.internal` en los logs**, significa que aún estás usando la URL interna. Vuelve al Paso 2.

**Si ves errores de conexión**, verifica:
- ✅ El servicio Postgres está "Online"
- ✅ `DATABASE_URL` tiene la URL pública (no `postgres.railway.internal`)
- ✅ La URL está completa (incluye `postgresql://`, usuario, password, host, puerto, y base de datos)

---

## 🚨 Si No Encuentras URL Pública

Si Railway solo te muestra `postgres.railway.internal` y no hay opción de URL pública:

1. **Verifica que Postgres esté Online:**
   - Railway Dashboard → Postgres → Debe mostrar "Online"

2. **Verifica que estén en el mismo proyecto:**
   - Ambos servicios deben estar en el mismo proyecto de Railway

3. **Intenta usar la URL interna pero verifica:**
   - Ambos servicios están "Online"
   - Están en el mismo proyecto
   - Railway puede resolver `postgres.railway.internal`

4. **Contacta soporte de Railway:**
   - A veces Railway requiere habilitar "Public Networking" manualmente
   - O puede haber un problema con la resolución DNS interna

---

## 📝 Nota Importante

La URL pública es más confiable que la interna porque:
- ✅ Funciona incluso si hay problemas de red interna
- ✅ Funciona desde cualquier lugar
- ✅ Es más fácil de debuggear
- ✅ No depende de que Railway resuelva DNS interno

La única desventaja es que puede ser ligeramente más lenta, pero la diferencia es mínima y la confiabilidad vale la pena.

---

## ✅ Checklist Final

- [ ] Servicio Postgres está "Online" en Railway
- [ ] Obtuve la URL pública del Postgres (no `postgres.railway.internal`)
- [ ] Configuré `DATABASE_URL` en el servicio backend con la URL pública
- [ ] El servicio backend hizo redeploy automáticamente
- [ ] Los logs muestran "✅ Prisma connected successfully"
- [ ] El servicio backend está "Online" (no "Crashed")
- [ ] El health check funciona: `https://barrios-production.up.railway.app/health`
