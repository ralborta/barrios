/**
 * Job de Recordatorios Automáticos
 * 
 * Envía recordatorios de vencimiento a los vecinos según configuración del período
 */

import { PrismaClient } from '@prisma/client';
import { sendRecordatorioWhatsApp } from '../services/whatsapp.service.js';
import { sendRecordatorioEmail } from '../services/email.service.js';

const prisma = new PrismaClient();

interface ConfiguracionRecordatorio {
  diasAntes: number; // Días antes del vencimiento para enviar recordatorio
  frecuencia: number; // Cada cuántos días enviar recordatorio
  canales: ('WHATSAPP' | 'EMAIL')[];
}

/**
 * Envía recordatorios de vencimiento
 * Si no se proporciona config, usa la configuración del período
 */
export async function enviarRecordatoriosVencimiento(
  config?: ConfiguracionRecordatorio
): Promise<{ enviados: number; errores: number }> {
  // Si no hay config, usar valores por defecto
  const defaultConfig: ConfiguracionRecordatorio = {
    diasAntes: 3,
    frecuencia: 1,
    canales: ['WHATSAPP'],
  };
  
  const finalConfig = config || defaultConfig;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const fechaLimite = new Date(hoy);
  fechaLimite.setDate(fechaLimite.getDate() + finalConfig.diasAntes);
  
  // Buscar expensas que vencen en los próximos días
  const expensas = await prisma.expensa.findMany({
    where: {
      estado: 'PENDIENTE',
      fechaVencimiento: {
        gte: hoy,
        lte: fechaLimite,
      },
      // Solo expensas que no han recibido recordatorio recientemente
      OR: [
        { fechaUltimoSeguimiento: null },
        {
          fechaUltimoSeguimiento: {
            lte: new Date(hoy.getTime() - finalConfig.frecuencia * 24 * 60 * 60 * 1000),
          },
        },
      ],
      // Solo expensas de períodos con recordatorios habilitados
      periodo: {
        habilitarRecordatorios: true,
      },
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
    const diasRestantes = Math.ceil(
      (expensa.fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Usar configuración del período si está disponible
    const periodoConfig = {
      diasAntes: expensa.periodo.diasRecordatorioAntes || finalConfig.diasAntes,
      canales: expensa.periodo.canalesRecordatorio?.split(',') as ('WHATSAPP' | 'EMAIL')[] || finalConfig.canales,
    };
    
    if (diasRestantes > periodoConfig.diasAntes) {
      continue; // Aún no es momento de enviar
    }
    
    try {
      // Enviar por WhatsApp
      if (periodoConfig.canales.includes('WHATSAPP') && expensa.vecino.telefono) {
        const resultado = await sendRecordatorioWhatsApp(
          expensa.vecino.telefono,
          `${expensa.vecino.nombre} ${expensa.vecino.apellido}`,
          Number(expensa.monto),
          expensa.fechaVencimiento,
          diasRestantes
        );
        
        if (resultado.success) {
          // Guardar mensaje
          await prisma.mensaje.create({
            data: {
              vecinoId: expensa.vecinoId,
              expensaId: expensa.id,
              canal: 'WHATSAPP',
              tipo: 'RECORDATORIO_VENCIMIENTO',
              contenido: `Recordatorio de vencimiento - ${diasRestantes} días restantes`,
              whatsappId: resultado.messageId,
              estado: 'ENVIADO',
            },
          });
        }
      }
      
      // Enviar por Email
      if (periodoConfig.canales.includes('EMAIL')) {
        const resultado = await sendRecordatorioEmail(
          expensa.vecino.email,
          `${expensa.vecino.nombre} ${expensa.vecino.apellido}`,
          Number(expensa.monto),
          expensa.fechaVencimiento,
          diasRestantes
        );
        
        if (resultado.success) {
          // Guardar mensaje
          await prisma.mensaje.create({
            data: {
              vecinoId: expensa.vecinoId,
              expensaId: expensa.id,
              canal: 'EMAIL',
              tipo: 'RECORDATORIO_VENCIMIENTO',
              contenido: `Recordatorio de vencimiento - ${diasRestantes} días restantes`,
              emailId: resultado.messageId,
              asunto: `Recordatorio: Expensas vencen en ${diasRestantes} días`,
              estado: 'ENVIADO',
            },
          });
        }
      }
      
      // Actualizar fecha de último seguimiento
      await prisma.expensa.update({
        where: { id: expensa.id },
        data: {
          fechaUltimoSeguimiento: new Date(),
          proximoSeguimiento: new Date(hoy.getTime() + finalConfig.frecuencia * 24 * 60 * 60 * 1000),
          contadorSeguimientos: {
            increment: 1,
          },
        },
      });
      
      enviados++;
    } catch (error: any) {
      console.error(`Error enviando recordatorio para expensa ${expensa.id}:`, error);
      errores++;
    }
  }
  
  return { enviados, errores };
}
