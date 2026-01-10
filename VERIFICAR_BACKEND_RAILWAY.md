# 🔍 Verificar Backend en Railway

## ❌ Error Actual

```
405 Method Not Allowed
Unexpected end of JSON input
```

## 🔍 Posibles Causas

1. El backend no está corriendo en Railway
2. Las rutas no están registradas correctamente
3. CORS sigue bloqueando
4. El método HTTP no está permitido

---

## ✅ Verificación Paso a Paso

### Paso 1: Verificar que el Backend esté Corriendo

1. Ve a Railway Dashboard: https://railway.app/dashboard
2. Selecciona tu proyecto "barrios"
3. Click en el **servicio backend**
4. Ve a la pestaña **"Logs"** (Registros)
5. Debes ver algo como:
   ```
   🚀 Server running on http://localhost:3001
   ```
   O mensajes de Fastify indicando que el servidor está corriendo

**Si NO ves estos mensajes:**
- El backend no está corriendo
- Revisa los logs anteriores para ver errores
- Puede que haya fallado el deploy

---

### Paso 2: Probar el Health Check

Abre en tu navegador o con curl:

```
https://tu-backend.railway.app/health
```

**Debería responder:**
```json
{"status":"ok","timestamp":"2026-01-09T..."}
```

**Si NO responde:**
- El backend no está corriendo
- O hay un problema con el dominio

**Si responde:**
- El backend está corriendo ✅
- El problema es con las rutas o CORS

---

### Paso 3: Probar el Endpoint de Login Directamente

Abre en tu navegador la consola (F12) y ejecuta:

```javascript
fetch('https://tu-backend.railway.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@barrios.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

**Si funciona:**
- El backend está bien ✅
- El problema es en el frontend

**Si da error 405:**
- El método POST no está permitido
- O la ruta no está registrada

**Si da error CORS:**
- Necesitas configurar `FRONTEND_URL` en Railway

---

### Paso 4: Verificar Variables de Entorno en Railway

1. Railway Dashboard → Tu servicio backend
2. **Variables** tab
3. Verifica que existan:
   - `DATABASE_URL` ✅
   - `JWT_SECRET` ✅
   - `PORT` (opcional, default 3001)
   - `FRONTEND_URL` = URL de Vercel ⚠️

**Si falta `FRONTEND_URL`:**
- Agrégalo con la URL de Vercel
- Haz redeploy

---

### Paso 5: Verificar Logs de Railway

1. Railway Dashboard → Tu servicio backend
2. **Logs** tab
3. Busca errores relacionados con:
   - Prisma (base de datos)
   - Rutas no encontradas
   - Errores de compilación
   - Errores de inicio

---

## 🆘 Soluciones Comunes

### Si el Backend NO está Corriendo:

1. **Verifica el último deploy:**
   - Railway Dashboard → Deployments
   - Verifica que el último deploy sea exitoso (verde)

2. **Revisa los logs del deploy:**
   - Click en el deployment
   - Ve a "View Logs"
   - Busca errores

3. **Verifica que el Dockerfile esté correcto:**
   - El Dockerfile debe estar en la raíz
   - Debe copiar correctamente los archivos

### Si el Backend SÍ está Corriendo pero da 405:

1. **Verifica que las rutas estén registradas:**
   - El código debe tener `await fastify.register(authRoutes)`
   - Las rutas deben estar en `fastify.post('/api/auth/login', ...)`

2. **Verifica CORS:**
   - Agrega `FRONTEND_URL` en Railway
   - Haz redeploy

3. **Prueba con curl:**
   ```bash
   curl -X POST https://tu-backend.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@barrios.com","password":"admin123"}'
   ```

---

## 📝 Checklist de Verificación

- [ ] Backend está corriendo (ver logs en Railway)
- [ ] Health check funciona (`/health`)
- [ ] Variables de entorno configuradas
- [ ] `FRONTEND_URL` está configurado en Railway
- [ ] Backend redeployado después de cambios
- [ ] Prueba directa del endpoint funciona

---

## 🎯 Próximos Pasos

1. **Verifica que el backend esté corriendo** (Paso 1)
2. **Prueba el health check** (Paso 2)
3. **Si funciona, prueba el login directamente** (Paso 3)
4. **Comparte los resultados** para diagnosticar mejor
