/**
 * Preferencia de tema del sitio público.
 * Solo localStorage + prefers-color-scheme; sin PII.
 */

export type Tema = 'dia' | 'noche'

export const CLAVE_TEMA = 'tema'

export function esTema(valor: unknown): valor is Tema {
  return valor === 'dia' || valor === 'noche'
}

/**
 * Resuelve el tema inicial: lo guardado manda; si no hay, la preferencia del sistema.
 */
export function resolverTemaInicial(
  guardado: string | null | undefined,
  prefiereOscuro: boolean,
): Tema {
  if (esTema(guardado)) return guardado
  return prefiereOscuro ? 'noche' : 'dia'
}

/** Color de chrome del navegador según el tema. */
export function colorTemaMeta(tema: Tema): string {
  return tema === 'noche' ? '#0a1522' : '#f1f4f8'
}

/**
 * Script inline: corre antes del primer pintado para evitar destello.
 * Sin dependencias; se inyecta en el layout raíz.
 */
export function snippetTemaSinDestello(): string {
  return `(function(){try{var k=${JSON.stringify(CLAVE_TEMA)};var g=localStorage.getItem(k);var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=(g==='dia'||g==='noche')?g:(d?'noche':'dia');document.documentElement.setAttribute('data-tema',t);var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.setAttribute('name','theme-color');document.head.appendChild(m);}m.setAttribute('content',t==='noche'?'#0a1522':'#f1f4f8');}catch(e){document.documentElement.setAttribute('data-tema','dia');}})();`
}
