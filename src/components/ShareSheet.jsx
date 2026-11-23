// Hoja inferior "Compartir con…": WhatsApp, email, guardar el PDF o copiar el mensaje
import { useState } from 'react'
import { useApp } from '../state.jsx'
import { downloadPdf, sharePdf, shareMessage } from '../lib/share.js'
import { Button, Icon, Sheet } from './ui.jsx'

export function ShareSheet({ open, onClose, budget, profile, onShared }) {
  const { backend, notify } = useApp()
  const [busy, setBusy] = useState('')

  const markSent = async () => {
    if (budget.status === 'borrador') {
      await backend.setBudgetStatus(budget.id, 'enviado')
      onShared && onShared()
    }
  }

  const run = async (key, fn) => {
    setBusy(key)
    try {
      await fn()
    } catch (e) {
      notify(e.message || 'No se pudo compartir.')
    }
    setBusy('')
  }

  const options = [
    ['whatsapp', 'WhatsApp', 'whatsapp', 'var(--ok-bg)', 'var(--ok)', async () => {
      const res = await sharePdf(budget, profile, { channel: 'whatsapp' })
      if (res !== 'cancelled') {
        await markSent()
        onClose()
        if (res === 'downloaded') notify('Descargamos el PDF: adjuntalo en el chat de WhatsApp.')
      }
    }],
    ['email', 'Email', 'mail', 'var(--primary-subtle)', 'var(--primary)', async () => {
      await sharePdf(budget, profile, { channel: 'email' })
      await markSent()
      onClose()
    }],
    ['guardar', 'Guardar', 'download', 'var(--primary-subtle)', 'var(--primary)', async () => {
      await downloadPdf(budget, profile)
      notify('PDF descargado')
      onClose()
    }],
    ['copiar', 'Copiar', 'copy', 'var(--primary-subtle)', 'var(--primary)', async () => {
      await navigator.clipboard.writeText(shareMessage(budget, profile))
      notify('Mensaje copiado')
      onClose()
    }],
  ]

  return (
    <Sheet open={open} onClose={onClose} title="Compartir con…">
      <div className="share-grid">
        {options.map(([key, label, icon, bg, color, fn]) => (
          <button key={key} onClick={() => run(key, fn)} disabled={!!busy}>
            <span className="round" style={{ width: 56, height: 56, background: bg }}>
              {busy === key ? <span className="spinner dark" style={{ width: 22, height: 22 }} /> : <Icon name={icon} color={color} size={26} />}
            </span>
            {label}
          </button>
        ))}
      </div>
      <Button variant="text" onClick={onClose}>Cancelar</Button>
    </Sheet>
  )
}
