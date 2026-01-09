import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const countrySchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
});

const updateCountrySchema = countrySchema.partial();

export async function countriesRoutes(fastify: FastifyInstance) {
  // Listar countries
  fastify.get('/api/countries', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest) => {
    const countries = await prisma.country.findMany({
      include: {
        _count: {
          select: {
            vecinos: true,
            periodos: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: countries,
    };
  });

  // Obtener country por ID
  fastify.get('/api/countries/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    const country = await prisma.country.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vecinos: true,
            periodos: true,
          },
        },
      },
    });

    if (!country) {
      return reply.status(404).send({ error: 'Country no encontrado' });
    }

    return {
      success: true,
      data: country,
    };
  });

  // Crear country
  fastify.post('/api/countries', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = countrySchema.parse(request.body);

      const country = await prisma.country.create({
        data: body,
      });

      return {
        success: true,
        data: country,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al crear country' });
    }
  });

  // Actualizar country
  fastify.put('/api/countries/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const body = updateCountrySchema.parse(request.body);

      const country = await prisma.country.update({
        where: { id },
        data: body,
      });

      return {
        success: true,
        data: country,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al actualizar country' });
    }
  });

  // Eliminar country
  fastify.delete('/api/countries/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      await prisma.country.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Country eliminado correctamente',
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al eliminar country' });
    }
  });
}
