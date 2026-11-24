// Materiales frecuentes: se guardan en este celular al guardar un presupuesto
const KEY = 'presupuestito-items'
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }

export function rememberItems(items) {
  const db = read()
  for (const it of items) db[it.description.trim().toLowerCase()] = { description: it.description.trim(), unit: it.unit, unit_price: it.unit_price, kind: it.kind }
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* sin almacenamiento */ }
}
export const frequentItems = (kind) => Object.values(read()).filter((i) => i.kind === kind)
export const findItem = (desc) => read()[desc.trim().toLowerCase()]
