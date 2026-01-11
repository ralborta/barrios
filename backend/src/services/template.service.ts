/**
 * Servicio para procesar templates de mensajes con variables dinámicas
 */

interface VariablesContext {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  monto?: number | string;
  fechaVencimiento?: string | Date;
  periodo?: string;
  mes?: number;
  anio?: number;
  country?: string;
  estado?: string;
  [key: string]: any; // Para variables adicionales
}

/**
 * Procesa un template reemplazando las variables con valores reales
 */
export function procesarTemplate(
  template: string,
  variables: VariablesContext
): string {
  let resultado = template;

  // Reemplazar variables en formato {variable}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    let valorFormateado = value;

    // Formatear valores según el tipo
    if (value instanceof Date) {
      valorFormateado = value.toLocaleDateString('es-AR');
    } else if (typeof value === 'number') {
      // Si es un monto, formatear como moneda
      if (key.toLowerCase().includes('monto') || key.toLowerCase().includes('precio')) {
        valorFormateado = new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
        }).format(value);
      } else {
        valorFormateado = value.toString();
      }
    } else if (value === null || value === undefined) {
      valorFormateado = '';
    } else {
      valorFormateado = String(value);
    }

    resultado = resultado.replace(regex, valorFormateado);
  }

  // Limpiar variables no reemplazadas (opcional - mostrar como {variable} o vacío)
  resultado = resultado.replace(/\{[^}]+\}/g, '');

  return resultado.trim();
}

/**
 * Extrae las variables usadas en un template
 */
export function extraerVariables(template: string): string[] {
  const regex = /\{([^}]+)\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    const variable = match[1].trim();
    if (variable && !variables.includes(variable)) {
      variables.push(variable);
    }
  }

  return variables;
}

/**
 * Valida que todas las variables requeridas estén presentes
 */
export function validarVariables(
  template: string,
  variables: VariablesContext
): { valido: boolean; faltantes: string[] } {
  const requeridas = extraerVariables(template);
  const faltantes = requeridas.filter(v => !(v in variables) || variables[v] === undefined || variables[v] === null);

  return {
    valido: faltantes.length === 0,
    faltantes,
  };
}
