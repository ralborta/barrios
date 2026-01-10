# 🔧 Solución: Error de Conexión a Base de Datos en Railway

## ❌ Problema Actual

El backend está crasheando con:
```
Can't reach database server at 'postgres.railway.internal:5432'
```

Esto significa que el `DATABASE_URL` está usando una URL interna (`postgres.railway.internal`) que no es accesible.

---

## ✅ Solución Paso a Paso

### Paso 1: Verificar que Postgres esté en el mismo proyecto

1. **Railway Dashboard** → Tu proyecto
2. Verifica que haya **DOS servicios**:
   - ✅ Un servicio **Postgres** (o PostgreSQL)
   - ✅ Un servicio **backend** (o el nombre que le diste)

**Si NO hay servicio Postgres:**
- Click en **"+ New"** → **"Database"** → **"Add PostgreSQL"**
- Espera a que se cree (1-2 minutos)

---

### Paso 2: Obtener el DATABASE_URL correcto

1. **Railway Dashboard** → Click en el servicio **Postgres**
2. Ve a la pestaña **"Variables"**
3. Busca `DATABASE_URL` o `POSTGRES_URL`
4. **Copia el valor COMPLETO** (debe verse algo como):
   ```
   postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
   ```
   O puede ser:
   ```
   postgresql://postgres:password@postgres.railway.internal:5432/railway
   ```

**IMPORTANTE:** Si la URL tiene `postgres.railway.internal`, Railway debería resolverla automáticamente, pero a veces falla. En ese caso, usa la URL pública.

---

### Paso 3: Configurar DATABASE_URL en el Backend

1. **Railway Dashboard** → Click en el servicio **backend**
2. Ve a la pestaña **"Variables"**
3. Busca `DATABASE_URL`

**Opción A: Si Railway permite referenciar variables del plugin (Recomendado)**
- Si ves una opción para "Reference" o "Link" variables del Postgres
- Selecciona `${{Postgres.DATABASE_URL}}` o similar
- Esto hace que Railway actualice automáticamente la URL

**Opción B: Copiar el valor manualmente**
- Si la URL del Postgres tiene `postgres.railway.internal` y no funciona:
  1. En el servicio Postgres → **"Settings"** → **"Networking"**
  2. Busca la **URL pública** (si está disponible)
  3. O usa la URL que tiene un dominio público (ej: `containers-us-west-xxx.railway.app`)
- Pega el valor completo en `DATABASE_URL` del backend

---

### Paso 4: Verificar que ambos servicios estén "Online"

1. **Railway Dashboard** → Tu proyecto
2. Verifica que ambos servicios muestren estado **"Online"** (círculo verde)
3. Si el Postgres está "Offline" o "Crashed", haz click en **"Restart"**

---

### Paso 5: Redeploy del Backend

1. **Railway Dashboard** → Servicio backend
2. **Deployments** tab
3. Click en los tres puntos (⋯) del último deployment
4. Click en **"Redeploy"**

O simplemente haz un commit nuevo para trigger el auto-deploy.

---

## 🔍 Verificación

Después del redeploy, verifica los logs:

1. **Railway Dashboard** → Servicio backend → **"Deploy Logs"**
2. Debes ver:
   ```
   ✅ Prisma connected successfully
   ✅ Database tables already exist
   🚀 Server listening on port 3001
   ```

Si ves errores de conexión, verifica:
- [ ] Postgres está "Online"
- [ ] `DATABASE_URL` en backend coincide con el del Postgres
- [ ] Ambos servicios están en el mismo proyecto

---

## 🚨 Si Nada Funciona: Usar URL Pública

Si `postgres.railway.internal` no funciona, puedes forzar el uso de la URL pública:

1. **Railway Dashboard** → Servicio Postgres
2. **Settings** → **Networking**
3. Si hay una opción para "Public URL" o "External Access", habilítala
4. Copia esa URL y úsala en `DATABASE_URL` del backend

**Nota:** La URL pública puede tener un formato como:
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

---

## 📝 Nota sobre Railway Internal URLs

Railway usa `postgres.railway.internal` para comunicación interna entre servicios del mismo proyecto. Esto debería funcionar automáticamente, pero a veces falla si:

- Los servicios no están en el mismo proyecto
- Hay problemas de red interna en Railway
- El servicio Postgres no está completamente inicializado

En esos casos, usar la URL pública es la solución más confiable.
