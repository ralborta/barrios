# 🔧 Solución: Error de Conexión Frontend-Backend

## ❌ Error Observado

```
Failed to fetch
ERR_CONNECTION_REFUSED
localhost:3001/api/auth/login
```

## 🔍 Causa

El frontend está intentando conectarse a `localhost:3001` pero:
- **Si estás en desarrollo local:** El backend no está corriendo
- **Si estás en Vercel (producción):** Necesita la URL de Railway, no localhost

---

## ✅ Soluciones

### Escenario 1: Desarrollo Local

#### Paso 1: Iniciar el Backend

```bash
cd backend
pnpm install
pnpm dev
```

El backend debería estar corriendo en `http://localhost:3001`

#### Paso 2: Verificar que funciona

```bash
curl http://localhost:3001/health
```

Debería responder: `{"status":"ok",...}`

#### Paso 3: Crear usuarios (si no existen)

```bash
cd backend
pnpm prisma:seed
```

#### Paso 4: Iniciar el Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

El frontend debería estar en `http://localhost:3000`

---

### Escenario 2: Producción (Vercel)

#### Paso 1: Obtener URL de Railway

1. Ve a Railway Dashboard
2. Click en tu servicio backend
3. Settings → Networking
4. Genera dominio si no lo tienes
5. **Copia la URL** (ej: `https://barrios-backend.railway.app`)

#### Paso 2: Configurar en Vercel

1. Ve a Vercel Dashboard
2. Tu proyecto → Settings → Environment Variables
3. Agrega/edita:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://tu-backend.railway.app` (la URL que copiaste)
4. Guarda
5. **Redeploy** el proyecto

#### Paso 3: Verificar

Después del redeploy, el frontend debería conectarse correctamente al backend.

---

## 🔍 Verificación Rápida

### Backend Local
```bash
# Terminal 1
cd backend
pnpm dev
# Debería mostrar: "🚀 Server running on http://localhost:3001"
```

### Frontend Local
```bash
# Terminal 2
cd frontend
pnpm dev
# Debería mostrar: "Ready on http://localhost:3000"
```

### Probar Conexión
```bash
curl http://localhost:3001/health
# Debería responder: {"status":"ok",...}
```

---

## 📝 Credenciales por Defecto

Después de ejecutar el seed:

- **Email:** `admin@barrios.com`
- **Contraseña:** `admin123`

O:

- **Email:** `operador@barrios.com`
- **Contraseña:** `operador123`

---

## 🆘 Si Sigue Fallando

1. **Verifica que el backend esté corriendo:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Verifica CORS en el backend:**
   - Debe permitir el origen del frontend
   - En desarrollo: `http://localhost:3000`
   - En producción: URL de Vercel

3. **Verifica variables de entorno:**
   - Frontend: `NEXT_PUBLIC_API_URL`
   - Backend: `FRONTEND_URL`

4. **Revisa los logs:**
   - Backend: Terminal donde corre `pnpm dev`
   - Frontend: Consola del navegador
