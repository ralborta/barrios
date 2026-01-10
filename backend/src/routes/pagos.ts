import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { conciliarPago, conciliarPagos } from '../services/conciliacion.service.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: any;
  }
}

const pagoSchema = z.object({
  monto: z.number().positive(),
  fecha: z.string().datetime().optional(),
  referencia: z.string().optional(),
  nombre: z.string().optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  descripcion: z.string().optional(),
  expensaId: z.string().optional(), // Si ya se conoce la expensa
});

const pagosBulkSchema = z.object({
  pagos: z.array(pagoSchema),
  autoConciliar: z.boolean().default(true),
});

export async function pagosRoutes(fastify: FastifyInstance) {
  // Endpoint para recibir pagos del concentrador (futuro - API)
  fastify.post('/api/pagos', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = pagoSchema.parse(request.body);
      
      // Buscar vecino y expensas
      const vecinos = await fastify.prisma.vecino.findMany({
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          telefono: true,
        },
      });
      
      const expensas = await fastify.prisma.expensa.findMany({
        where: {
          estado: {
            in: ['PENDIENTE', 'PAGO_INFORMADO'],
          },
        },
        include: {
          periodo: {
            include: {
              country: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
      
      // Si ya se proporcionó expensaId, usar directamente
      if (data.expensaId) {
        const expensa = await fastify.prisma.expensa.findUnique({
          where: { id: data.expensaId },
          include: {
            vecino: true,
            periodo: {
              include: {
                country: true,
              },
            },
          },
        });
        
        if (!expensa) {
          return reply.status(404).send({ error: 'Expensa no encontrada' });
        }
        
        // Verificar monto
        const montoExpensa = Number(expensa.monto);
        const montoPago = Number(data.monto);
        const diferencia = Math.abs(montoExpensa - montoPago);
        
        // Crear comprobante
        const comprobante = await fastify.prisma.comprobante.create({
          data: {
            vecinoId: expensa.vecinoId,
            expensaId: expensa.id,
            url: data.referencia || 'api-pago',
            tipoArchivo: 'application/json',
            nombreArchivo: `pago-${data.referencia || 'api'}`,
            estado: diferencia < 0.01 ? 'CONFIRMADO' : 'NUEVO',
            observaciones: `Pago recibido por API. Monto: $${montoPago.toFixed(2)}, Diferencia: $${diferencia.toFixed(2)}`,
          },
        });
        
        // Actualizar estado de expensa si el monto coincide
        if (diferencia < 0.01) {
          await fastify.prisma.expensa.update({
            where: { id: expensa.id },
            data: {
              estado: 'CONFIRMADO',
            },
          });
        } else if (expensa.estado === 'PENDIENTE') {
          await fastify.prisma.expensa.update({
            where: { id: expensa.id },
            data: {
              estado: 'PAGO_INFORMADO',
            },
          });
        }
        
        return {
          success: true,
          data: {
            comprobante,
            expensa: {
              id: expensa.id,
              estado: diferencia < 0.01 ? 'CONFIRMADO' : expensa.estado,
            },
            conciliacion: {
              coincidencia: diferencia < 0.01 ? 'exacta' : 'aproximada',
              diferencia,
            },
          },
        };
      }
      
      // Conciliación automática
      const pagoInfo = {
        monto: data.monto,
        fecha: data.fecha ? new Date(data.fecha) : undefined,
        referencia: data.referencia,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        descripcion: data.descripcion,
      };
      
      const resultado = await conciliarPago(
        pagoInfo,
        vecinos,
        expensas.map((e: any) => ({
          id: e.id,
          vecinoId: e.vecinoId,
          monto: Number(e.monto),
          periodo: {
            mes: e.periodo.mes,
            anio: e.periodo.anio,
            country: e.periodo.country,
          },
          estado: e.estado,
          fechaVencimiento: e.fechaVencimiento,
        }))
      );
      
      if (!resultado || resultado.confianza < 70) {
        return reply.status(400).send({
          error: 'No se pudo conciliar el pago automáticamente',
          requiereRevision: true,
          pago: pagoInfo,
        });
      }
      
      // Crear comprobante
      const comprobante = await fastify.prisma.comprobante.create({
        data: {
          vecinoId: resultado.vecinoId,
          expensaId: resultado.expensaId,
          url: data.referencia || 'api-pago',
          tipoArchivo: 'application/json',
          nombreArchivo: `pago-${data.referencia || 'api'}`,
          estado: resultado.coincidencia === 'exacta' ? 'CONFIRMADO' : 'NUEVO',
          observaciones: `Pago conciliado automáticamente. ${resultado.razon}. Confianza: ${resultado.confianza}%`,
        },
      });
      
      // Actualizar estado de expensa
      const expensa = await fastify.prisma.expensa.findUnique({
        where: { id: resultado.expensaId },
      });
      
      if (resultado.coincidencia === 'exacta') {
        await fastify.prisma.expensa.update({
          where: { id: resultado.expensaId },
          data: {
            estado: 'CONFIRMADO',
          },
        });
      } else if (expensa?.estado === 'PENDIENTE') {
        await fastify.prisma.expensa.update({
          where: { id: resultado.expensaId },
          data: {
            estado: 'PAGO_INFORMADO',
          },
        });
      }
      
      return {
        success: true,
        data: {
          comprobante,
          conciliacion: resultado,
        },
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          detalles: error.errors,
        });
      }
      
      fastify.log.error(error);
      return reply.status(500).send({
        error: error.message || 'Error al procesar el pago',
      });
    }
  });
  
  // Endpoint para procesar múltiples pagos (bulk)
  fastify.post('/api/pagos/bulk', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = pagosBulkSchema.parse(request.body);
      
      // Buscar vecinos y expensas
      const vecinos = await fastify.prisma.vecino.findMany({
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          telefono: true,
        },
      });
      
      const expensas = await fastify.prisma.expensa.findMany({
        where: {
          estado: {
            in: ['PENDIENTE', 'PAGO_INFORMADO'],
          },
        },
        include: {
          periodo: {
            include: {
              country: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
      
      if (data.autoConciliar) {
        // Conciliación automática
        const pagosInfo = data.pagos.map(p => ({
          monto: p.monto,
          fecha: p.fecha ? new Date(p.fecha) : undefined,
          referencia: p.referencia,
          nombre: p.nombre,
          email: p.email,
          telefono: p.telefono,
          descripcion: p.descripcion,
        }));
        
        const resultados = await conciliarPagos(
          pagosInfo,
          vecinos,
          expensas.map((e: any) => ({
            id: e.id,
            vecinoId: e.vecinoId,
            monto: Number(e.monto),
            periodo: {
              mes: e.periodo.mes,
              anio: e.periodo.anio,
              country: e.periodo.country,
            },
            estado: e.estado,
            fechaVencimiento: e.fechaVencimiento,
          }))
        );
        
        // Crear comprobantes para los exitosos
        const comprobantesCreados = [];
        for (const resultado of resultados.exitosos) {
          const comprobante = await fastify.prisma.comprobante.create({
            data: {
              vecinoId: resultado.vecinoId,
              expensaId: resultado.expensaId,
              url: resultado.pago.referencia || 'bulk-pago',
              tipoArchivo: 'application/json',
              nombreArchivo: `pago-${resultado.pago.referencia || 'bulk'}`,
              estado: resultado.coincidencia === 'exacta' ? 'CONFIRMADO' : 'NUEVO',
              observaciones: `Pago conciliado automáticamente. ${resultado.razon}. Confianza: ${resultado.confianza}%`,
            },
          });
          
          // Actualizar estado de expensa
          if (resultado.coincidencia === 'exacta') {
            await fastify.prisma.expensa.update({
              where: { id: resultado.expensaId },
              data: {
                estado: 'CONFIRMADO',
              },
            });
          }
          
          comprobantesCreados.push({ comprobante, conciliacion: resultado });
        }
        
        return {
          success: true,
          data: {
            exitosos: comprobantesCreados,
            pendientes: resultados.pendientes,
            resumen: {
              total: data.pagos.length,
              exitosos: resultados.exitosos.length,
              pendientes: resultados.pendientes.length,
            },
          },
        };
      } else {
        // Solo crear comprobantes sin conciliar
        const comprobantes = [];
        for (const pago of data.pagos) {
          // Buscar vecino por email o nombre
          let vecino = null;
          if (pago.email) {
            vecino = await fastify.prisma.vecino.findUnique({
              where: { email: pago.email },
            });
          }
          
          if (!vecino && pago.nombre) {
            // Buscar por nombre (aproximado)
            const vecinos = await fastify.prisma.vecino.findMany({
              where: {
                OR: [
                  { nombre: { contains: pago.nombre, mode: 'insensitive' } },
                  { apellido: { contains: pago.nombre, mode: 'insensitive' } },
                ],
              },
            });
            if (vecinos.length === 1) {
              vecino = vecinos[0];
            }
          }
          
          if (!vecino) {
            continue; // Saltar si no se encuentra vecino
          }
          
          const comprobante = await fastify.prisma.comprobante.create({
            data: {
              vecinoId: vecino.id,
              url: pago.referencia || 'bulk-pago',
              tipoArchivo: 'application/json',
              nombreArchivo: `pago-${pago.referencia || 'bulk'}`,
              estado: 'NUEVO',
              observaciones: `Pago cargado manualmente. Monto: $${pago.monto.toFixed(2)}`,
            },
          });
          
          comprobantes.push(comprobante);
        }
        
        return {
          success: true,
          data: {
            comprobantes,
            resumen: {
              total: data.pagos.length,
              creados: comprobantes.length,
            },
          },
        };
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          detalles: error.errors,
        });
      }
      
      fastify.log.error(error);
      return reply.status(500).send({
        error: error.message || 'Error al procesar los pagos',
      });
    }
  });
}
