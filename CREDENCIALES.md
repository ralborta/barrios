# 🔐 Credenciales de Usuario

## ⚠️ IMPORTANTE

**Estas son credenciales por defecto para desarrollo/pruebas.**
**CAMBIA LAS CONTRASEÑAS EN PRODUCCIÓN.**

---

## 👤 Usuarios Creados por Seed

### Administrador
- **Email:** `admin@barrios.com`
- **Contraseña:** `admin123`
- **Rol:** ADMINISTRADOR

### Operador
- **Email:** `operador@barrios.com`
- **Contraseña:** `operador123`
- **Rol:** OPERADOR

---

## 🚀 Cómo Crear los Usuarios

### Opción 1: Usando el Script de Seed (Recomendado)

```bash
cd backend
pnpm prisma:seed
```

O si estás en Railway:
```bash
railway run --service backend pnpm prisma:seed
```

### Opción 2: Usando el Endpoint de Registro

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@barrios.com",
    "password": "admin123",
    "nombre": "Administrador",
    "rol": "ADMINISTRADOR"
  }'
```

### Opción 3: Desde Prisma Studio

```bash
cd backend
pnpm prisma:studio
```

Luego crear manualmente un usuario en la interfaz web.

---

## 🔒 Seguridad en Producción

**ANTES de desplegar a producción:**

1. Ejecuta el seed para crear usuarios
2. **CAMBIA las contraseñas inmediatamente**
3. O mejor: Crea usuarios con contraseñas seguras desde el inicio

### Generar Contraseña Segura

```bash
openssl rand -base64 32
```

---

## 📝 Nota

El endpoint `/api/auth/register` está disponible para desarrollo.
En producción, deberías:
- Deshabilitarlo
- O protegerlo con autenticación
- O crear usuarios solo desde el seed/script

---

## ✅ Verificación

Después de ejecutar el seed, puedes probar el login:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@barrios.com",
    "password": "admin123"
  }'
```

Deberías recibir un token JWT.
