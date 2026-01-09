# Roadmap de Desarrollo

## Fase 1: Fundación (Semana 1-2)

### Backend
- [x] Setup inicial del proyecto
- [x] Configuración de Prisma y esquema de base de datos
- [ ] Autenticación JWT
- [ ] CRUD de Usuarios
- [ ] CRUD de Countries
- [ ] CRUD de Vecinos
- [ ] CRUD de Períodos
- [ ] CRUD de Expensas

### Frontend
- [x] Setup inicial Next.js
- [x] Configuración Tailwind y shadcn/ui
- [ ] Layout base con sidebar
- [ ] Página de login
- [ ] Dashboard básico
- [ ] Listado de vecinos
- [ ] Listado de expensas

## Fase 2: Core Funcional (Semana 3-4)

### Backend
- [ ] Servicio de WhatsApp (básico)
- [ ] Servicio de Email (SMTP)
- [ ] Lógica de estados de expensas
- [ ] Sistema de mensajería
- [ ] Endpoints de comprobantes
- [ ] Upload de archivos

### Frontend
- [ ] Dashboard con KPIs
- [ ] Gestión de expensas (tabla avanzada)
- [ ] Ficha de vecino (mini CRM)
- [ ] Timeline de mensajes
- [ ] Bandeja de comprobantes
- [ ] Formularios de creación/edición

## Fase 3: Automatización (Semana 5-6)

### Backend
- [ ] Job de seguimiento diario
- [ ] Job de cierre de mes
- [ ] Job de cambio de estado (mes 2/mes 3)
- [ ] Webhook de WhatsApp
- [ ] Lógica de ciclo mensual completo

### Frontend
- [ ] Visualización de jobs programados
- [ ] Logs de automatización
- [ ] Configuración de automatización

## Fase 4: Importación y Reportes (Semana 7-8)

### Backend
- [ ] Servicio de importación CSV
- [ ] Validación de datos
- [ ] Endpoints de reportes
- [ ] Exportación CSV/Excel

### Frontend
- [ ] Interfaz de importación CSV
- [ ] Preview de datos a importar
- [ ] Página de reportes
- [ ] Exportación de datos

## Fase 5: Refinamiento (Semana 9-10)

### Backend
- [ ] Optimización de queries
- [ ] Manejo de errores mejorado
- [ ] Validaciones robustas
- [ ] Tests básicos

### Frontend
- [ ] Mejoras de UX
- [ ] Loading states
- [ ] Manejo de errores
- [ ] Responsive design
- [ ] Accesibilidad

## Fase 6: Piloto (Semana 11-12)

- [ ] Deploy a producción (Vercel + Railway)
- [ ] Configuración de dominio
- [ ] Setup de WhatsApp en producción
- [ ] Setup de Email en producción
- [ ] Carga de datos del piloto
- [ ] Testing con usuario real
- [ ] Ajustes basados en feedback

## Prioridades para MVP

### Must Have (MVP)
1. Autenticación básica
2. CRUD de vecinos y expensas
3. Dashboard funcional
4. Envío de mensajes (WhatsApp + Email)
5. Recepción de comprobantes
6. Jobs básicos de seguimiento

### Nice to Have (Post-MVP)
1. Importación CSV avanzada
2. Reportes complejos
3. Notificaciones en tiempo real
4. App móvil
5. Integración con recaudadora

## Notas

- Este roadmap es flexible y puede ajustarse según necesidades
- Las fases pueden solaparse
- Priorizar funcionalidad core antes de features avanzadas
- Testing continuo durante desarrollo
