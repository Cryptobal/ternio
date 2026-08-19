/**
 * Preferencia de tema del sitio público.
 * Solo localStorage; sin PII. Día por defecto si no hay preferencia guardada.
 */

export type Tema = 'dia' | 'noche'

export const CLAVE_TEMA = 'tema'

export function esTema(valor: unknown): valor is Tema {
  return valor === 'dia' || valor === 'noche'
}

/**
 * Resuelve el tema inicial: lo guardado manda; si no hay, día.
 * El segundo argumento se ignora (compatibilidad con llamadores previos).
 */
export function resolverTemaInicial(
  guardado: string | null | undefined,
  // Preferencia del sistema: ya no se usa; se mantiene la firma.
  prefiereOscuro?: boolean,
): Tema {
  void prefiereOscuro
  if (esTema(guardado)) return guardado
  return 'dia'
}

/** Color de chrome del navegador según el tema. */
export function colorTemaMeta(tema: Tema): string {
  return tema === 'noche' ? '#0a1522' : '#f1f4f8'
}

/**
 * Script inline: corre antes del primer pintado para evitar destello.
 * Sin dependencias; se inyecta en el layout raíz.
 * No consulta prefers-color-scheme: sin guardado → día.
 */
export function snippetTemaSinDestello(): string {
  return `(function(){try{var k=${JSON.stringify(CLAVE_TEMA)};var g=localStorage.getItem(k);var t=(g==='dia'||g==='noche')?g:'dia';document.documentElement.setAttribute('data-tema',t);var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.setAttribute('name','theme-color');document.head.appendChild(m);}m.setAttribute('content',t==='noche'?'#0a1522':'#f1f4f8');}catch(e){document.documentElement.setAttribute('data-tema','dia');}})();`
}
