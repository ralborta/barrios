import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const vecinoSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  email: z.string().email(),
  telefono: z.string().optional(),
  unidad: z.string().optional(),
  observaciones: z.string().optional(),
  countryId: z.string(),
});

const updateVecinoSchema = vecinoSchema.partial();

export async function vecinosRoutes(fastify: FastifyInstance) {
  // Listar vecinos
  fastify.get('/api/vecinos', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest) => {
    const { countryId, search } = request.query as { countryId?: string; search?: string };
    
    const where: any = {};
    if (countryId) {
      where.countryId = countryId;
    }
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { unidad: { contains: search, mode: 'insensitive' } },
      ];
    }

    const vecinos = await prisma.vecino.findMany({
      where,
      include: {
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            expensas: true,
            comprobantes: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return {
      success: true,
      data: vecinos,
    };
  });

  // Obtener vecino por ID
  fastify.get('/api/vecinos/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    const vecino = await prisma.vecino.findUnique({
      where: { id },
      include: {
        country: true,
        expensas: {
          include: {
            periodo: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        comprobantes: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        mensajes: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!vecino) {
      return reply.status(404).send({ error: 'Vecino no encontrado' });
    }

    return {
      success: true,
      data: vecino,
    };
  });

  // Crear vecino
  fastify.post('/api/vecinos', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = vecinoSchema.parse(request.body);

      const vecino = await prisma.vecino.create({
        data: body,
        include: {
          country: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        success: true,
        data: vecino,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al crear vecino' });
    }
  });

  // Actualizar vecino
  fastify.put('/api/vecinos/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const body = updateVecinoSchema.parse(request.body);

      const vecino = await prisma.vecino.update({
        where: { id },
        data: body,
        include: {
          country: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        success: true,
        data: vecino,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al actualizar vecino' });
    }
  });

  // Eliminar vecino
  fastify.delete('/api/vecinos/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      await prisma.vecino.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Vecino eliminado correctamente',
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al eliminar vecino' });
    }
  });
}
