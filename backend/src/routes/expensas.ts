import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const expensaSchema = z.object({
  periodoId: z.string(),
  vecinoId: z.string(),
  monto: z.number().positive(),
  estado: z.enum([
    'PENDIENTE',
    'PAGO_INFORMADO',
    'CONFIRMADO',
    'EN_MORA',
    'EN_RECUPERO',
    'SIN_RESPUESTA',
    'PAUSADO',
  ]).optional(),
  fechaVencimiento: z.string().datetime(),
});

const updateExpensaSchema = expensaSchema.partial().extend({
  estado: z.enum([
    'PENDIENTE',
    'PAGO_INFORMADO',
    'CONFIRMADO',
    'EN_MORA',
    'EN_RECUPERO',
    'SIN_RESPUESTA',
    'PAUSADO',
  ]).optional(),
});

export async function expensasRoutes(fastify: FastifyInstance) {
  // Listar expensas
  fastify.get('/api/expensas', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest) => {
    const { periodoId, vecinoId, estado, countryId } = request.query as {
      periodoId?: string;
      vecinoId?: string;
      estado?: string;
      countryId?: string;
    };
    
    const where: any = {};
    if (periodoId) where.periodoId = periodoId;
    if (vecinoId) where.vecinoId = vecinoId;
    if (estado) where.estado = estado;
    if (countryId) {
      where.periodo = { countryId };
    }

    const expensas = await prisma.expensa.findMany({
      where,
      include: {
        periodo: {
          select: {
            id: true,
            mes: true,
            anio: true,
            country: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        vecino: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            unidad: true,
          },
        },
        _count: {
          select: {
            mensajes: true,
            comprobantes: true,
          },
        },
      },
      orderBy: {
        fechaVencimiento: 'asc',
      },
    });

    return {
      success: true,
      data: expensas,
    };
  });

  // Obtener expensa por ID
  fastify.get<{ Params: { id: string } }>('/api/expensas/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;

    const expensa = await prisma.expensa.findUnique({
      where: { id },
      include: {
        periodo: {
          include: {
            country: true,
          },
        },
        vecino: true,
        mensajes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        comprobantes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!expensa) {
      return reply.status(404).send({ error: 'Expensa no encontrada' });
    }

    return {
      success: true,
      data: expensa,
    };
  });

  // Crear expensa
  fastify.post('/api/expensas', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = expensaSchema.parse(request.body);

      const expensa = await prisma.expensa.create({
        data: {
          ...body,
          fechaVencimiento: new Date(body.fechaVencimiento),
          estado: body.estado || 'PENDIENTE',
        },
        include: {
          periodo: {
            select: {
              id: true,
              mes: true,
              anio: true,
            },
          },
          vecino: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        data: expensa,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al crear expensa' });
    }
  });

  // Actualizar expensa
  fastify.put<{ Params: { id: string } }>('/api/expensas/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const body = updateExpensaSchema.parse(request.body);

      const updateData: any = { ...body };
      if (body.fechaVencimiento) {
        updateData.fechaVencimiento = new Date(body.fechaVencimiento);
      }

      const expensa = await prisma.expensa.update({
        where: { id },
        data: updateData,
        include: {
          periodo: {
            select: {
              id: true,
              mes: true,
              anio: true,
            },
          },
          vecino: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        data: expensa,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al actualizar expensa' });
    }
  });

  // Eliminar expensa
  fastify.delete<{ Params: { id: string } }>('/api/expensas/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      await prisma.expensa.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Expensa eliminada correctamente',
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al eliminar expensa' });
    }
  });

  // Crear múltiples expensas (para un período)
  fastify.post('/api/expensas/bulk', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = z.object({
        periodoId: z.string(),
        vecinos: z.array(z.object({
          vecinoId: z.string(),
          monto: z.number().positive(),
        })),
        fechaVencimiento: z.string().datetime(),
      }).parse(request.body);

      const expensas = await prisma.$transaction(
        body.vecinos.map((v) =>
          prisma.expensa.create({
            data: {
              periodoId: body.periodoId,
              vecinoId: v.vecinoId,
              monto: v.monto,
              fechaVencimiento: new Date(body.fechaVencimiento),
              estado: 'PENDIENTE',
            },
          })
        )
      );

      return {
        success: true,
        data: expensas,
        count: expensas.length,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al crear expensas' });
    }
  });
}
