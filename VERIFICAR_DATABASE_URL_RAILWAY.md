# Verificar y Corregir DATABASE_URL en Railway

## Problema Actual

El servidor está intentando conectarse a `postgres.railway.internal:5432` pero no puede alcanzarlo. Esto causa errores 500 en todas las rutas que usan la base de datos.

## Solución

### Paso 1: Verificar que el Servicio Postgres Existe

1. Ve a tu proyecto en Railway: https://railway.app
2. Verifica que tengas un servicio **Postgres** en el mismo proyecto
3. Asegúrate de que el servicio Postgres esté **"Online"** (no pausado)

### Paso 2: Obtener la URL Pública del Postgres

1. En Railway, haz clic en tu servicio **Postgres**
2. Ve a la pestaña **"Variables"** o **"Settings"**
3. Busca la variable **`DATABASE_URL`** o **`POSTGRES_URL`**
4. **Copia esa URL completa**

La URL debería verse así:
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

**NO uses** `postgres.railway.internal` - esa es una URL interna que solo funciona en ciertas condiciones.

### Paso 3: Actualizar DATABASE_URL en el Servicio Backend

1. En Railway, haz clic en tu servicio **Backend**
2. Ve a la pestaña **"Variables"**
3. Busca la variable **`DATABASE_URL`**
4. **Reemplaza** el valor con la URL pública que copiaste del Postgres
5. Guarda los cambios

### Paso 4: Reiniciar el Servicio Backend

1. Después de actualizar `DATABASE_URL`, Railway debería reiniciar automáticamente
2. Si no se reinicia, haz clic en **"Redeploy"** o **"Restart"**

### Paso 5: Ejecutar la Migración

Una vez que el servidor pueda conectarse a la DB, ejecuta la migración:

```bash
railway run --service backend pnpm db:migrate
```

O desde Railway Shell:
```bash
cd backend
pnpm prisma db push
pnpm prisma generate
```

## Verificación

Después de estos pasos, verifica en los logs:

1. Deberías ver: `✅ Prisma connected successfully`
2. Deberías ver: `✅ Database tables already exist` o `✅ Database migration completed`
3. El login debería funcionar sin errores 500

## Si el Problema Persiste

### Opción A: Crear un Nuevo Servicio Postgres

1. En Railway, crea un nuevo servicio **Postgres**
2. Espera a que esté "Online"
3. Copia la `DATABASE_URL` del nuevo servicio
4. Actualiza `DATABASE_URL` en tu servicio Backend

### Opción B: Usar Postgres Externo

Si Railway Postgres no funciona, puedes usar:
- Supabase (gratis)
- Neon (gratis)
- Render Postgres
- Cualquier Postgres con URL pública

Solo actualiza `DATABASE_URL` con la URL de conexión pública.

## Nota Importante

La URL `postgres.railway.internal` solo funciona si:
- ✅ El servicio Postgres está en el mismo proyecto
- ✅ Ambos servicios están "Online"
- ✅ Están en la misma red interna de Railway

Si alguna de estas condiciones no se cumple, usa la **URL pública** del Postgres.
