// Preferencias de accesibilidad: se guardan en este dispositivo y se aplican
// como atributos en <html>, que el CSS usa para cambiar colores y letra.
const KEY = 'presupuestito-a11y'

export const DEFAULTS = { dark: false, size: 'normal', bold: false, colorblind: false, legible: false }
export const SIZES = { normal: 1, grande: 1.15, 'muy-grande': 1.3 }

export function loadA11y() {
  try {
    // 'impuestito-a11y': clave anterior al cambio de nombre, para no perder lo que ya eligieron
    const saved = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem('impuestito-a11y') || '{}')
    const p = { ...DEFAULTS, ...saved }
    if (!(p.size in SIZES)) p.size = DEFAULTS.size
    return p
  } catch {
    return { ...DEFAULTS }
  }
}

export function applyA11y(p) {
  const el = document.documentElement
  el.dataset.theme = p.dark ? 'dark' : 'light'
  el.style.setProperty('--fs', SIZES[p.size] ?? 1)
  el.toggleAttribute('data-bold', !!p.bold)
  el.toggleAttribute('data-cb', !!p.colorblind)
  el.dataset.font = p.legible ? 'legible' : 'inter'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.dark ? '#141a12' : '#587750')
}

export function saveA11y(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* sin almacenamiento: se aplica igual */ }
  applyA11y(p)
}
