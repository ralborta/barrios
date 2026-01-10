# 🔧 Solución: Error "Failed to fetch" - Frontend no se conecta al Backend

## ❌ Error Observado

```
Failed to fetch
ERR_CONNECTION_REFUSED
localhost:3001/api/auth/login
```

## 🔍 Causa

El frontend está intentando conectarse a `localhost:3001`, pero:
- **Si estás en desarrollo local:** El backend no está corriendo
- **Si estás en producción (Vercel):** Necesita la URL de Railway, no localhost

---

## ✅ Solución según tu caso

### Escenario 1: Desarrollo Local

#### Paso 1: Iniciar el Backend

```bash
cd backend
npm install
npm run dev
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
npm run prisma:seed
```

Esto creará:
- `admin@barrios.com` / `admin123`
- `operador@barrios.com` / `operador123`

#### Paso 4: Iniciar el Frontend

En otra terminal:
```bash
cd frontend
npm install
npm run dev
```

El frontend debería estar en `http://localhost:3000`

#### Paso 5: Probar Login

Usa las credenciales:
- Email: `admin@barrios.com`
- Contraseña: `admin123`

---

### Escenario 2: Producción (Vercel)

#### Paso 1: Obtener URL de Railway

1. Ve a Railway Dashboard: https://railway.app/dashboard
2. Selecciona tu proyecto "barrios"
3. Click en el servicio backend
4. **Settings** → **Networking**
5. **Genera dominio** si no lo tienes
6. **Copia la URL** (ej: `https://barrios-backend.railway.app`)

#### Paso 2: Configurar en Vercel

1. Ve a Vercel Dashboard: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. **Settings** → **Environment Variables**
4. Agrega/edita:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://tu-backend.railway.app` (la URL que copiaste)
5. **Environment:** Selecciona **Production**, **Preview**, y **Development**
6. Guarda
7. **Redeploy** el proyecto

#### Paso 3: Verificar

Después del redeploy, el frontend debería conectarse correctamente al backend.

---

## 🔍 Verificación Rápida

### Backend Local
```bash
# Terminal 1
cd backend
npm run dev
# Debería mostrar: "🚀 Server running on http://localhost:3001"
```

### Frontend Local
```bash
# Terminal 2
cd frontend
npm run dev
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
   - Backend: Terminal donde corre `npm run dev`
   - Frontend: Consola del navegador

---

## 🎯 Resumen

- **Local:** Inicia backend y frontend en terminales separadas
- **Producción:** Configura `NEXT_PUBLIC_API_URL` en Vercel con la URL de Railway
- **Usuarios:** Ejecuta `npm run prisma:seed` en el backend
