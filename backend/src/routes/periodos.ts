import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const periodoSchema = z.object({
  countryId: z.string(),
  mes: z.number().min(1).max(12),
  anio: z.number().min(2020),
  montoBase: z.number().positive(),
  fechaVencimiento: z.string().datetime(),
  fechaCierre: z.string().datetime().optional(),
});

const updatePeriodoSchema = periodoSchema.partial();

export async function periodosRoutes(fastify: FastifyInstance) {
  // Listar períodos
  fastify.get('/api/periodos', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest) => {
    const { countryId } = request.query as { countryId?: string };
    
    const where: any = {};
    if (countryId) {
      where.countryId = countryId;
    }

    const periodos = await prisma.periodo.findMany({
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
          },
        },
      },
      orderBy: [
        { anio: 'desc' },
        { mes: 'desc' },
      ],
    });

    return {
      success: true,
      data: periodos,
    };
  });

  // Obtener período por ID
  fastify.get<{ Params: { id: string } }>('/api/periodos/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;

    const periodo = await prisma.periodo.findUnique({
      where: { id },
      include: {
        country: true,
        expensas: {
          include: {
            vecino: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                unidad: true,
              },
            },
          },
        },
      },
    });

    if (!periodo) {
      return reply.status(404).send({ error: 'Período no encontrado' });
    }

    return {
      success: true,
      data: periodo,
    };
  });

  // Crear período
  fastify.post('/api/periodos', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = periodoSchema.parse(request.body);

      const periodo = await prisma.periodo.create({
        data: {
          ...body,
          fechaVencimiento: new Date(body.fechaVencimiento),
          fechaCierre: body.fechaCierre ? new Date(body.fechaCierre) : null,
        },
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
        data: periodo,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al crear período' });
    }
  });

  // Actualizar período
  fastify.put<{ Params: { id: string } }>('/api/periodos/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const body = updatePeriodoSchema.parse(request.body);

      const updateData: any = { ...body };
      if (body.fechaVencimiento) {
        updateData.fechaVencimiento = new Date(body.fechaVencimiento);
      }
      if (body.fechaCierre !== undefined) {
        updateData.fechaCierre = body.fechaCierre ? new Date(body.fechaCierre) : null;
      }

      const periodo = await prisma.periodo.update({
        where: { id },
        data: updateData,
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
        data: periodo,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al actualizar período' });
    }
  });

  // Eliminar período
  fastify.delete<{ Params: { id: string } }>('/api/periodos/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      await prisma.periodo.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Período eliminado correctamente',
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al eliminar período' });
    }
  });
}
