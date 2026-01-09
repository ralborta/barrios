# Guía de Desarrollo

## Estructura del Proyecto

### Frontend (`/frontend`)

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Rutas del dashboard
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── expensas/      # Gestión de expensas
│   │   ├── vecinos/       # Directorio de vecinos
│   │   └── comprobantes/  # Bandeja de comprobantes
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                # Componentes shadcn/ui
│   ├── dashboard/         # Componentes del dashboard
│   ├── expensas/          # Componentes de expensas
│   └── vecinos/           # Componentes de vecinos
├── lib/
│   ├── api.ts             # Cliente API
│   ├── utils.ts           # Utilidades
│   └── validations.ts     # Schemas Zod
├── hooks/                 # Custom hooks
└── types/                 # TypeScript types
```

### Backend (`/backend`)

```
backend/
├── src/
│   ├── routes/            # Rutas de la API
│   │   ├── auth.ts
│   │   ├── expensas.ts
│   │   ├── vecinos.ts
│   │   ├── periodos.ts
│   │   ├── comprobantes.ts
│   │   └── mensajes.ts
│   ├── services/          # Lógica de negocio
│   │   ├── expensas.service.ts
│   │   ├── whatsapp.service.ts
│   │   ├── email.service.ts
│   │   └── csv.service.ts
│   ├── jobs/              # Jobs programados
│   │   ├── seguimiento.job.ts
│   │   ├── cierre-mes.job.ts
│   │   └── cambio-estado.job.ts
│   ├── middleware/        # Middleware
│   │   ├── auth.middleware.ts
│   │   └── validation.middleware.ts
│   ├── utils/             # Utilidades
│   └── index.ts           # Entry point
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── uploads/               # Archivos subidos (comprobantes)
```

## Convenciones de Código

### Naming

- **Componentes React**: PascalCase (`ExpensaCard.tsx`)
- **Utilidades**: camelCase (`formatCurrency.ts`)
- **Hooks**: camelCase con prefijo `use` (`useExpensas.ts`)
- **Tipos/Interfaces**: PascalCase (`Expensa`, `EstadoExpensa`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

### Estructura de Commits

```
feat: agregar gestión de comprobantes
fix: corregir cálculo de seguimientos
refactor: simplificar lógica de estados
docs: actualizar README
```

## Flujo de Trabajo

1. **Crear branch**: `git checkout -b feature/nombre-feature`
2. **Desarrollar**: Hacer cambios y commits
3. **Testing**: Probar localmente
4. **Push**: `git push origin feature/nombre-feature`
5. **PR**: Crear Pull Request

## Testing Local

### Backend

```bash
cd backend
pnpm dev
# Servidor en http://localhost:3001
```

### Frontend

```bash
cd frontend
pnpm dev
# App en http://localhost:3000
```

### Base de Datos

```bash
cd backend
pnpm prisma studio
# Abre Prisma Studio en http://localhost:5555
```

## Migraciones de Base de Datos

```bash
# Crear nueva migración
cd backend
pnpm prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
pnpm prisma migrate deploy
```

## Variables de Entorno

Siempre usar `.env.example` como referencia. Nunca commitear `.env` con valores reales.

## Próximos Pasos de Desarrollo

1. ✅ Setup inicial del proyecto
2. ⏳ Autenticación y autorización
3. ⏳ CRUD de vecinos
4. ⏳ CRUD de períodos y expensas
5. ⏳ Dashboard con KPIs
6. ⏳ Integración WhatsApp
7. ⏳ Integración Email
8. ⏳ Jobs programados
9. ⏳ Importación CSV
10. ⏳ Gestión de comprobantes
