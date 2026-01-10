#!/bin/bash
# Script para configurar la base de datos en Railway

echo "🔧 Generando Prisma Client..."
pnpm prisma:generate

echo "📦 Aplicando migraciones..."
pnpm prisma:migrate:deploy

echo "🌱 Ejecutando seed (crear usuarios)..."
pnpm prisma:seed

echo "✅ Setup completado!"
