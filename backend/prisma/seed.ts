import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear usuario administrador por defecto
  const adminEmail = 'admin@barrios.com';
  const adminPassword = 'admin123'; // Cambiar en producción

  const existingAdmin = await prisma.usuario.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Usuario administrador ya existe');
  } else {
    const admin = await prisma.usuario.create({
      data: {
        email: adminEmail,
        nombre: 'Administrador',
        passwordHash: hashPassword(adminPassword),
        rol: 'ADMINISTRADOR',
        activo: true,
      },
    });
    console.log('✅ Usuario administrador creado:', admin.email);
  }

  // Crear usuario operador de prueba
  const operatorEmail = 'operador@barrios.com';
  const operatorPassword = 'operador123'; // Cambiar en producción

  const existingOperator = await prisma.usuario.findUnique({
    where: { email: operatorEmail },
  });

  if (existingOperator) {
    console.log('✅ Usuario operador ya existe');
  } else {
    const operator = await prisma.usuario.create({
      data: {
        email: operatorEmail,
        nombre: 'Operador',
        passwordHash: hashPassword(operatorPassword),
        rol: 'OPERADOR',
        activo: true,
      },
    });
    console.log('✅ Usuario operador creado:', operator.email);
  }

  console.log('✅ Seed completado');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
