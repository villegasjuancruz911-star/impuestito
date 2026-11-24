// Router mínimo por hash (#/ruta), suficiente para una PWA de una sola página
import { useEffect, useState } from 'react'

const routes = [
  '/onboarding', '/bienvenida', '/ingresar', '/registro', '/recuperar', '/nueva-contrasena', '/cuenta-verificada',
  '/inicio', '/presupuestos', '/presupuesto/:id', '/nuevo', '/editar/:id', '/listo/:id',
  '/perfil', '/perfil/editar', '/perfil/accesibilidad', '/clientes',
]

let lastDirection = 'forward'
let depth = 0

export function parseHash(hash = window.location.hash) {
  const [path, query = ''] = hash.replace(/^#/, '').split('?')
  const clean = path || '/'
  for (const pattern of routes) {
    const p = pattern.split('/')
    const c = clean.split('/')
    if (p.length !== c.length) continue
    const params = {}
    const ok = p.every((seg, i) => {
      if (seg.startsWith(':')) {
        params[seg.slice(1)] = decodeURIComponent(c[i])
        return true
      }
      return seg === c[i]
    })
    if (ok) return { pattern, path: clean, params, query: Object.fromEntries(new URLSearchParams(query)) }
  }
  return { pattern: null, path: clean, params: {}, query: Object.fromEntries(new URLSearchParams(query)) }
}

export function navigate(path, { replace = false } = {}) {
  lastDirection = 'forward'
  if (replace) {
    window.location.replace('#' + path)
  } else {
    depth += 1
    window.location.hash = path
  }
}

export function goBack(fallback = '/inicio') {
  lastDirection = 'back'
  if (depth > 0) {
    depth -= 1
    window.history.back()
  } else {
    window.location.replace('#' + fallback)
  }
}

export function useRoute() {
  const [route, setRoute] = useState(() => ({ ...parseHash(), direction: 'forward' }))
  useEffect(() => {
    const onChange = () => {
      setRoute({ ...parseHash(), direction: lastDirection })
      lastDirection = 'forward'
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
