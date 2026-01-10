/**
 * Jobs Programados - Sistema de Cronjobs
 * 
 * Este módulo exporta todos los jobs programados que se ejecutan periódicamente
 */

export { enviarRecordatoriosVencimiento } from './recordatorios.job.js';
export { cambiarEstadoAMora } from './cambio-estado.job.js';
export { enviarSeguimientos } from './seguimiento.job.js';

/**
 * Ejecuta todos los jobs programados
 * 
 * Esta función debe ser llamada periódicamente (ej: cada hora) por un cronjob
 * o servicio de scheduling como node-cron, agenda, etc.
 */
export async function ejecutarTodosLosJobs() {
  const resultados = {
    recordatorios: { enviados: 0, errores: 0 },
    cambioEstado: { actualizadas: 0, notificaciones: 0, errores: 0 },
    seguimientos: { enviados: 0, errores: 0 },
  };
  
  try {
    // Ejecutar recordatorios
    const { enviarRecordatoriosVencimiento } = await import('./recordatorios.job.js');
    resultados.recordatorios = await enviarRecordatoriosVencimiento();
  } catch (error: any) {
    console.error('Error ejecutando job de recordatorios:', error);
    resultados.recordatorios.errores++;
  }
  
  try {
    // Ejecutar cambio de estado
    const { cambiarEstadoAMora } = await import('./cambio-estado.job.js');
    resultados.cambioEstado = await cambiarEstadoAMora();
  } catch (error: any) {
    console.error('Error ejecutando job de cambio de estado:', error);
    resultados.cambioEstado.errores++;
  }
  
  try {
    // Ejecutar seguimientos
    const { enviarSeguimientos } = await import('./seguimiento.job.js');
    resultados.seguimientos = await enviarSeguimientos();
  } catch (error: any) {
    console.error('Error ejecutando job de seguimientos:', error);
    resultados.seguimientos.errores++;
  }
  
  return resultados;
}
