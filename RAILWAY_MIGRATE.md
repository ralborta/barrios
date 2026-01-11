# Migración de Base de Datos en Railway

## Problema
Después de agregar nuevas tablas (`Pago`) y campos (`boletaUrl`, `boletaNombreArchivo`, `boletaTipoArchivo` en `Expensa`), la base de datos en Railway necesita ser actualizada.

## Solución Rápida

### Opción 1: Ejecutar migración manualmente en Railway

1. Ve a tu proyecto en Railway
2. Abre el servicio del backend
3. Ve a la pestaña "Deployments"
4. Haz clic en el deployment más reciente
5. Haz clic en "View logs"
6. Busca el comando "Run Command" o "Shell"

O ejecuta desde la terminal local con Railway CLI:

```bash
railway run --service backend pnpm prisma db push
```

### Opción 2: Usar Railway Shell

1. En Railway, ve a tu servicio backend
2. Haz clic en "Shell" o "Terminal"
3. Ejecuta:

```bash
cd backend
pnpm prisma db push
pnpm prisma generate
```

### Opción 3: Reiniciar el servicio

El código tiene auto-setup que debería ejecutar `prisma db push` automáticamente al iniciar si detecta que las tablas no existen. Simplemente reinicia el servicio:

1. Ve a Railway
2. Abre el servicio backend
3. Haz clic en "Restart" o "Redeploy"

## Verificación

Después de ejecutar la migración, verifica que las tablas existan:

```bash
railway run --service backend pnpm prisma studio
```

O verifica en los logs del servidor que no haya errores de "table does not exist" o "column does not exist".

## Tablas y Campos Agregados

### Nueva Tabla: `Pago`
- Campos: `monto`, `fecha`, `referencia`, `nombre`, `email`, `telefono`, `descripcion`, `metodoPago`, `datosAdicionales`
- Relaciones: `vecinoId`, `expensaId`, `comprobanteId`
- Estados: `PENDIENTE`, `CONCILIADO`, `REVISADO`, `RECHAZADO`, `DUPLICADO`

### Campos Agregados a `Expensa`:
- `boletaUrl` (String?)
- `boletaNombreArchivo` (String?)
- `boletaTipoArchivo` (String?)

### Campo Agregado a `Comprobante`:
- `pagoId` (String?, unique)

## Si el Auto-Setup No Funciona

Si el auto-setup no se ejecuta correctamente, puedes forzarlo:

1. Elimina temporalmente la tabla `usuarios` (o cualquier tabla)
2. Reinicia el servicio
3. El auto-setup debería detectar que faltan tablas y ejecutar `prisma db push`

**⚠️ ADVERTENCIA**: Esto eliminará datos. Solo hazlo si estás seguro o en desarrollo.
