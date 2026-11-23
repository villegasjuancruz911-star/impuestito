// Genera el PDF del presupuesto en el mismo celular (sin servidor)
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { addDays, budgetNumber, formatDate, formatMoney, formatQty, itemSubtotal } from './format.js'

const BLUE = rgb(88 / 255, 119 / 255, 80 / 255) // verde musgo #587750
const INK = rgb(28 / 255, 36 / 255, 25 / 255)
const GRAY = rgb(76 / 255, 90 / 255, 71 / 255)
const LINE = rgb(228 / 255, 233 / 255, 223 / 255)
const SOFT = rgb(233 / 255, 240 / 255, 228 / 255)
const WHITE = rgb(1, 1, 1)

export async function buildBudgetPdf(budget, profile) {
  const doc = await PDFDocument.create()
  doc.setTitle(`Presupuesto ${budgetNumber(budget.number)} · ${budget.client_name}`)
  doc.setAuthor(profile.business_name || profile.full_name || 'Impuestito')
  doc.setCreator('Impuestito')
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  // Solo caracteres que la fuente estándar puede dibujar
  const safe = (text, f = font) =>
    Array.from(String(text ?? '')).map((ch) => {
      try {
        f.encodeText(ch)
        return ch
      } catch {
        return '?'
      }
    }).join('')

  const W = 595.28
  const H = 841.89
  const M = 48
  let page = doc.addPage([W, H])
  let y = H

  const text = (s, x, yy, { size = 10, f = font, color = INK, align = 'left' } = {}) => {
    const str = safe(s, f)
    const w = f.widthOfTextAtSize(str, size)
    const xx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x
    page.drawText(str, { x: xx, y: yy, size, font: f, color })
  }
  const wrap = (s, maxW, size = 10, f = font) => {
    const words = safe(s, f).split(/\s+/)
    const lines = []
    let cur = ''
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w
      if (f.widthOfTextAtSize(t, size) <= maxW) cur = t
      else {
        if (cur) lines.push(cur)
        cur = w
      }
    }
    if (cur) lines.push(cur)
    return lines.length ? lines : ['']
  }

  // Encabezado
  const headerH = 112
  page.drawRectangle({ x: 0, y: H - headerH, width: W, height: headerH, color: BLUE })
  const business = profile.business_name || profile.full_name || 'Mi negocio'
  text(business, M, H - 52, { size: 20, f: bold, color: WHITE })
  const sub = [profile.trade, profile.phone].filter(Boolean).join(' · ')
  if (sub) text(sub, M, H - 72, { size: 11, color: WHITE })
  text('PRESUPUESTO', W - M, H - 50, { size: 12, f: bold, color: WHITE, align: 'right' })
  text(budgetNumber(budget.number), W - M, H - 70, { size: 16, f: bold, color: WHITE, align: 'right' })
  text(`Fecha: ${formatDate(budget.updated_at || budget.created_at)}`, W - M, H - 88, { size: 10, color: WHITE, align: 'right' })
  y = H - headerH - 32

  // Cliente y trabajo
  page.drawRectangle({ x: M, y: y - 58, width: W - 2 * M, height: 66, color: SOFT })
  text('CLIENTE', M + 14, y - 10, { size: 8, f: bold, color: GRAY })
  text(budget.client_name || '-', M + 14, y - 26, { size: 13, f: bold })
  if (budget.client_phone) text(`Tel.: ${budget.client_phone}`, M + 14, y - 42, { size: 10, color: GRAY })
  text('TRABAJO', W / 2, y - 10, { size: 8, f: bold, color: GRAY })
  wrap(budget.description || '-', W / 2 - M - 14, 11).slice(0, 3).forEach((ln, i) => text(ln, W / 2, y - 26 - i * 14, { size: 11 }))
  y -= 92

  // Tabla
  const cols = { desc: M, qty: W - M - 210, unit: W - M - 110, sub: W - M }
  const newPage = () => {
    page = doc.addPage([W, H])
    y = H - M
  }
  const header = (title) => {
    if (y < 140) newPage()
    text(title, M, y, { size: 12, f: bold, color: BLUE })
    y -= 18
    text('Descripción', cols.desc, y, { size: 9, f: bold, color: GRAY })
    text('Cantidad', cols.qty, y, { size: 9, f: bold, color: GRAY, align: 'right' })
    text('Precio unit.', cols.unit, y, { size: 9, f: bold, color: GRAY, align: 'right' })
    text('Subtotal', cols.sub, y, { size: 9, f: bold, color: GRAY, align: 'right' })
    y -= 8
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: LINE })
    y -= 16
  }
  const row = (it) => {
    const lines = wrap(it.description, cols.qty - M - 70, 10)
    const h = lines.length * 13 + 8
    if (y - h < 120) newPage()
    lines.forEach((ln, i) => text(ln, cols.desc, y - i * 13, { size: 10 }))
    text(`${formatQty(it.quantity)} ${it.unit || ''}`.trim(), cols.qty, y, { size: 10, align: 'right' })
    text(formatMoney(it.unit_price), cols.unit, y, { size: 10, align: 'right' })
    text(formatMoney(itemSubtotal(it)), cols.sub, y, { size: 10, f: bold, align: 'right' })
    y -= h
    page.drawLine({ start: { x: M, y: y + 8 }, end: { x: W - M, y: y + 8 }, thickness: 0.5, color: LINE })
    y -= 6
  }

  const materials = budget.items.filter((i) => i.kind === 'material')
  const labor = budget.items.filter((i) => i.kind === 'mano_obra')
  if (materials.length) {
    header('Materiales')
    materials.forEach(row)
    y -= 10
  }
  if (labor.length) {
    header('Mano de obra')
    labor.forEach(row)
    y -= 10
  }

  // Total
  if (y < 130) newPage()
  const total = budget.items.reduce((a, it) => a + itemSubtotal(it), 0)
  page.drawRectangle({ x: W / 2 - 10, y: y - 44, width: W / 2 + 10 - M, height: 52, color: BLUE })
  text('TOTAL', W / 2 + 6, y - 24, { size: 12, f: bold, color: WHITE })
  text(formatMoney(total), W - M - 14, y - 26, { size: 20, f: bold, color: WHITE, align: 'right' })
  y -= 74
  text(`Presupuesto válido hasta el ${formatDate(addDays(budget.updated_at || budget.created_at, budget.validity_days))} (${budget.validity_days} días).`, M, y, { size: 10, color: GRAY })

  // Pie
  doc.getPages().forEach((p, i, all) => {
    p.drawText(safe(`Hecho con Impuestito · Página ${i + 1} de ${all.length}`), { x: M, y: 28, size: 8, font, color: GRAY })
  })

  return doc.save()
}

export function pdfFileName(budget) {
  const client = (budget.client_name || 'cliente').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()
  return `presupuesto-${String(budget.number).padStart(4, '0')}-${client}.pdf`
}
