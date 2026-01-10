# 🔍 Verificar por qué Railway no hace Deploy Automático

## Posibles Causas

### 1. Railway no está conectado al repositorio de GitHub
**Verificar:**
1. Railway Dashboard → Tu proyecto
2. Ve a **Settings** → **Service** → **Source**
3. Debe mostrar: "Connected to GitHub" y el nombre del repositorio
4. Si dice "Not connected", necesitas conectarlo

**Solución:**
1. Railway Dashboard → Tu servicio backend
2. **Settings** → **Service** → **Source**
3. Click en "Connect GitHub Repo"
4. Selecciona el repositorio `ralborta/barrios`
5. Selecciona la rama `main`
6. Guarda

---

### 2. Auto-Deploy está deshabilitado
**Verificar:**
1. Railway Dashboard → Tu servicio backend
2. **Settings** → **Deploy**
3. Busca "Auto Deploy" o "Automatic Deploys"
4. Debe estar **habilitado** (ON)

**Solución:**
1. Si está deshabilitado, habilítalo
2. Guarda cambios

---

### 3. Railway no detecta los cambios
**Verificar:**
1. Railway Dashboard → Tu servicio backend
2. **Deployments** tab
3. ¿Aparece el último commit que hiciste?
4. ¿Está en estado "Building" o "Failed"?

**Solución:**
1. Si no aparece el último commit, haz un **Redeploy manual**:
   - **Deployments** → Click en los tres puntos (⋯) del último deployment
   - Click en **"Redeploy"**

---

### 4. Configuración incorrecta del servicio
**Verificar en Railway Dashboard:**
1. **Settings** → **Service**
   - **Root Directory:** Debe estar **VACÍO** (porque el Dockerfile está en la raíz)
   - O si está configurado, debe ser `/` (raíz)

2. **Settings** → **Deploy**
   - **Build Command:** Debe estar **VACÍO** (el Dockerfile maneja todo)
   - **Start Command:** Debe estar **VACÍO** (el Dockerfile maneja todo)

---

### 5. Problema con el Dockerfile
**Verificar:**
1. Railway Dashboard → Tu servicio backend
2. **Deployments** → Último deployment
3. Click en los **logs del build**
4. Busca errores como:
   - "Dockerfile not found"
   - "Build failed"
   - "Command not found"

**Solución:**
- Si hay errores, compártelos para corregirlos

---

## ✅ Checklist Rápido

- [ ] Railway está conectado a GitHub: `ralborta/barrios`
- [ ] Auto-Deploy está habilitado
- [ ] Root Directory está vacío o es `/`
- [ ] Build Command está vacío
- [ ] Start Command está vacío
- [ ] El último commit aparece en Deployments
- [ ] No hay errores en los logs del build

---

## 🚀 Forzar Deploy Manual

Si nada funciona, puedes forzar un deploy manual:

1. Railway Dashboard → Tu servicio backend
2. **Deployments** tab
3. Click en **"New Deployment"** o **"Redeploy"**
4. Selecciona la rama `main`
5. Click en **"Deploy"**

---

## 📝 Nota sobre railway.json

El archivo `railway.json` está configurado para usar Dockerfile:
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  }
}
```

Esto significa que Railway debe:
1. Buscar `Dockerfile` en la raíz del proyecto ✅
2. Usar ese Dockerfile para construir la imagen ✅
3. Ejecutar el CMD del Dockerfile para iniciar ✅

Si Railway tiene **Root Directory** configurado como `backend`, entonces busca `backend/Dockerfile`, pero nuestro `railway.json` dice `Dockerfile` (raíz).

**Solución:** Asegúrate de que **Root Directory** esté **VACÍO** en Railway Dashboard.
