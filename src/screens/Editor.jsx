// Armado del presupuesto en 3 pasos (nuevo, duplicado o edición) y pantalla de éxito
import { useEffect, useMemo, useState } from 'react'
import { useApp, useLoad } from '../state.jsx'
import { goBack, navigate } from '../lib/router.js'
import { UNITS, addDays, budgetNumber, formatDate, formatMoney, formatQty, itemSubtotal, itemsTotal } from '../lib/format.js'
import { downloadPdf } from '../lib/share.js'
import { AppBar, Button, Field, Icon, ItemRow, Logo, Round, Screen, Spinner, Stepper } from '../components/ui.jsx'
import { ShareSheet } from '../components/ShareSheet.jsx'
import { findItem, frequentItems, rememberItems } from '../lib/frequent.js'

const EMPTY = { client_id: null, client_name: '', client_phone: '', description: '', validity_days: 15, status: 'borrador', items: [] }
let tmpId = 0
const withKey = (it) => ({ ...it, _key: it.id || `n${++tmpId}` })

export function BudgetEditor({ direction, params, query }) {
  const { backend, profile } = useApp()
  const editing = !!params.id
  const sourceId = params.id || query.desde
  const [draft, setDraft] = useState(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [originalKeys, setOriginalKeys] = useState(new Set())
  const clients = useLoad(() => backend.listClients(), [])

  // Cargar el presupuesto a editar o duplicar, o el cliente elegido
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (sourceId) {
        const b = await backend.getBudget(sourceId)
        if (!alive) return
        if (!b) {
          setError('No encontramos ese presupuesto.')
          setDraft({ ...EMPTY })
          return
        }
        const items = b.items.map(({ kind, description, quantity, unit, unit_price, id }) => withKey({ kind, description, quantity, unit, unit_price, id: editing ? id : undefined }))
        if (editing) {
          setDraft({ ...b, items })
          setOriginalKeys(new Set(items.map((i) => i._key)))
          setStep(2)
        } else {
          setDraft({ ...EMPTY, description: b.description, validity_days: b.validity_days, items })
        }
      } else {
        setDraft({ ...EMPTY })
      }
    })()
    return () => {
      alive = false
    }
  }, [sourceId, editing, backend])

  useEffect(() => {
    if (!draft || !query.cliente || !clients.data || draft.client_id) return
    const c = clients.data.find((x) => x.id === query.cliente)
    if (c) setDraft((d) => ({ ...d, client_id: c.id, client_name: c.name, client_phone: c.phone }))
  }, [clients.data, query.cliente, draft])

  const total = useMemo(() => itemsTotal(draft?.items), [draft])
  const title = editing ? `Editar ${budgetNumber(draft?.number)}` : 'Nuevo presupuesto'
  const back = () => {
    setError('')
    if (step > 1 && !(editing && step === 2)) setStep(step - 1)
    else goBack()
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const saved = await backend.saveBudget({ ...draft, items: draft.items })
      rememberItems(draft.items)
      navigate(`/listo/${saved.id}${editing ? '?actualizado=1' : ''}`, { replace: true })
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  if (!draft) {
    return (
      <Screen surface direction={direction}>
        <AppBar title={title} />
        <div className="content centered"><Spinner dark /></div>
      </Screen>
    )
  }

  return (
    <Screen surface direction={direction}>
      <AppBar title={title} onBack={back} />
      {step === 1 && <StepClient draft={draft} setDraft={setDraft} clients={clients.data || []} onNext={() => setStep(2)} />}
      {step === 2 && (
        <StepItems draft={draft} setDraft={setDraft} total={total} originalKeys={editing ? originalKeys : null}
          cta={editing ? 'Guardar cambios' : 'Siguiente: revisar'} saving={saving} error={error}
          onNext={editing ? save : () => setStep(3)} />
      )}
      {step === 3 && (
        <StepReview draft={draft} setDraft={setDraft} total={total} profile={profile} saving={saving} error={error}
          onSave={save} onEdit={() => setStep(2)} />
      )}
      {error && step === 1 && <div className="alert err" style={{ margin: '0 20px 12px' }}>{error}</div>}
    </Screen>
  )
}

function StepClient({ draft, setDraft, clients, onNext }) {
  const [q, setQ] = useState('')
  const [errors, setErrors] = useState({})
  const matches = q.trim() ? clients.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 5) : []
  const set = (k) => (e) => {
    setDraft({ ...draft, [k]: e.target.value, ...(k === 'client_name' ? { client_id: null } : {}) })
    if (errors[k]) setErrors({ ...errors, [k]: '' })
  }
  const pick = (c) => {
    setDraft({ ...draft, client_id: c.id, client_name: c.name, client_phone: c.phone })
    setQ('')
  }
  const next = () => {
    const e = {
      client_name: draft.client_name.trim() ? '' : 'Escribí el nombre del cliente.',
      description: draft.description.trim() ? '' : 'Contá en pocas palabras qué trabajo es.',
    }
    setErrors(e)
    if (!e.client_name && !e.description) onNext()
  }

  return (
    <>
      <div className="content tight">
        <Stepper step={1} />
        <h2 className="h3">Cliente</h2>
        {clients.length > 0 && (
          <div className="stack-8">
            <label className="search">
              <Icon name="search" size={22} color="var(--ink-2)" />
              <input type="search" placeholder="Buscar cliente guardado" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar cliente guardado" />
            </label>
            {matches.map((c) => (
              <button key={c.id} className="card" style={{ padding: 12 }} onClick={() => pick(c)}>
                <div className="meta"><b>{c.name}</b><span className="small muted">{c.phone || 'Sin teléfono'}</span></div>
                <span className="link">Elegir</span>
              </button>
            ))}
            <span className="caption muted center">o cargá uno nuevo</span>
          </div>
        )}
        <Field label="Nombre del cliente" id="cl-name" error={errors.client_name}>
          <input id="cl-name" placeholder="Ej.: María López" value={draft.client_name} onChange={set('client_name')} autoComplete="off" />
        </Field>
        <Field label="Teléfono (opcional)" id="cl-phone" hint="Para mandarle el PDF por WhatsApp.">
          <input id="cl-phone" type="tel" inputMode="tel" placeholder="299 455-1234" value={draft.client_phone} onChange={set('client_phone')} />
        </Field>
        <h2 className="h3">Trabajo</h2>
        <Field label="Descripción del trabajo" id="cl-desc" error={errors.description}>
          <textarea id="cl-desc" rows={3} placeholder="Ej.: Pintura living y comedor" value={draft.description} onChange={set('description')} />
        </Field>
      </div>
      <div className="footer"><Button onClick={next}>Siguiente</Button></div>
    </>
  )
}

function ItemForm({ kind, onAdd, onCancel }) {
  const labor = kind === 'mano_obra'
  const [f, setF] = useState({ description: '', quantity: '1', unit: labor ? 'global' : 'u', unit_price: '' })
  const [error, setError] = useState('')
  const [calc, setCalc] = useState(null) // { m2, manos, rend }
  const freq = frequentItems(kind)
  const pick = (description) => {
    const hit = findItem(description)
    setF(hit ? { ...f, description, unit: hit.unit, unit_price: String(hit.unit_price) } : { ...f, description })
  }
  const est = calc && Number(calc.rend) > 0 ? Math.ceil((Number(calc.m2) * Number(calc.manos || 1)) / Number(calc.rend) * 10) / 10 : 0
  const q = Number(String(f.quantity).replace(',', '.'))
  const p = Number(String(f.unit_price).replace(',', '.'))
  const sub = (q > 0 && p >= 0) ? q * p : 0

  const add = () => {
    if (!f.description.trim()) return setError(labor ? 'Describí la mano de obra.' : 'Escribí qué material es.')
    if (!(q > 0)) return setError('La cantidad tiene que ser mayor a 0.')
    if (!(p >= 0) || f.unit_price === '') return setError('Ingresá el precio.')
    onAdd({ kind, description: f.description.trim(), quantity: q, unit: f.unit, unit_price: p })
  }

  return (
    <div className="item-form">
      <div className="row between">
        <b className="small" style={{ color: 'var(--primary)' }}>{labor ? 'Agregar mano de obra' : 'Agregar material'}</b>
        <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label="Cerrar" onClick={onCancel}><Icon name="close" size={20} color="var(--ink-2)" /></button>
      </div>
      <label className="mini"><span>Descripción</span>
        <input autoFocus list={`frecuentes-${kind}`} placeholder={labor ? 'Ej.: Preparación y 2 manos' : 'Ej.: Látex interior 20 L'} value={f.description} onChange={(e) => pick(e.target.value)} />
        <datalist id={`frecuentes-${kind}`}>{freq.map((i) => <option key={i.description} value={i.description}>{`${i.unit} · ${formatMoney(i.unit_price)}`}</option>)}</datalist>
      </label>
      <div className="grid3">
        <label className="mini"><span>Cant.</span>
          <input type="number" inputMode="decimal" min="0" step="any" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} />
        </label>
        <label className="mini"><span>Unidad</span>
          <select value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
        </label>
        <label className="mini"><span>Precio $</span>
          <input type="number" inputMode="decimal" min="0" step="any" placeholder="0" value={f.unit_price} onChange={(e) => setF({ ...f, unit_price: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} />
        </label>
      </div>
      {!labor && (calc ? (
        <div className="calc">
          <b className="small">Calcular cantidad</b>
          <div className="grid3">
            <label className="mini"><span>Superficie m²</span><input type="number" inputMode="decimal" min="0" step="any" value={calc.m2} onChange={(e) => setCalc({ ...calc, m2: e.target.value })} /></label>
            <label className="mini"><span>Manos</span><input type="number" inputMode="numeric" min="1" step="1" value={calc.manos} onChange={(e) => setCalc({ ...calc, manos: e.target.value })} /></label>
            <label className="mini"><span>Rinde m² por u.</span><input type="number" inputMode="decimal" min="0" step="any" placeholder="Ej.: 10" value={calc.rend} onChange={(e) => setCalc({ ...calc, rend: e.target.value })} /></label>
          </div>
          <div className="row between">
            <span className="small">Necesitás: <b>{est ? `${String(est).replace('.', ',')} ${f.unit}` : '—'}</b></span>
            <Button variant="secondary" className="small" disabled={!est} onClick={() => { setF({ ...f, quantity: String(est) }); setCalc(null) }}>Usar</Button>
          </div>
        </div>
      ) : (
        <button className="link small" style={{ alignSelf: 'flex-start' }} onClick={() => setCalc({ m2: '', manos: '2', rend: '' })}>¿Cuánto necesito? Calcular por m²</button>
      ))}
      {error && <span className="err-msg small" style={{ color: 'var(--err)', fontWeight: 600 }}>⚠ {error}</span>}
      <div className="row between">
        <span className="small" style={{ fontWeight: 600 }}>Subtotal: <span className="money">{formatMoney(sub)}</span></span>
        <Button variant="secondary" className="small" onClick={add}>Agregar</Button>
      </div>
    </div>
  )
}

function StepItems({ draft, setDraft, total, originalKeys, cta, onNext, saving, error }) {
  const [adding, setAdding] = useState(draft.items.length === 0 ? 'material' : null)
  const [localError, setLocalError] = useState('')
  const materials = draft.items.filter((i) => i.kind === 'material')
  const labor = draft.items.filter((i) => i.kind === 'mano_obra')
  const add = (it) => {
    setDraft({ ...draft, items: [...draft.items, withKey(it)] })
    setAdding(null)
    setLocalError('')
  }
  const remove = (key) => setDraft({ ...draft, items: draft.items.filter((i) => i._key !== key) })
  const next = () => {
    if (!draft.items.length) return setLocalError('Agregá al menos un material o la mano de obra.')
    onNext()
  }
  const isNew = (it) => originalKeys && !originalKeys.has(it._key)

  return (
    <>
      <div className="content tight">
        <Stepper step={2} />
        <h2 className="h3">Materiales</h2>
        <div className="stack-8">
          {materials.map((it) => <ItemRow key={it._key} item={it} isNew={isNew(it)} onDelete={() => remove(it._key)} />)}
        </div>
        {adding === 'material' ? <ItemForm kind="material" onAdd={add} onCancel={() => setAdding(null)} /> : (
          <button className="add-dashed" onClick={() => setAdding('material')}><Icon name="add" size={20} color="var(--primary)" /> Agregar material</button>
        )}
        <h2 className="h3">Mano de obra</h2>
        <div className="stack-8">
          {labor.map((it) => <ItemRow key={it._key} item={it} isNew={isNew(it)} onDelete={() => remove(it._key)} />)}
        </div>
        {adding === 'mano_obra' ? <ItemForm kind="mano_obra" onAdd={add} onCancel={() => setAdding(null)} /> : (
          <button className="add-dashed" onClick={() => setAdding('mano_obra')}><Icon name="add" size={20} color="var(--primary)" /> Agregar mano de obra</button>
        )}
        {(localError || error) && <div className="alert err" role="alert">{localError || error}</div>}
      </div>
      <div className="footer bar">
        <div className="row between">
          <span className="h3">Total</span>
          <span className="h1 money" style={{ color: 'var(--primary)' }} aria-live="polite">{formatMoney(total)}</span>
        </div>
        <Button loading={saving} onClick={next}>{cta}</Button>
      </div>
    </>
  )
}

function StepReview({ draft, setDraft, total, profile, onSave, onEdit, saving, error }) {
  const today = new Date().toISOString()
  return (
    <>
      <div className="content tight">
        <Stepper step={3} />
        <h2 className="h3">Así lo va a ver tu cliente</h2>
        <div className="pdf-preview">
          <div className="row" style={{ gap: 10 }}>
            {profile?.logo ? <img src={profile.logo} alt="" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8, background: '#fff' }} /> : <Logo size={36} />}
            <div className="stack grow">
              <b>{profile?.business_name || profile?.full_name || 'Tu negocio'}</b>
              <span className="muted">{[profile?.trade, profile?.phone].filter(Boolean).join(' · ')}</span>
            </div>
            <div className="stack right"><b>{draft.number ? budgetNumber(draft.number) : 'N.º nuevo'}</b><span className="muted">{formatDate(today)}</span></div>
          </div>
          <hr />
          <b>Cliente: {draft.client_name}</b>
          <span className="muted">{draft.description}</span>
          {draft.items.map((it) => (
            <div key={it._key} className="row between" style={{ gap: 8 }}>
              <span>{it.description} · {formatQty(it.quantity)} {it.unit}</span>
              <span className="money">{formatMoney(itemSubtotal(it))}</span>
            </div>
          ))}
          <hr />
          <div className="row between"><b style={{ fontSize: 16 }}>Total</b><b className="money" style={{ fontSize: 16, color: 'var(--primary)' }}>{formatMoney(total)}</b></div>
        </div>
        <div className="row between">
          <label className="small" htmlFor="validity" style={{ fontWeight: 600 }}>Validez</label>
          <div className="input" style={{ minHeight: 40, width: 150 }}>
            <select id="validity" value={draft.validity_days} onChange={(e) => setDraft({ ...draft, validity_days: Number(e.target.value) })}>
              {[7, 15, 30, 60].map((d) => <option key={d} value={d}>{d} días</option>)}
            </select>
          </div>
        </div>
        <span className="caption muted">Vence el {formatDate(addDays(today, draft.validity_days))}. Podés volver a cualquier paso sin perder lo cargado.</span>
        {error && <div className="alert err" role="alert">{error}</div>}
      </div>
      <div className="footer">
        <Button loading={saving} onClick={onSave}>Generar PDF</Button>
        <Button variant="secondary" onClick={onEdit}>Editar datos</Button>
      </div>
    </>
  )
}

export function Success({ direction, params, query }) {
  const { backend, profile, notify } = useApp()
  const { data: b, reload } = useLoad(() => backend.getBudget(params.id), [params.id])
  const [share, setShare] = useState(false)
  const updated = query.actualizado === '1'

  return (
    <Screen surface direction={direction} className="fade">
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 12px 0' }}>
        <button className="icon-btn" aria-label="Cerrar" onClick={() => navigate('/inicio', { replace: true })}><Icon name="close" /></button>
      </div>
      <div className="content centered" style={{ gap: 14 }}>
        <Round icon="check_circle" size={120} bg="var(--ok-bg)" color="var(--ok)" />
        <h1 className="h1">{updated ? '¡Presupuesto actualizado!' : '¡Presupuesto listo!'}</h1>
        <p className="body muted" style={{ margin: 0 }}>
          {b ? (updated
            ? `El presupuesto ${budgetNumber(b.number)} se guardó con el nuevo total, recalculado automáticamente.`
            : `El PDF del presupuesto ${budgetNumber(b.number)} quedó guardado en tu historial.`) : '…'}
        </p>
        {b && (
          <div className="card" style={{ background: 'var(--bg)', border: 0, flexDirection: 'column', gap: 4 }}>
            <div className="row between"><b>{b.client_name}</b><b className="money">{formatMoney(b.total)}</b></div>
            <span className="small muted" style={{ textAlign: 'left' }}>{b.description}</span>
            <span className="caption muted" style={{ textAlign: 'left' }}>Válido hasta el {formatDate(addDays(b.updated_at || b.created_at, b.validity_days))}</span>
          </div>
        )}
      </div>
      <div className="footer">
        <Button disabled={!b} onClick={() => setShare(true)}>Compartir por WhatsApp</Button>
        <Button variant="secondary" disabled={!b} onClick={async () => { await downloadPdf(b, profile); notify('PDF descargado') }}>Descargar PDF</Button>
        <Button variant="text" onClick={() => navigate('/inicio', { replace: true })}>Volver al inicio</Button>
      </div>
      {b && <ShareSheet open={share} onClose={() => setShare(false)} budget={b} profile={profile} onShared={reload} />}
    </Screen>
  )
}
