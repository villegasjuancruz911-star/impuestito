// Formato de importes, fechas y cálculos de presupuesto

const money = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 0 })

export function formatMoney(value) {
  const n = Number(value) || 0
  return `$ ${money.format(Math.round(n * 100) / 100)}`
}

export function formatQty(value) {
  return money.format(Number(value) || 0)
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function relativeDay(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((start(today) - start(d)) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  return formatDate(iso)
}

export function addDays(iso, days) {
  const d = new Date(iso || Date.now())
  d.setDate(d.getDate() + Number(days || 0))
  return d.toISOString()
}

export function budgetNumber(n) {
  return `N.º ${String(n || 0).padStart(4, '0')}`
}

export function itemSubtotal(item) {
  return (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
}

export function itemsTotal(items) {
  return (items || []).reduce((acc, it) => acc + itemSubtotal(it), 0)
}

// Convierte lo que escribe el usuario ("15.500", "15500,50") en número
export function parseAmount(text) {
  if (typeof text === 'number') return text
  const clean = String(text || '').replace(/\s|\$/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(clean)
  return Number.isFinite(n) ? n : NaN
}

export const UNITS = ['u', 'm²', 'm', 'kg', 'L', 'h', 'día', 'global']

export const STATUS_LABEL = { borrador: 'Borrador', enviado: 'Enviado', aceptado: 'Aceptado' }

export const TRADES = ['Pintor', 'Soldador', 'Durlero', 'Electricista', 'Albañil', 'Plomero', 'Otro']
