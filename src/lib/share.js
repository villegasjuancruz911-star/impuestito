// Compartir o descargar el PDF del presupuesto
import { buildBudgetPdf, pdfFileName } from './pdf.js'
import { budgetNumber, formatMoney } from './format.js'

// Número argentino → formato internacional para WhatsApp (549 + área + número)
export function whatsappNumber(phone) {
  let d = String(phone || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('549')) return d
  if (d.startsWith('54')) return '549' + d.slice(2)
  if (d.startsWith('0')) d = d.slice(1)
  d = d.replace(/^(\d{2,4})15/, '$1')
  return d.length === 10 ? '549' + d : d
}

export function shareMessage(budget, profile) {
  const who = profile.business_name || profile.full_name || ''
  return `Hola ${budget.client_name || ''}! Te paso el presupuesto ${budgetNumber(budget.number)} por "${budget.description}": total ${formatMoney(budget.total)}.${who ? ` ${who}.` : ''}`
}

async function pdfFile(budget, profile) {
  const bytes = await buildBudgetPdf(budget, profile)
  return new File([bytes], pdfFileName(budget), { type: 'application/pdf' })
}

export function download(file) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

// Devuelve 'shared' | 'cancelled' | 'downloaded'
export async function sharePdf(budget, profile, { channel = 'system' } = {}) {
  const file = await pdfFile(budget, profile)
  const text = shareMessage(budget, profile)

  if (channel === 'system' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name, text })
      return 'shared'
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled'
    }
  }

  // Sin menú de compartir con archivos (por ejemplo, en la compu): descargar y abrir WhatsApp con el mensaje
  download(file)
  if (channel === 'whatsapp' || channel === 'system') {
    const num = whatsappNumber(budget.client_phone)
    const url = `https://wa.me/${num}?text=${encodeURIComponent(text + ' (Te adjunto el PDF.)')}`
    window.open(url, '_blank', 'noopener')
  }
  if (channel === 'email') {
    window.location.href = `mailto:?subject=${encodeURIComponent(`Presupuesto ${budgetNumber(budget.number)}`)}&body=${encodeURIComponent(text)}`
  }
  return 'downloaded'
}

export async function downloadPdf(budget, profile) {
  download(await pdfFile(budget, profile))
}
