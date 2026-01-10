/**
 * Job de Seguimiento Automático
 * 
 * Envía seguimientos periódicos a expensas en mora o sin respuesta
 */

import { PrismaClient } from '@prisma/client';
import { sendMoraWhatsApp } from '../services/whatsapp.service.js';
import { sendMoraEmail } from '../services/email.service.js';

const prisma = new PrismaClient();

interface ConfiguracionSeguimiento {
  frecuencia: number; // Cada cuántos días enviar seguimiento
  estados: string[]; // Estados a los que aplicar seguimiento
  maxSeguimientos: number; // Máximo de seguimientos antes de cambiar estado
  canales: ('WHATSAPP' | 'EMAIL')[];
}

/**
 * Envía seguimientos a expensas en mora o sin respuesta
 */
export async function enviarSeguimientos(
  config: ConfiguracionSeguimiento = {
    frecuencia: 7, // Cada 7 días
    estados: ['EN_MORA', 'SIN_RESPUESTA'],
    maxSeguimientos: 3,
    canales: ['WHATSAPP'],
  }
): Promise<{ enviados: number; errores: number }> {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const fechaLimite = new Date(hoy);
  fechaLimite.setDate(fechaLimite.getDate() - config.frecuencia);
  
  // Buscar expensas que necesitan seguimiento
  const expensas = await prisma.expensa.findMany({
    where: {
      estado: {
        in: config.estados,
      },
      contadorSeguimientos: {
        lt: config.maxSeguimientos,
      },
      OR: [
        { proximoSeguimiento: null },
        {
          proximoSeguimiento: {
            lte: hoy,
          },
        },
      ],
    },
    include: {
      vecino: {
        include: {
          country: true,
        },
      },
      periodo: {
        include: {
          country: true,
        },
      },
    },
  });
  
  let enviados = 0;
  let errores = 0;
  
  for (const expensa of expensas) {
    try {
      const mesesMora = expensa.mesMora || 1;
      
      // Enviar por WhatsApp
      if (config.canales.includes('WHATSAPP') && expensa.vecino.telefono) {
        const resultado = await sendMoraWhatsApp(
          expensa.vecino.telefono,
          `${expensa.vecino.nombre} ${expensa.vecino.apellido}`,
          Number(expensa.monto),
          mesesMora
        );
        
        if (resultado.success) {
          await prisma.mensaje.create({
            data: {
              vecinoId: expensa.vecinoId,
              expensaId: expensa.id,
              canal: 'WHATSAPP',
              tipo: 'SEGUIMIENTO',
              contenido: `Seguimiento automático - Mes ${mesesMora} de mora`,
              whatsappId: resultado.messageId,
              estado: 'ENVIADO',
            },
          });
        }
      }
      
      // Enviar por Email
      if (config.canales.includes('EMAIL')) {
        const resultado = await sendMoraEmail(
          expensa.vecino.email,
          `${expensa.vecino.nombre} ${expensa.vecino.apellido}`,
          Number(expensa.monto),
          mesesMora
        );
        
        if (resultado.success) {
          await prisma.mensaje.create({
            data: {
              vecinoId: expensa.vecinoId,
              expensaId: expensa.id,
              canal: 'EMAIL',
              tipo: 'SEGUIMIENTO',
              contenido: `Seguimiento automático - Mes ${mesesMora} de mora`,
              emailId: resultado.messageId,
              asunto: `Seguimiento: Expensas en Mora - Mes ${mesesMora}`,
              estado: 'ENVIADO',
            },
          });
        }
      }
      
      // Actualizar seguimiento
      const proximoSeguimiento = new Date(hoy);
      proximoSeguimiento.setDate(proximoSeguimiento.getDate() + config.frecuencia);
      
      await prisma.expensa.update({
        where: { id: expensa.id },
        data: {
          fechaUltimoSeguimiento: new Date(),
          proximoSeguimiento,
          contadorSeguimientos: {
            increment: 1,
          },
          // Si alcanzó el máximo, cambiar a EN_RECUPERO
          ...(expensa.contadorSeguimientos + 1 >= config.maxSeguimientos && {
            estado: 'EN_RECUPERO',
          }),
        },
      });
      
      enviados++;
    } catch (error: any) {
      console.error(`Error enviando seguimiento para expensa ${expensa.id}:`, error);
      errores++;
    }
  }
  
  return { enviados, errores };
}
