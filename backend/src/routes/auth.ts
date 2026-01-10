import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { z } from 'zod';

// Prisma se importa desde index.ts para evitar múltiples instancias
declare module 'fastify' {
  interface FastifyInstance {
    prisma: any;
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(1),
  rol: z.enum(['ADMINISTRADOR', 'OPERADOR', 'LECTURA']).optional(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginSchema.parse(request.body);
      
      const usuario = await fastify.prisma.usuario.findUnique({
        where: { email: body.email },
      });

      if (!usuario || !usuario.activo) {
        return reply.status(401).send({ error: 'Credenciales inválidas' });
      }

      const isValid = verifyPassword(body.password, usuario.passwordHash);
      if (!isValid) {
        return reply.status(401).send({ error: 'Credenciales inválidas' });
      }

      const token = fastify.jwt.sign({
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      });

      return {
        success: true,
        token,
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error en el servidor' });
    }
  });

  // Registro (solo para desarrollo, en producción debería estar protegido)
  fastify.post('/api/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = registerSchema.parse(request.body);
      
      const existingUser = await fastify.prisma.usuario.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        return reply.status(400).send({ error: 'El email ya está registrado' });
      }

      const passwordHash = hashPassword(body.password);

      const usuario = await fastify.prisma.usuario.create({
        data: {
          email: body.email,
          passwordHash,
          nombre: body.nombre,
          rol: body.rol || 'OPERADOR',
        },
      });

      const token = fastify.jwt.sign({
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      });

      return {
        success: true,
        token,
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error en el servidor' });
    }
  });

  // Verificar token
  fastify.get('/api/auth/me', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest) => {
    const user = request.user as { id: string; email: string; nombre: string; rol: string };
    
    const usuario = await fastify.prisma.usuario.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
      },
    });

    return {
      success: true,
      user: usuario,
    };
  });
}
