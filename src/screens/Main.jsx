// Home, Mis presupuestos, Detalle, Perfil, Editar datos y Clientes
import { useMemo, useState } from 'react'
import { useApp, useLoad } from '../state.jsx'
import { goBack, navigate } from '../lib/router.js'
import { TRADES, addDays, budgetNumber, formatDate, formatMoney } from '../lib/format.js'
import {
  AppBar, Badge, BottomNav, BudgetCard, Button, Chip, Field, Icon, ItemRow, Round, Screen, Sheet,
} from '../components/ui.jsx'
import { ShareSheet } from '../components/ShareSheet.jsx'
import { seedDemo } from '../lib/demo.js'
import { loadA11y, saveA11y } from '../lib/a11y.js'

function Skeletons({ n = 3 }) {
  return Array.from({ length: n }, (_, i) => <div key={i} className="skeleton" />)
}

function LoadError({ error, reload }) {
  return (
    <div className="empty">
      <span>{error}</span>
      <Button variant="secondary" className="small" onClick={reload}>Reintentar</Button>
    </div>
  )
}

export function Home({ direction }) {
  const { backend, profile } = useApp()
  const { data, loading, error, reload } = useLoad(() => backend.listBudgets(), [])
  const budgets = data || []
  const month = new Date().toISOString().slice(0, 7)
  const thisMonth = budgets.filter((b) => b.created_at.slice(0, 7) === month)
  const count = (s) => thisMonth.filter((b) => b.status === s).length
  const first = (profile?.full_name || '').split(' ')[0]

  return (
    <Screen direction={direction} className="fade">
      <div className="content" style={{ paddingTop: 24 }}>
        <div className="row">
          <div className="stack grow">
            <h1 className="h1">Hola{first ? `, ${first}` : ''}</h1>
            <span className="small muted">{[profile?.trade, profile?.business_name].filter(Boolean).join(' · ') || 'Tu cuenta'}</span>
          </div>
          <button className="round" style={{ border: 0, background: 'var(--primary-subtle)', width: 44, height: 44 }} aria-label="Perfil" onClick={() => navigate('/perfil', { replace: true })}>
            <Icon name="person" color="var(--primary)" />
          </button>
        </div>
        <button className="search" onClick={() => navigate('/presupuestos?buscar=1', { replace: true })} style={{ textAlign: 'left' }}>
          <Icon name="search" size={22} color="var(--ink-2)" /> Buscar cliente o presupuesto
        </button>
        <button className="hero" onClick={() => navigate('/nuevo')}>
          <div className="stack grow">
            <span className="h2" style={{ color: 'var(--on-primary)' }}>Nuevo presupuesto</span>
            <span className="small" style={{ color: 'var(--on-primary)' }}>Cliente, ítems y PDF en 3 pasos</span>
          </div>
          <span className="round" style={{ background: 'var(--on-primary)' }}><Icon name="add" color="var(--primary)" /></span>
        </button>
        <h2 className="h3">Resumen del mes</h2>
        <div className="row" style={{ gap: 10 }}>
          {[['enviado', 'Enviados'], ['borrador', 'Borradores'], ['aceptado', 'Aceptados']].map(([s, l]) => (
            <div key={s} className="tile">
              <div className="h1">{loading ? '–' : count(s)}</div>
              <div className="caption muted">{l}</div>
            </div>
          ))}
        </div>
        <div className="row between">
          <h2 className="h3">Recientes</h2>
          {budgets.length > 0 && <button className="link" onClick={() => navigate('/presupuestos', { replace: true })}>Ver todos</button>}
        </div>
        <div className="stack-10">
          {loading ? <Skeletons n={2} /> : error ? <LoadError error={error} reload={reload} /> : budgets.length === 0 ? (
            <div className="empty">
              <Round icon="description" size={64} />
              <span>Todavía no tenés presupuestos.<br />Tocá “Nuevo presupuesto” para armar el primero.</span>
            </div>
          ) : budgets.slice(0, 3).map((b) => <BudgetCard key={b.id} budget={b} onClick={() => navigate(`/presupuesto/${b.id}`)} />)}
        </div>
      </div>
      <BottomNav active="inicio" />
    </Screen>
  )
}

const FILTERS = [['todos', 'Todos'], ['borrador', 'Borrador'], ['enviado', 'Enviado'], ['aceptado', 'Aceptado']]

export function Budgets({ direction, query }) {
  const { backend } = useApp()
  const { data, loading, error, reload } = useLoad(() => backend.listBudgets(), [])
  const [filter, setFilter] = useState(query?.estado || 'todos')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('recientes')

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    let rows = (data || []).filter((b) => filter === 'todos' || b.status === filter)
    if (term) rows = rows.filter((b) => `${b.client_name} ${b.description} ${b.number}`.toLowerCase().includes(term))
    if (sort === 'importe') rows = [...rows].sort((a, b) => b.total - a.total)
    return rows
  }, [data, filter, q, sort])

  return (
    <Screen direction={direction} className="fade">
      <AppBar title="Mis presupuestos" back={false} />
      <div className="content tight">
        <label className="search">
          <Icon name="search" size={22} color="var(--ink-2)" />
          <input type="search" placeholder="Buscar por cliente o trabajo" value={q} onChange={(e) => setQ(e.target.value)} autoFocus={query?.buscar === '1'} aria-label="Buscar presupuestos" />
        </label>
        <div className="chips" role="group" aria-label="Filtrar por estado">
          {FILTERS.map(([k, l]) => <Chip key={k} on={filter === k} onClick={() => setFilter(k)}>{l}</Chip>)}
        </div>
        <div className="row between">
          <span className="small muted" style={{ fontWeight: 600 }}>{loading ? 'Cargando…' : `${list.length} ${list.length === 1 ? 'presupuesto' : 'presupuestos'}`}</span>
          <select className="small" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar" style={{ border: 0, background: 'none', fontWeight: 600 }}>
            <option value="recientes">Más recientes</option>
            <option value="importe">Mayor importe</option>
          </select>
        </div>
        <div className="stack-10">
          {loading ? <Skeletons /> : error ? <LoadError error={error} reload={reload} /> : list.length === 0 ? (
            <div className="empty">
              <Round icon="search" size={64} />
              <span>{data?.length ? 'No hay presupuestos con ese filtro.' : 'Todavía no tenés presupuestos.'}</span>
              {!data?.length && <Button className="small" onClick={() => navigate('/nuevo')}>Crear el primero</Button>}
            </div>
          ) : list.map((b) => <BudgetCard key={b.id} budget={b} dateMode="date" onClick={() => navigate(`/presupuesto/${b.id}`)} />)}
        </div>
      </div>
      <BottomNav active="presupuestos" />
    </Screen>
  )
}

export function BudgetDetail({ direction, params }) {
  const { backend, profile, notify } = useApp()
  const { data: b, loading, error, reload } = useLoad(() => backend.getBudget(params.id), [params.id])
  const [share, setShare] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const setStatus = async (status) => {
    await backend.setBudgetStatus(b.id, status)
    reload()
  }
  const remove = async () => {
    await backend.deleteBudget(b.id)
    notify('Presupuesto eliminado')
    navigate('/presupuestos', { replace: true })
  }

  const materials = b?.items.filter((i) => i.kind === 'material') || []
  const labor = b?.items.filter((i) => i.kind === 'mano_obra') || []

  return (
    <Screen direction={direction}>
      <AppBar
        title={b ? `Presupuesto ${budgetNumber(b.number)}` : 'Presupuesto'}
        right={b && <button className="icon-btn" aria-label="Eliminar presupuesto" onClick={() => setConfirmDelete(true)}><Icon name="delete" color="var(--ink-2)" /></button>}
      />
      {loading ? <div className="content"><Skeletons n={4} /></div> : error || !b ? (
        <div className="content"><LoadError error={error || 'No encontramos este presupuesto.'} reload={reload} /></div>
      ) : (
        <>
          <div className="content tight">
            <div className="row between">
              <h1 className="h2">{b.client_name}</h1>
              <Badge status={b.status} />
            </div>
            <span className="small muted">{b.description} · {formatDate(b.created_at)}</span>
            {materials.length > 0 && <><h2 className="h3">Materiales</h2><div className="stack-8">{materials.map((it) => <ItemRow key={it.id} item={it} />)}</div></>}
            {labor.length > 0 && <><h2 className="h3">Mano de obra</h2><div className="stack-8">{labor.map((it) => <ItemRow key={it.id} item={it} />)}</div></>}
            <div className="total-box">
              <span className="h3">Total</span>
              <span className="display money" style={{ color: 'var(--primary)' }}>{formatMoney(b.total)}</span>
            </div>
            <span className="caption muted">Válido hasta el {formatDate(addDays(b.updated_at || b.created_at, b.validity_days))}</span>
            <div className="stack-8">
              <span className="small" style={{ fontWeight: 600 }}>Estado</span>
              <div className="chips wrap">
                {['borrador', 'enviado', 'aceptado'].map((s) => (
                  <Chip key={s} on={b.status === s} onClick={() => setStatus(s)}>{s[0].toUpperCase() + s.slice(1)}</Chip>
                ))}
              </div>
            </div>
          </div>
          <div className="footer bar">
            <Button onClick={() => setShare(true)}>Compartir PDF</Button>
            <div className="btn-row">
              <Button variant="secondary" onClick={() => navigate(`/editar/${b.id}`)}>Editar</Button>
              <Button variant="secondary" onClick={() => navigate(`/nuevo?desde=${b.id}`)}>Duplicar</Button>
            </div>
          </div>
          <ShareSheet open={share} onClose={() => setShare(false)} budget={b} profile={profile} onShared={reload} />
          <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="¿Eliminar este presupuesto?">
            <p className="body muted" style={{ margin: 0 }}>Se borra {budgetNumber(b.number)} de {b.client_name}. Esta acción no se puede deshacer.</p>
            <Button style={{ background: 'var(--err)' }} onClick={remove}>Eliminar</Button>
            <Button variant="text" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          </Sheet>
        </>
      )}
    </Screen>
  )
}

export function Profile({ direction }) {
  const { backend, profile, session, notify } = useApp()
  const budgets = useLoad(() => backend.listBudgets(), [])
  const clients = useLoad(() => backend.listClients(), [])
  const [help, setHelp] = useState(false)

  const loadDemo = async () => {
    await seedDemo(backend)
    notify('Cargamos 4 presupuestos de ejemplo')
    budgets.reload()
    clients.reload()
  }

  return (
    <Screen direction={direction} className="fade">
      <AppBar title="Perfil" back={false} right={backend.mode === 'demo' && <span className="demo-tag" style={{ marginRight: 8 }}>Modo demo</span>} />
      <div className="content">
        <div className="row" style={{ gap: 14 }}>
          <Round icon="person" size={64} />
          <div className="stack grow">
            <span className="h2">{profile?.full_name || 'Tu nombre'}</span>
            <span className="small muted">{[profile?.trade, profile?.business_name].filter(Boolean).join(' · ') || session?.user.email}</span>
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate('/perfil/editar')}>Editar mis datos</Button>
        <h2 className="h3">Mi actividad</h2>
        <div className="row" style={{ gap: 10 }}>
          <div className="tile"><div className="h1">{budgets.data?.length ?? '–'}</div><div className="caption muted">presupuestos</div></div>
          <div className="tile"><div className="h1">{clients.data?.length ?? '–'}</div><div className="caption muted">clientes</div></div>
        </div>
        <div>
          {[
            ['Historial de presupuestos', 'description', () => navigate('/presupuestos', { replace: true })],
            ['Mis clientes', 'group', () => navigate('/clientes')],
            ['Datos para el PDF', 'edit', () => navigate('/perfil/editar')],
            ['Accesibilidad', 'accessibility', () => navigate('/perfil/accesibilidad')],
            ['Ayuda y preguntas frecuentes', 'help', () => setHelp(true)],
            ['Cerrar sesión', 'logout', () => backend.auth.signOut()],
          ].map(([label, icon, fn]) => (
            <button key={label} className="menu-row" onClick={fn}>
              <Icon name={icon} color="var(--ink-2)" />
              <span className="grow">{label}</span>
              <Icon name="chevron_right" color="var(--ink-2)" />
            </button>
          ))}
        </div>
        {backend.mode === 'demo' && budgets.data?.length === 0 && (
          <Button variant="secondary" onClick={loadDemo}>Cargar presupuestos de ejemplo</Button>
        )}
      </div>
      <BottomNav active="perfil" />
      <Sheet open={help} onClose={() => setHelp(false)} title="Ayuda">
        <div className="stack-8 small">
          <p style={{ margin: 0 }}><b>¿Cómo armo un presupuesto?</b> Tocá el botón + y seguí los 3 pasos: cliente, ítems y revisión.</p>
          <p style={{ margin: 0 }}><b>¿Cómo lo mando por WhatsApp?</b> Al terminar, tocá “Compartir por WhatsApp”: se adjunta el PDF.</p>
          <p style={{ margin: 0 }}><b>¿Puedo cambiarlo después?</b> Sí: abrilo desde Mis presupuestos y tocá “Editar”. El total se recalcula solo.</p>
        </div>
        <Button variant="text" onClick={() => setHelp(false)}>Entendido</Button>
      </Sheet>
    </Screen>
  )
}

export function ProfileEdit({ direction }) {
  const { backend, profile, setProfile, notify } = useApp()
  const [f, setF] = useState({ full_name: profile?.full_name || '', trade: profile?.trade || '', business_name: profile?.business_name || '', phone: profile?.phone || '', logo: profile?.logo || '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const save = async () => {
    setError('')
    if (f.full_name.trim().length < 2) return setError('Escribí tu nombre y apellido.')
    setLoading(true)
    try {
      setProfile(await backend.updateProfile({ ...f, full_name: f.full_name.trim(), business_name: f.business_name.trim(), phone: f.phone.trim() }))
      notify('Datos guardados')
      history.back()
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <Screen surface direction={direction}>
      <AppBar title="Mis datos" />
      <div className="content">
        <Field label="Nombre y apellido" id="pf-name"><input id="pf-name" value={f.full_name} onChange={set('full_name')} /></Field>
        <div className="stack-8">
          <span className="small" style={{ fontWeight: 600 }}>Oficio</span>
          <div className="chips wrap">{TRADES.map((t) => <Chip key={t} on={f.trade === t} onClick={() => setF({ ...f, trade: t })}>{t}</Chip>)}</div>
        </div>
        <Field label="Nombre para el presupuesto" id="pf-biz" hint="Aparece en el encabezado del PDF."><input id="pf-biz" value={f.business_name} onChange={set('business_name')} /></Field>
        <Field label="Teléfono de contacto" id="pf-phone"><input id="pf-phone" type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Logo del negocio" id="pf-logo" hint="Opcional. Aparece en el encabezado del PDF.">
          <div className="row" style={{ gap: 12 }}>
            {f.logo && <img src={f.logo} alt="Logo del negocio" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, background: '#fff', border: '1px solid var(--border)' }} />}
            <input id="pf-logo" type="file" accept="image/png,image/jpeg" onChange={async (e) => { const file = e.target.files[0]; if (file) setF({ ...f, logo: await shrinkImage(file) }) }} />
            {f.logo && <button className="link small" onClick={() => setF({ ...f, logo: '' })}>Quitar</button>}
          </div>
        </Field>
        {error && <div className="alert err">{error}</div>}
      </div>
      <div className="footer"><Button loading={loading} onClick={save}>Guardar cambios</Button></div>
    </Screen>
  )
}

export function Clients({ direction }) {
  const { backend } = useApp()
  const { data, loading, error, reload } = useLoad(() => backend.listClients(), [])
  return (
    <Screen direction={direction}>
      <AppBar title="Mis clientes" />
      <div className="content tight">
        {loading ? <Skeletons /> : error ? <LoadError error={error} reload={reload} /> : !data.length ? (
          <div className="empty"><Round icon="group" size={64} /><span>Los clientes se guardan solos cuando armás un presupuesto.</span></div>
        ) : data.map((c) => (
          <button key={c.id} className="card" onClick={() => navigate(`/nuevo?cliente=${c.id}`)}>
            <div className="meta"><span className="h3">{c.name}</span><span className="small muted">{c.phone || 'Sin teléfono'}</span></div>
            <span className="link">Nuevo presupuesto</span>
          </button>
        ))}
      </div>
    </Screen>
  )
}

// Perfil → Accesibilidad: preferencias guardadas en este celular
export function Accessibility({ direction }) {
  const [prefs, setPrefs] = useState(loadA11y)
  const set = (k, v) => {
    const next = { ...prefs, [k]: v }
    setPrefs(next)
    saveA11y(next)
  }
  const sample = { id: 'muestra', number: 12, client_name: 'María López', description: 'Pintura living y comedor', total: 385000, status: 'enviado', created_at: new Date().toISOString() }
  const toggles = [
    ['dark', 'Modo oscuro', 'Fondo oscuro, cómodo de noche y con poca luz.'],
    ['bold', 'Texto en negrita', 'Todas las letras más gruesas.'],
    ['legible', 'Letra de alta legibilidad', 'Atkinson Hyperlegible: letras que no se confunden entre sí.'],
    ['colorblind', 'Modo daltonismo', 'Los estados se muestran en azul y naranja en lugar de verde y rojo.'],
  ]

  return (
    <Screen direction={direction}>
      <AppBar title="Accesibilidad" onBack={() => goBack('/perfil')} />
      <div className="content">
        <div className="stack-8">
          <span className="h3">Tamaño de letra</span>
          <div className="chips wrap" role="radiogroup" aria-label="Tamaño de letra">
            {[['normal', 'Normal'], ['grande', 'Grande'], ['muy-grande', 'Muy grande']].map(([v, label]) => (
              <Chip key={v} on={prefs.size === v} role="radio" aria-checked={prefs.size === v} onClick={() => set('size', v)}>{label}</Chip>
            ))}
          </div>
        </div>
        <div>
          {toggles.map(([k, label, hint]) => (
            <button key={k} className="menu-row a11y-row" role="switch" aria-checked={!!prefs[k]} onClick={() => set(k, !prefs[k])}>
              <span className="grow stack">
                <span>{label}</span>
                <span className="small muted">{hint}</span>
              </span>
              <span className={`switch ${prefs[k] ? 'on' : ''}`} aria-hidden="true"><span /></span>
            </button>
          ))}
        </div>
        <div className="stack-8">
          <span className="h3">Vista previa</span>
          <BudgetCard budget={sample} onClick={() => {}} />
          <div className="row" style={{ gap: 8 }}>
            <Badge status="borrador" /><Badge status="enviado" /><Badge status="aceptado" />
          </div>
        </div>
        <p className="small muted" style={{ margin: 0 }}>Estas preferencias se guardan en este celular y se aplican en toda la app.</p>
      </div>
    </Screen>
  )
}

// Achica la imagen del logo a 256 px como máximo y la devuelve en PNG (data URL)
function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, 256 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
