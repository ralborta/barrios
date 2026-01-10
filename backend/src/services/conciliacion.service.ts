/**
 * Servicio de Conciliación Automática con IA
 * 
 * Este servicio identifica automáticamente qué pago corresponde a qué vecino/expensa
 * usando técnicas de matching inteligente.
 */

interface PagoInfo {
  monto: number;
  fecha?: Date;
  referencia?: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  descripcion?: string;
  [key: string]: any; // Para campos adicionales del CSV
}

interface VecinoInfo {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
}

interface ExpensaInfo {
  id: string;
  vecinoId: string;
  monto: number;
  periodo: {
    mes: number;
    anio: number;
    country: {
      name: string;
    };
  };
  estado: string;
  fechaVencimiento: Date;
}

interface ConciliacionResult {
  expensaId: string;
  vecinoId: string;
  montoPago: number;
  montoExpensa: number;
  coincidencia: 'exacta' | 'aproximada' | 'manual';
  confianza: number; // 0-100
  razon: string;
}

/**
 * Calcula la similitud entre dos strings (0-1)
 */
function calcularSimilitud(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  // Levenshtein distance simplificado
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  
  let matches = 0;
  const minLen = Math.min(s1.length, s2.length);
  
  for (let i = 0; i < minLen; i++) {
    if (s1[i] === s2[i]) matches++;
  }
  
  // También verificar si uno contiene al otro
  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.max(matches / maxLen, 0.7);
  }
  
  return matches / maxLen;
}

/**
 * Normaliza un nombre para comparación
 */
function normalizarNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .trim();
}

/**
 * Compara nombres (permite variaciones)
 */
function compararNombres(nombre1: string, nombre2: string): number {
  const n1 = normalizarNombre(nombre1);
  const n2 = normalizarNombre(nombre2);
  
  // Comparación exacta
  if (n1 === n2) return 1;
  
  // Comparación por palabras
  const palabras1 = n1.split(/\s+/);
  const palabras2 = n2.split(/\s+/);
  
  let coincidencias = 0;
  let totalPalabras = Math.max(palabras1.length, palabras2.length);
  
  for (const p1 of palabras1) {
    for (const p2 of palabras2) {
      if (p1 === p2 || p1.includes(p2) || p2.includes(p1)) {
        coincidencias++;
        break;
      }
    }
  }
  
  return coincidencias / totalPalabras;
}

/**
 * Identifica el vecino más probable para un pago
 */
function identificarVecino(
  pago: PagoInfo,
  vecinos: VecinoInfo[]
): { vecino: VecinoInfo; confianza: number; razon: string } | null {
  let mejorMatch: { vecino: VecinoInfo; confianza: number; razon: string } | null = null;
  
  for (const vecino of vecinos) {
    let confianza = 0;
    const razones: string[] = [];
    
    // Match por email (100% confianza)
    if (pago.email && vecino.email.toLowerCase() === pago.email.toLowerCase()) {
      confianza = 100;
      razones.push('Email coincide exactamente');
      mejorMatch = { vecino, confianza, razon: razones.join(', ') };
      break;
    }
    
    // Match por teléfono (90% confianza)
    if (pago.telefono && vecino.telefono) {
      const tel1 = pago.telefono.replace(/\D/g, '');
      const tel2 = vecino.telefono.replace(/\D/g, '');
      if (tel1 === tel2 || tel1.endsWith(tel2) || tel2.endsWith(tel1)) {
        confianza = Math.max(confianza, 90);
        razones.push('Teléfono coincide');
      }
    }
    
    // Match por nombre (70-85% confianza)
    if (pago.nombre) {
      const nombreCompleto = `${vecino.nombre} ${vecino.apellido}`;
      const similitudNombre = compararNombres(pago.nombre, nombreCompleto);
      if (similitudNombre > 0.7) {
        confianza = Math.max(confianza, Math.round(similitudNombre * 85));
        razones.push(`Nombre similar (${Math.round(similitudNombre * 100)}%)`);
      }
    }
    
    // Match por referencia/descripción (50-70% confianza)
    if (pago.referencia || pago.descripcion) {
      const texto = `${pago.referencia || ''} ${pago.descripcion || ''}`.toLowerCase();
      const nombreCompleto = `${vecino.nombre} ${vecino.apellido}`.toLowerCase();
      
      if (texto.includes(nombreCompleto) || nombreCompleto.split(' ').some(p => texto.includes(p))) {
        confianza = Math.max(confianza, 60);
        razones.push('Referencia contiene nombre');
      }
    }
    
    if (confianza > 0 && (!mejorMatch || confianza > mejorMatch.confianza)) {
      mejorMatch = { vecino, confianza, razon: razones.join(', ') };
    }
  }
  
  return mejorMatch;
}

/**
 * Encuentra la expensa más probable para un pago
 */
function encontrarExpensa(
  pago: PagoInfo,
  vecinoId: string,
  expensas: ExpensaInfo[]
): { expensa: ExpensaInfo; confianza: number; razon: string } | null {
  // Filtrar expensas del vecino
  const expensasVecino = expensas.filter(e => e.vecinoId === vecinoId);
  
  if (expensasVecino.length === 0) {
    return null;
  }
  
  let mejorMatch: { expensa: ExpensaInfo; confianza: number; razon: string } | null = null;
  
  for (const expensa of expensasVecino) {
    let confianza = 0;
    const razones: string[] = [];
    
    // Comparar montos
    const montoExpensa = Number(expensa.monto);
    const montoPago = Number(pago.monto);
    const diferencia = Math.abs(montoExpensa - montoPago);
    const porcentajeDiferencia = (diferencia / montoExpensa) * 100;
    
    // Match exacto (100% confianza)
    if (diferencia < 0.01) {
      confianza = 100;
      razones.push('Monto coincide exactamente');
      mejorMatch = { expensa, confianza, razon: razones.join(', ') };
      break;
    }
    
    // Match aproximado (80-95% confianza)
    if (porcentajeDiferencia < 1) {
      confianza = Math.max(confianza, 95);
      razones.push(`Monto muy similar (diferencia: $${diferencia.toFixed(2)})`);
    } else if (porcentajeDiferencia < 5) {
      confianza = Math.max(confianza, 85);
      razones.push(`Monto similar (diferencia: $${diferencia.toFixed(2)})`);
    } else if (porcentajeDiferencia < 10) {
      confianza = Math.max(confianza, 70);
      razones.push(`Monto aproximado (diferencia: $${diferencia.toFixed(2)})`);
    }
    
    // Verificar fecha (si está disponible)
    if (pago.fecha && expensa.fechaVencimiento) {
      const diasDiferencia = Math.abs(
        (pago.fecha.getTime() - expensa.fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diasDiferencia <= 7) {
        confianza = Math.max(confianza, confianza * 1.1); // Aumentar confianza
        razones.push(`Fecha cercana al vencimiento (${Math.round(diasDiferencia)} días)`);
      }
    }
    
    // Preferir expensas pendientes
    if (expensa.estado === 'PENDIENTE' || expensa.estado === 'PAGO_INFORMADO') {
      confianza = Math.max(confianza, confianza * 1.05);
      razones.push('Expensa pendiente de pago');
    }
    
    if (confianza > 0 && (!mejorMatch || confianza > mejorMatch.confianza)) {
      mejorMatch = { expensa, confianza, razon: razones.join(', ') };
    }
  }
  
  return mejorMatch;
}

/**
 * Concilia un pago con una expensa automáticamente
 */
export async function conciliarPago(
  pago: PagoInfo,
  vecinos: VecinoInfo[],
  expensas: ExpensaInfo[]
): Promise<ConciliacionResult | null> {
  // Paso 1: Identificar vecino
  const matchVecino = identificarVecino(pago, vecinos);
  
  if (!matchVecino || matchVecino.confianza < 50) {
    return null; // No se puede identificar el vecino con suficiente confianza
  }
  
  // Paso 2: Encontrar expensa
  const matchExpensa = encontrarExpensa(pago, matchVecino.vecino.id, expensas);
  
  if (!matchExpensa) {
    return null; // No se encontró expensa para este vecino
  }
  
  // Paso 3: Determinar tipo de coincidencia
  const montoExpensa = Number(matchExpensa.expensa.monto);
  const montoPago = Number(pago.monto);
  const diferencia = Math.abs(montoExpensa - montoPago);
  
  let coincidencia: 'exacta' | 'aproximada' | 'manual';
  if (diferencia < 0.01) {
    coincidencia = 'exacta';
  } else if (diferencia < montoExpensa * 0.1) {
    coincidencia = 'aproximada';
  } else {
    coincidencia = 'manual';
  }
  
  // Calcular confianza total (promedio ponderado)
  const confianzaTotal = Math.round(
    (matchVecino.confianza * 0.4) + (matchExpensa.confianza * 0.6)
  );
  
  return {
    expensaId: matchExpensa.expensa.id,
    vecinoId: matchVecino.vecino.id,
    montoPago,
    montoExpensa,
    coincidencia,
    confianza: confianzaTotal,
    razon: `${matchVecino.razon}. ${matchExpensa.razon}`,
  };
}

/**
 * Procesa múltiples pagos y los concilia automáticamente
 */
export async function conciliarPagos(
  pagos: PagoInfo[],
  vecinos: VecinoInfo[],
  expensas: ExpensaInfo[]
): Promise<{
  exitosos: Array<ConciliacionResult & { pago: PagoInfo }>;
  pendientes: Array<{ pago: PagoInfo; razon: string }>;
}> {
  const exitosos: Array<ConciliacionResult & { pago: PagoInfo }> = [];
  const pendientes: Array<{ pago: PagoInfo; razon: string }> = [];
  
  for (const pago of pagos) {
    const resultado = await conciliarPago(pago, vecinos, expensas);
    
    if (resultado && resultado.confianza >= 70) {
      exitosos.push({ ...resultado, pago });
    } else {
      pendientes.push({
        pago,
        razon: resultado
          ? `Confianza insuficiente (${resultado.confianza}%)`
          : 'No se pudo identificar vecino o expensa',
      });
    }
  }
  
  return { exitosos, pendientes };
}
