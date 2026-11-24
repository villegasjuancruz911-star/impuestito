// Componentes del Kit UI de Presupuestito
import { useEffect, useRef, useState } from 'react'
import { goBack, navigate } from '../lib/router.js'
import { STATUS_LABEL, formatMoney, formatQty, itemSubtotal, relativeDay } from '../lib/format.js'

const PATHS = {
  arrow_back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  search: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  description: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  share: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  check_circle: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  download: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  chevron_right: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
  delete: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  visibility: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
  visibility_off: 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z',
  group: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  help: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
  logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  mail: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  accessibility: 'M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z',
  error: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
  whatsapp: 'M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.1c-.25.69-1.45 1.33-2 1.38-.53.05-1.03.25-3.46-.72-2.92-1.15-4.79-4.15-4.93-4.34-.14-.19-1.17-1.56-1.17-2.97 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36l.55.01c.18.01.41-.07.65.5.25.59.84 2.04.91 2.19.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.29.15.46.12.63-.07.17-.19.73-.85.92-1.15.19-.29.39-.24.65-.15.26.1 1.67.79 1.96.93.29.15.48.22.55.34.07.13.07.71-.18 1.4z',
}

export function Icon({ name, size = 24, color = 'currentColor', title }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      <path d={PATHS[name]} fill={color} />
    </svg>
  )
}

export function Screen({ children, surface, direction = 'forward', className = '' }) {
  return <div className={`screen ${surface ? 'surface' : ''} ${direction === 'back' ? 'back' : ''} ${className}`}>{children}</div>
}

export function AppBar({ title, back = true, onBack, right }) {
  return (
    <header className={`appbar ${back ? '' : 'no-back'}`}>
      {back && (
        <button className="icon-btn" aria-label="Atrás" onClick={onBack || (() => goBack())}>
          <Icon name="arrow_back" />
        </button>
      )}
      <div className="title">{title}</div>
      {right}
    </header>
  )
}

export function Button({ children, variant = 'primary', loading, className = '', ...props }) {
  return (
    <button className={`btn ${variant} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <span className={`spinner ${variant === 'primary' ? '' : 'dark'}`} style={{ width: 20, height: 20, borderWidth: 2.5 }} /> : children}
    </button>
  )
}

export function Field({ label, error, hint, children, id }) {
  return (
    <div className={`field ${error ? 'error' : ''}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <div className="input">{children}</div>
      {error ? <div className="err-msg" role="alert">⚠ {error}</div> : hint ? <div className="hint">{hint}</div> : null}
    </div>
  )
}

export function PasswordInput({ id, value, onChange, placeholder = '••••••••', autoComplete = 'current-password' }) {
  const [show, setShow] = useState(false)
  return (
    <>
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} />
      <button type="button" className="icon-btn" style={{ width: 36, height: 36, marginRight: -8 }} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShow(!show)}>
        <Icon name={show ? 'visibility_off' : 'visibility'} size={20} color="var(--ink-2)" />
      </button>
    </>
  )
}

export function Badge({ status }) {
  return <span className={`badge ${status}`}>{STATUS_LABEL[status] || status}</span>
}

export function Chip({ children, on, ...props }) {
  return <button className={`chip ${on ? 'on' : ''}`} aria-pressed={!!on} {...props}>{children}</button>
}

export function Stepper({ step }) {
  const labels = ['1. Cliente', '2. Ítems', '3. Revisión']
  return (
    <div className="stepper" aria-label={`Paso ${step} de 3`}>
      {labels.map((l, i) => (
        <div key={l} className={i + 1 < step ? 'done' : i + 1 === step ? 'cur' : ''}>{l}</div>
      ))}
    </div>
  )
}

export function BudgetCard({ budget, onClick, dateMode = 'relative' }) {
  return (
    <button className="card" onClick={onClick}>
      <div className="meta">
        <span className="h3">{budget.client_name || 'Sin cliente'}</span>
        <span className="small muted">{budget.description || 'Sin descripción'}</span>
        <span className="caption muted" style={{ marginTop: 6 }}>
          {dateMode === 'relative' ? relativeDay(budget.created_at) : new Date(budget.created_at).toLocaleDateString('es-AR')}
        </span>
      </div>
      <div className="side">
        <span className="h3 money" style={{ fontWeight: 700 }}>{formatMoney(budget.total)}</span>
        <Badge status={budget.status} />
      </div>
    </button>
  )
}

export function ItemRow({ item, onDelete, onEdit, isNew }) {
  return (
    <div className={`item ${isNew ? 'new' : ''}`}>
      <div className="txt">
        <span style={{ fontWeight: 600 }}>{item.description}</span>
        <span className="small muted">
          {formatQty(item.quantity)} {item.unit} × {formatMoney(item.unit_price)}
        </span>
      </div>
      <span className="money" style={{ fontWeight: 700 }}>{formatMoney(itemSubtotal(item))}</span>
      {onEdit && (
        <button className="icon-btn" style={{ width: 36, height: 40 }} aria-label={`Editar ${item.description}`} onClick={onEdit}>
          <Icon name="edit" color="var(--ink-2)" size={20} />
        </button>
      )}
      {onDelete && (
        <button className="icon-btn" style={{ width: 36, height: 40 }} aria-label={`Eliminar ${item.description}`} onClick={onDelete}>
          <Icon name="delete" color="var(--ink-2)" size={22} />
        </button>
      )}
    </div>
  )
}

export function BottomNav({ active }) {
  const items = [
    ['inicio', 'Inicio', 'home', '/inicio'],
    ['presupuestos', 'Presupuestos', 'description', '/presupuestos'],
    ['nuevo', 'Nuevo', 'add', '/nuevo'],
    ['perfil', 'Perfil', 'person', '/perfil'],
  ]
  return (
    <nav className="bottomnav" aria-label="Navegación principal">
      {items.map(([key, label, icon, path]) =>
        key === 'nuevo' ? (
          <button key={key} aria-label="Nuevo presupuesto" onClick={() => navigate(path)}>
            <span className="fab"><Icon name="add" color="var(--on-primary)" /></span>
          </button>
        ) : (
          <button key={key} className={active === key ? 'on' : ''} aria-current={active === key ? 'page' : undefined}
            onClick={() => active !== key && navigate(path, { replace: true })}>
            <Icon name={icon} color={active === key ? 'var(--primary)' : 'var(--ink-2)'} />
            {label}
          </button>
        ))}
    </nav>
  )
}

export function Round({ icon, size = 48, bg = 'var(--primary-subtle)', color = 'var(--primary)', iconSize }) {
  return (
    <span className="round" style={{ width: size, height: size, background: bg }}>
      <Icon name={icon} color={color} size={iconSize || Math.round(size * 0.48)} />
    </span>
  )
}

export function Logo({ size = 84, light }) {
  return (
    <span className="logo" style={{ width: size, height: size, borderRadius: size * 0.26, background: light ? 'var(--on-primary)' : 'var(--primary)' }}>
      <Icon name="description" size={Math.round(size * 0.55)} color={light ? 'var(--primary)' : 'var(--on-primary)'} />
    </span>
  )
}

// Logo de Presupuestito: la hoja del presupuesto con cara
export function AppLogo({ size = 84 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Presupuestito" style={{ display: 'block', margin: '0 auto', borderRadius: size * 0.24, boxShadow: '0 6px 18px rgba(28, 36, 25, .18)' }}>
      <rect width="100" height="100" rx="24" fill="#5E9E44" />
      <g transform="rotate(-7 50 50)"><rect x="25" y="16" width="50" height="68" rx="12" fill="#FFFFFF" /><ellipse cx="41" cy="43" rx="5" ry="6" fill="#1C2419" /><ellipse cx="59" cy="43" rx="5" ry="6" fill="#1C2419" /><circle cx="42.6" cy="41" r="1.7" fill="#FFFFFF" /><circle cx="60.6" cy="41" r="1.7" fill="#FFFFFF" /><circle cx="34" cy="54" r="4" fill="#F5A524" /><circle cx="66" cy="54" r="4" fill="#F5A524" /><path d="M43 55Q50 62 57 55" fill="none" stroke="#1C2419" strokeWidth="3.5" strokeLinecap="round" /><path d="M37 72H63" stroke="#F5A524" strokeWidth="6" strokeLinecap="round" /></g>
    </svg>
  )
}

export function Toast({ message, onDone }) {
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => done.current(), 2800)
    return () => clearTimeout(t)
  }, [message])
  if (!message) return null
  return <div className="toast" role="status">{message}</div>
}

export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="handle" />
        <h2 className="h2">{title}</h2>
        {children}
      </div>
    </>
  )
}

export function Spinner({ dark }) {
  return <span className={`spinner ${dark ? 'dark' : ''}`} />
}
