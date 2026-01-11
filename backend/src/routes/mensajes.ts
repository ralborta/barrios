import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { procesarTemplate, validarVariables } from '../services/template.service.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';
import { sendEmail } from '../services/email.service.js';

// Prisma se importa desde index.ts
declare module 'fastify' {
  interface FastifyInstance {
    prisma: any;
  }
}

const createMensajeSchema = z.object({
  vecinoId: z.string(),
  expensaId: z.string().optional().nullable(),
  canal: z.enum(['WHATSAPP', 'EMAIL']),
  tipo: z.enum([
    'EMISION',
    'RECORDATORIO_VENCIMIENTO',
    'SEGUIMIENTO',
    'CIERRE_MES',
    'MORA',
    'RECUPERO',
    'MANUAL',
  ]),
  contenido: z.string().optional(),
  asunto: z.string().optional(),
  templateId: z.string().optional(), // ID del template a usar
  whatsappId: z.string().optional(),
  emailId: z.string().optional(),
});

const enviarBatchSchema = z.object({
  vecinoIds: z.array(z.string()).min(1),
  canal: z.enum(['WHATSAPP', 'EMAIL']),
  tipo: z.enum([
    'EMISION',
    'RECORDATORIO_VENCIMIENTO',
    'SEGUIMIENTO',
    'CIERRE_MES',
    'MORA',
    'RECUPERO',
    'MANUAL',
  ]),
  contenido: z.string().optional(),
  asunto: z.string().optional(),
  templateId: z.string().optional(), // ID del template a usar
  expensaIds: z.record(z.string(), z.string()).optional(), // Mapa de vecinoId -> expensaId
});

const updateMensajeSchema = z.object({
  estado: z.enum(['ENVIADO', 'ENTREGADO', 'LEIDO', 'ERROR']).optional(),
  contenido: z.string().optional(),
});

export async function mensajesRoutes(fastify: FastifyInstance) {
  // Listar mensajes
  fastify.get('/api/mensajes', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest) => {
    const { vecinoId, expensaId, canal, tipo, estado } = request.query as {
      vecinoId?: string;
      expensaId?: string;
      canal?: string;
      tipo?: string;
      estado?: string;
    };
    
    const where: any = {};
    if (vecinoId) where.vecinoId = vecinoId;
    if (expensaId) where.expensaId = expensaId;
    if (canal) where.canal = canal;
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;

    const mensajes = await fastify.prisma.mensaje.findMany({
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: mensajes,
    };
  });

  // Obtener mensaje por ID
  fastify.get<{ Params: { id: string } }>('/api/mensajes/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;

    const mensaje = await fastify.prisma.mensaje.findUnique({
      where: { id },
      include: {
        vecino: true,
        expensa: {
          include: {
            periodo: {
              include: {
                country: true,
              },
            },
            vecino: true,
          },
        },
      },
    });

    if (!mensaje) {
      return reply.status(404).send({ error: 'Mensaje no encontrado' });
    }

    return {
      success: true,
      data: mensaje,
    };
  });

  // Obtener mensajes de una expensa
  fastify.get<{ Params: { expensaId: string } }>('/api/mensajes/expensa/:expensaId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { expensaId } = request.params;

    // Verificar que la expensa existe
    const expensa = await fastify.prisma.expensa.findUnique({
      where: { id: expensaId },
    });

    if (!expensa) {
      return reply.status(404).send({ error: 'Expensa no encontrada' });
    }

    const mensajes = await fastify.prisma.mensaje.findMany({
      where: { expensaId },
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
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      success: true,
      data: mensajes,
    };
  });

  // Crear/enviar mensaje
  fastify.post('/api/mensajes', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createMensajeSchema.parse(request.body);

      // Verificar que el vecino existe
      const vecino = await fastify.prisma.vecino.findUnique({
        where: { id: body.vecinoId },
      });

      if (!vecino) {
        return reply.status(404).send({ error: 'Vecino no encontrado' });
      }

      // Si hay expensaId, verificar que existe
      if (body.expensaId) {
        const expensa = await fastify.prisma.expensa.findUnique({
          where: { id: body.expensaId },
        });
        if (!expensa) {
          return reply.status(404).send({ error: 'Expensa no encontrada' });
        }
      }

      // Si hay templateId, cargar el template y procesarlo
      let contenidoFinal = body.contenido || '';
      let asuntoFinal = body.asunto || '';

      if (body.templateId) {
        const template = await fastify.prisma.templateMensaje.findUnique({
          where: { id: body.templateId },
        });

        if (!template) {
          return reply.status(404).send({ error: 'Template no encontrado' });
        }

        // Obtener datos del vecino y expensa para las variables
        const expensa = body.expensaId
          ? await fastify.prisma.expensa.findUnique({
              where: { id: body.expensaId },
              include: {
                periodo: {
                  include: {
                    country: true,
                  },
                },
              },
            })
          : null;

        // Construir contexto de variables
        const variables: any = {
          nombre: vecino.nombre,
          apellido: vecino.apellido,
          email: vecino.email,
          telefono: vecino.telefono || '',
        };

        if (expensa) {
          variables.monto = Number(expensa.monto);
          variables.fechaVencimiento = expensa.fechaVencimiento;
          variables.estado = expensa.estado;
          variables.periodo = `${expensa.periodo.mes}/${expensa.periodo.anio}`;
          variables.mes = expensa.periodo.mes;
          variables.anio = expensa.periodo.anio;
          variables.country = expensa.periodo.country.name;
        }

        // Procesar template
        contenidoFinal = procesarTemplate(template.contenido, variables);
        if (template.asunto) {
          asuntoFinal = procesarTemplate(template.asunto, variables);
        }
      }

      // Crear el mensaje
      const mensaje = await fastify.prisma.mensaje.create({
        data: {
          vecinoId: body.vecinoId,
          expensaId: body.expensaId || null,
          canal: body.canal,
          tipo: body.tipo,
          contenido: contenidoFinal,
          asunto: asuntoFinal || null,
          whatsappId: body.whatsappId || null,
          emailId: body.emailId || null,
          estado: 'ENVIADO',
        },
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
            },
          },
        },
      });

      // Enviar el mensaje según el canal
      try {
        if (body.canal === 'WHATSAPP' && vecino.telefono) {
          const whatsappResult = await sendWhatsAppMessage({
            to: vecino.telefono,
            message: contenidoFinal,
          });

          if (whatsappResult.success && whatsappResult.messageId) {
            await fastify.prisma.mensaje.update({
              where: { id: mensaje.id },
              data: {
                whatsappId: whatsappResult.messageId,
                estado: 'ENTREGADO',
              },
            });
          } else {
            await fastify.prisma.mensaje.update({
              where: { id: mensaje.id },
              data: { estado: 'ERROR' },
            });
          }
        } else if (body.canal === 'EMAIL' && vecino.email) {
          const emailResult = await sendEmail({
            to: vecino.email,
            subject: asuntoFinal || 'Mensaje del sistema',
            html: contenidoFinal.replace(/\n/g, '<br>'),
          });

          if (emailResult.success && emailResult.messageId) {
            await fastify.prisma.mensaje.update({
              where: { id: mensaje.id },
              data: {
                emailId: emailResult.messageId,
                estado: 'ENTREGADO',
              },
            });
          } else {
            await fastify.prisma.mensaje.update({
              where: { id: mensaje.id },
              data: { estado: 'ERROR' },
            });
          }
        }
      } catch (sendError: any) {
        fastify.log.error('Error enviando mensaje:', sendError);
        await fastify.prisma.mensaje.update({
          where: { id: mensaje.id },
          data: { estado: 'ERROR' },
        });
      }

      return {
        success: true,
        data: mensaje,
        message: 'Mensaje enviado correctamente',
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al crear mensaje' });
    }
  });

  // Actualizar mensaje (principalmente estado)
  fastify.put<{ Params: { id: string } }>('/api/mensajes/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const body = updateMensajeSchema.parse(request.body);

      const mensaje = await fastify.prisma.mensaje.update({
        where: { id },
        data: body,
        include: {
          vecino: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          expensa: {
            select: {
              id: true,
              monto: true,
              estado: true,
            },
          },
        },
      });

      return {
        success: true,
        data: mensaje,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al actualizar mensaje' });
    }
  });

  // Eliminar mensaje
  fastify.delete<{ Params: { id: string } }>('/api/mensajes/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      await fastify.prisma.mensaje.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Mensaje eliminado correctamente',
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al eliminar mensaje' });
    }
  });

  // Enviar mensajes en batch (a varios vecinos)
  fastify.post('/api/mensajes/batch', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = enviarBatchSchema.parse(request.body);

      // Cargar template si se proporciona
      let template = null;
      if (body.templateId) {
        template = await fastify.prisma.templateMensaje.findUnique({
          where: { id: body.templateId },
        });

        if (!template) {
          return reply.status(404).send({ error: 'Template no encontrado' });
        }
      }

      // Cargar todos los vecinos
      const vecinos = await fastify.prisma.vecino.findMany({
        where: {
          id: { in: body.vecinoIds },
        },
      });

      if (vecinos.length === 0) {
        return reply.status(400).send({ error: 'No se encontraron vecinos' });
      }

      // Cargar expensas si se proporcionan
      const expensaIds = body.expensaIds ? Object.values(body.expensaIds) : [];
      const expensasMap = new Map();
      if (expensaIds.length > 0) {
        const expensas = await fastify.prisma.expensa.findMany({
          where: { id: { in: expensaIds } },
          include: {
            periodo: {
              include: {
                country: true,
              },
            },
          },
        });
        expensas.forEach((e: any) => expensasMap.set(e.id, e));
      }

      const resultados = {
        total: vecinos.length,
        exitosos: 0,
        errores: 0,
        mensajes: [] as any[],
      };

      // Procesar cada vecino (enviar poco a poco)
      for (let i = 0; i < vecinos.length; i++) {
        const vecino = vecinos[i];
        try {
          // Determinar expensa para este vecino
          const expensaId = body.expensaIds?.[vecino.id] || null;
          const expensa = expensaId ? expensasMap.get(expensaId) : null;

          // Procesar contenido (template o contenido directo)
          let contenidoFinal = body.contenido || '';
          let asuntoFinal = body.asunto || '';

          if (template) {
            const variables: any = {
              nombre: vecino.nombre,
              apellido: vecino.apellido,
              email: vecino.email,
              telefono: vecino.telefono || '',
            };

            if (expensa) {
              variables.monto = Number(expensa.monto);
              variables.fechaVencimiento = expensa.fechaVencimiento;
              variables.estado = expensa.estado;
              variables.periodo = `${expensa.periodo.mes}/${expensa.periodo.anio}`;
              variables.mes = expensa.periodo.mes;
              variables.anio = expensa.periodo.anio;
              variables.country = expensa.periodo.country.name;
            }

            contenidoFinal = procesarTemplate(template.contenido, variables);
            if (template.asunto) {
              asuntoFinal = procesarTemplate(template.asunto, variables);
            }
          }

          // Crear mensaje
          const mensaje = await fastify.prisma.mensaje.create({
            data: {
              vecinoId: vecino.id,
              expensaId: expensaId,
              canal: body.canal,
              tipo: body.tipo,
              contenido: contenidoFinal,
              asunto: asuntoFinal || null,
              estado: 'ENVIADO',
            },
          });

          // Enviar mensaje (en background, poco a poco)
          // Usar setTimeout para espaciar los envíos
          setTimeout(async () => {
            try {
              if (body.canal === 'WHATSAPP' && vecino.telefono) {
                const whatsappResult = await sendWhatsAppMessage({
                  to: vecino.telefono,
                  message: contenidoFinal,
                });

                if (whatsappResult.success && whatsappResult.messageId) {
                  await fastify.prisma.mensaje.update({
                    where: { id: mensaje.id },
                    data: {
                      whatsappId: whatsappResult.messageId,
                      estado: 'ENTREGADO',
                    },
                  });
                } else {
                  await fastify.prisma.mensaje.update({
                    where: { id: mensaje.id },
                    data: { estado: 'ERROR' },
                  });
                }
              } else if (body.canal === 'EMAIL' && vecino.email) {
                const emailResult = await sendEmail({
                  to: vecino.email,
                  subject: asuntoFinal || 'Mensaje del sistema',
                  html: contenidoFinal.replace(/\n/g, '<br>'),
                });

                if (emailResult.success && emailResult.messageId) {
                  await fastify.prisma.mensaje.update({
                    where: { id: mensaje.id },
                    data: {
                      emailId: emailResult.messageId,
                      estado: 'ENTREGADO',
                    },
                  });
                } else {
                  await fastify.prisma.mensaje.update({
                    where: { id: mensaje.id },
                    data: { estado: 'ERROR' },
                  });
                }
              }
            } catch (sendError: any) {
              fastify.log.error('Error enviando mensaje batch:', sendError);
              await fastify.prisma.mensaje.update({
                where: { id: mensaje.id },
                data: { estado: 'ERROR' },
              });
            }
          }, resultados.exitosos * 1000); // Espaciar 1 segundo entre cada envío

          resultados.exitosos++;
          resultados.mensajes.push(mensaje);
        } catch (error: any) {
          resultados.errores++;
          fastify.log.error(`Error procesando vecino ${vecino.id}:`, error);
        }
      }

      return {
        success: true,
        data: resultados,
        message: `Procesando envío de ${resultados.exitosos} mensajes. Los mensajes se enviarán gradualmente.`,
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al enviar mensajes en batch' });
    }
  });
}
