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
  metodoPago: z.string().optional(),
  datosAdicionales: z.record(z.any()).optional(), // JSON con datos adicionales
  expensaId: z.string().optional(), // Si ya se conoce la expensa
});

const pagosBulkSchema = z.object({
  pagos: z.array(pagoSchema),
  autoConciliar: z.boolean().default(true),
});

export async function pagosRoutes(fastify: FastifyInstance) {
  // Listar pagos (para gestión y revisión)
  fastify.get('/api/pagos', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest) => {
    const { estado, vecinoId, expensaId, fechaDesde, fechaHasta } = request.query as {
      estado?: string;
      vecinoId?: string;
      expensaId?: string;
      fechaDesde?: string;
      fechaHasta?: string;
    };
    
    const where: any = {};
    if (estado) where.estado = estado;
    if (vecinoId) where.vecinoId = vecinoId;
    if (expensaId) where.expensaId = expensaId;
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
    }

    const pagos = await fastify.prisma.pago.findMany({
      where,
      include: {
        vecino: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
          },
        },
        expensa: {
          select: {
            id: true,
            monto: true,
            estado: true,
            fechaVencimiento: true,
            periodo: {
              select: {
                mes: true,
                anio: true,
                country: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        comprobante: {
          select: {
            id: true,
            estado: true,
            url: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: pagos,
    };
  });

  // Obtener pago por ID
  fastify.get<{ Params: { id: string } }>('/api/pagos/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;

    const pago = await fastify.prisma.pago.findUnique({
      where: { id },
      include: {
        vecino: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
          },
        },
        expensa: {
          include: {
            periodo: {
              include: {
                country: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        comprobante: true,
      },
    });

    if (!pago) {
      return reply.status(404).send({ error: 'Pago no encontrado' });
    }

    return {
      success: true,
      data: pago,
    };
  });

  // Revisar/conciliar manualmente un pago
  fastify.put<{ Params: { id: string } }>('/api/pagos/:id/revisar', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const body = z.object({
        accion: z.enum(['conciliar', 'rechazar', 'marcar_duplicado']),
        expensaId: z.string().optional(),
        observaciones: z.string().optional(),
      }).parse(request.body);

      const pago = await fastify.prisma.pago.findUnique({
        where: { id },
      });

      if (!pago) {
        return reply.status(404).send({ error: 'Pago no encontrado' });
      }

      const usuario = (request as any).user;
      
      if (body.accion === 'conciliar') {
        if (!body.expensaId) {
          return reply.status(400).send({ error: 'expensaId es requerido para conciliar' });
        }

        const expensa = await fastify.prisma.expensa.findUnique({
          where: { id: body.expensaId },
          include: {
            vecino: true,
          },
        });

        if (!expensa) {
          return reply.status(404).send({ error: 'Expensa no encontrada' });
        }

        // Actualizar pago
        const pagoActualizado = await fastify.prisma.pago.update({
          where: { id },
          data: {
            vecinoId: expensa.vecinoId,
            expensaId: expensa.id,
            estado: 'REVISADO',
            confianza: 100,
            coincidencia: 'MANUAL',
            razon: `Conciliado manualmente por ${usuario.email}`,
            revisadoPor: usuario.id,
            fechaRevision: new Date(),
            observaciones: body.observaciones,
          },
        });

        // Crear o actualizar comprobante
        let comprobante = await fastify.prisma.comprobante.findUnique({
          where: { pagoId: id },
        });

        if (!comprobante) {
          comprobante = await fastify.prisma.comprobante.create({
            data: {
              vecinoId: expensa.vecinoId,
              expensaId: expensa.id,
              pagoId: id,
              url: pago.referencia || 'pago-manual',
              tipoArchivo: 'application/json',
              nombreArchivo: `pago-${pago.referencia || 'manual'}`,
              estado: 'CONFIRMADO',
              observaciones: `Pago conciliado manualmente. ${body.observaciones || ''}`,
            },
          });
        } else {
          comprobante = await fastify.prisma.comprobante.update({
            where: { id: comprobante.id },
            data: {
              expensaId: expensa.id,
              estado: 'CONFIRMADO',
              observaciones: `Pago conciliado manualmente. ${body.observaciones || ''}`,
            },
          });
        }

        // Actualizar estado de expensa
        const montoExpensa = Number(expensa.monto);
        const montoPago = Number(pago.monto);
        const diferencia = Math.abs(montoExpensa - montoPago);

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
            pago: pagoActualizado,
            comprobante,
            expensa: {
              id: expensa.id,
              estado: diferencia < 0.01 ? 'CONFIRMADO' : expensa.estado,
            },
          },
        };
      } else if (body.accion === 'rechazar') {
        const pagoActualizado = await fastify.prisma.pago.update({
          where: { id },
          data: {
            estado: 'RECHAZADO',
            revisadoPor: usuario.id,
            fechaRevision: new Date(),
            observaciones: body.observaciones || 'Pago rechazado manualmente',
          },
        });

        return {
          success: true,
          data: pagoActualizado,
        };
      } else if (body.accion === 'marcar_duplicado') {
        const pagoActualizado = await fastify.prisma.pago.update({
          where: { id },
          data: {
            estado: 'DUPLICADO',
            revisadoPor: usuario.id,
            fechaRevision: new Date(),
            observaciones: body.observaciones || 'Pago marcado como duplicado',
          },
        });

        return {
          success: true,
          data: pagoActualizado,
        };
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al revisar pago' });
    }
  });

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
        
        // Crear registro de pago
        const pago = await fastify.prisma.pago.create({
          data: {
            monto: data.monto,
            fecha: data.fecha ? new Date(data.fecha) : new Date(),
            referencia: data.referencia,
            nombre: data.nombre,
            email: data.email,
            telefono: data.telefono,
            descripcion: data.descripcion,
            metodoPago: data.metodoPago,
            datosAdicionales: data.datosAdicionales ? JSON.stringify(data.datosAdicionales) : null,
            vecinoId: expensa.vecinoId,
            expensaId: expensa.id,
            estado: diferencia < 0.01 ? 'CONCILIADO' : 'REVISADO',
            confianza: diferencia < 0.01 ? 100 : 80,
            coincidencia: diferencia < 0.01 ? 'EXACTA' : 'APROXIMADA',
            razon: `Pago recibido por API. Diferencia: $${diferencia.toFixed(2)}`,
          },
        });
        
        // Crear comprobante
        const comprobante = await fastify.prisma.comprobante.create({
          data: {
            vecinoId: expensa.vecinoId,
            expensaId: expensa.id,
            pagoId: pago.id,
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
      
      // Crear registro de pago primero
      const pago = await fastify.prisma.pago.create({
        data: {
          monto: data.monto,
          fecha: data.fecha ? new Date(data.fecha) : new Date(),
          referencia: data.referencia,
          nombre: data.nombre,
          email: data.email,
          telefono: data.telefono,
          descripcion: data.descripcion,
          metodoPago: data.metodoPago,
          datosAdicionales: data.datosAdicionales ? JSON.stringify(data.datosAdicionales) : null,
          estado: 'PENDIENTE',
        },
      });
      
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
        // Actualizar pago como pendiente de revisión
        await fastify.prisma.pago.update({
          where: { id: pago.id },
          data: {
            estado: 'PENDIENTE',
            razon: resultado 
              ? `Confianza insuficiente (${resultado.confianza}%)`
              : 'No se pudo identificar vecino o expensa',
          },
        });
        
        return reply.status(400).send({
          error: 'No se pudo conciliar el pago automáticamente',
          requiereRevision: true,
          pagoId: pago.id,
          pago: pagoInfo,
        });
      }
      
      // Actualizar pago con resultado de conciliación
      await fastify.prisma.pago.update({
        where: { id: pago.id },
        data: {
          vecinoId: resultado.vecinoId,
          expensaId: resultado.expensaId,
          estado: 'CONCILIADO',
          confianza: resultado.confianza,
          coincidencia: resultado.coincidencia,
          razon: resultado.razon,
        },
      });
      
      // Crear comprobante
      const comprobante = await fastify.prisma.comprobante.create({
        data: {
          vecinoId: resultado.vecinoId,
          expensaId: resultado.expensaId,
          pagoId: pago.id,
          url: data.referencia || 'api-pago',
          tipoArchivo: 'application/json',
          nombreArchivo: `pago-${data.referencia || 'api'}`,
          estado: resultado.coincidencia === 'exacta' ? 'CONFIRMADO' : 'NUEVO',
          observaciones: `Pago conciliado automáticamente. ${resultado.razon}. Confianza: ${resultado.confianza}%`,
        },
      });
      
      // Actualizar pago con comprobante
      await fastify.prisma.pago.update({
        where: { id: pago.id },
        data: {
          comprobanteId: comprobante.id,
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
      
      // Crear registros de pago primero
      const pagosCreados = await Promise.all(
        data.pagos.map(p => 
          fastify.prisma.pago.create({
            data: {
              monto: p.monto,
              fecha: p.fecha ? new Date(p.fecha) : new Date(),
              referencia: p.referencia,
              nombre: p.nombre,
              email: p.email,
              telefono: p.telefono,
              descripcion: p.descripcion,
              metodoPago: p.metodoPago,
              datosAdicionales: p.datosAdicionales ? JSON.stringify(p.datosAdicionales) : null,
              estado: 'PENDIENTE',
            },
          })
        )
      );
      
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
        
        // Crear comprobantes y actualizar pagos para los exitosos
        const comprobantesCreados = [];
        
        // Mapear pagos creados por referencia para encontrar el correcto
        const pagosPorReferencia = new Map(pagosCreados.map(p => [p.referencia || '', p]));
        
        for (const resultado of resultados.exitosos) {
          // Encontrar el pago correspondiente por referencia
          const pagoCreado = pagosPorReferencia.get(resultado.pago.referencia || '') || pagosCreados.find(p => 
            Math.abs(Number(p.monto) - resultado.montoPago) < 0.01 &&
            (!resultado.pago.referencia || p.referencia === resultado.pago.referencia)
          );
          
          if (!pagoCreado) continue;
          
          // Actualizar pago con resultado de conciliación
          await fastify.prisma.pago.update({
            where: { id: pagoCreado.id },
            data: {
              vecinoId: resultado.vecinoId,
              expensaId: resultado.expensaId,
              estado: 'CONCILIADO',
              confianza: resultado.confianza,
              coincidencia: resultado.coincidencia,
              razon: resultado.razon,
            },
          });
          
          const comprobante = await fastify.prisma.comprobante.create({
            data: {
              vecinoId: resultado.vecinoId,
              expensaId: resultado.expensaId,
              pagoId: pagoCreado.id,
              url: resultado.pago.referencia || 'bulk-pago',
              tipoArchivo: 'application/json',
              nombreArchivo: `pago-${resultado.pago.referencia || 'bulk'}`,
              estado: resultado.coincidencia === 'exacta' ? 'CONFIRMADO' : 'NUEVO',
              observaciones: `Pago conciliado automáticamente. ${resultado.razon}. Confianza: ${resultado.confianza}%`,
            },
          });
          
          // Actualizar pago con comprobante
          await fastify.prisma.pago.update({
            where: { id: pagoCreado.id },
            data: {
              comprobanteId: comprobante.id,
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
          
          comprobantesCreados.push({ comprobante, conciliacion: resultado, pago: pagoCreado });
        }
        
        // Actualizar pagos pendientes
        const pagosConciliadosIds = new Set(comprobantesCreados.map(c => c.pago.id));
        for (const pendiente of resultados.pendientes) {
          // Encontrar el pago correspondiente
          const pagoPendiente = pagosCreados.find(p => 
            !pagosConciliadosIds.has(p.id) &&
            Math.abs(Number(p.monto) - pendiente.pago.monto) < 0.01 &&
            (!pendiente.pago.referencia || p.referencia === pendiente.pago.referencia)
          );
          
          if (pagoPendiente) {
            await fastify.prisma.pago.update({
              where: { id: pagoPendiente.id },
              data: {
                estado: 'PENDIENTE',
                razon: pendiente.razon,
              },
            });
          }
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
          
          // Crear registro de pago
          const pagoCreado = await fastify.prisma.pago.create({
            data: {
              monto: pago.monto,
              fecha: pago.fecha ? new Date(pago.fecha) : new Date(),
              referencia: pago.referencia,
              nombre: pago.nombre,
              email: pago.email,
              telefono: pago.telefono,
              descripcion: pago.descripcion,
              metodoPago: pago.metodoPago,
              datosAdicionales: pago.datosAdicionales ? JSON.stringify(pago.datosAdicionales) : null,
              vecinoId: vecino.id,
              estado: 'PENDIENTE',
              razon: 'Pago cargado sin conciliación automática',
            },
          });
          
          const comprobante = await fastify.prisma.comprobante.create({
            data: {
              vecinoId: vecino.id,
              pagoId: pagoCreado.id,
              url: pago.referencia || 'bulk-pago',
              tipoArchivo: 'application/json',
              nombreArchivo: `pago-${pago.referencia || 'bulk'}`,
              estado: 'NUEVO',
              observaciones: `Pago cargado manualmente. Monto: $${pago.monto.toFixed(2)}`,
            },
          });
          
          // Actualizar pago con comprobante
          await fastify.prisma.pago.update({
            where: { id: pagoCreado.id },
            data: {
              comprobanteId: comprobante.id,
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
