// Splash, onboarding, bienvenida, ingreso, registro y recuperación de contraseña
import { useState } from 'react'
import { useApp } from '../state.jsx'
import { navigate } from '../lib/router.js'
import { TRADES } from '../lib/format.js'
import { AppBar, AppLogo, Button, Chip, Field, Icon, PasswordInput, Round, Screen, Spinner } from '../components/ui.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const passwordOk = (p) => p.length >= 8 && /[a-zA-Z]/.test(p) && /\d/.test(p)

export function Splash() {
  return (
    <Screen className="splash fade">
      <div className="content centered" style={{ gap: 20 }}>
        <AppLogo size={104} />
        <div className="display">Presupuestito</div>
        <div className="body">Presupuestos claros en minutos</div>
        <div style={{ height: 40 }} />
        <Spinner />
      </div>
    </Screen>
  )
}

const SLIDES = [
  ['description', 'Cargá materiales y mano de obra', 'El total se calcula solo, sin papel ni calculadora.'],
  ['share', 'Compartilo en PDF por WhatsApp', 'Un presupuesto prolijo, con tus datos, listo para mandar al cliente.'],
  ['edit', 'Editalo si la obra cambia', 'Abrí un presupuesto guardado, sumá materiales y el total se recalcula solo.'],
]

export function Onboarding({ direction }) {
  const [i, setI] = useState(0)
  const done = () => {
    localStorage.setItem('presufacil-onboarded', '1')
    navigate('/bienvenida', { replace: true })
  }
  const [icon, title, text] = SLIDES[i]
  return (
    <Screen surface direction={direction}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 12px 0', minHeight: 56 }}>
        {i < 2 && <button className="btn text small" onClick={done}>Saltar</button>}
      </div>
      <div className="content centered" key={i} style={{ gap: 20, animation: 'in-forward .3s' }}>
        <div className="illus"><Icon name={icon} size={90} color="var(--accent)" /></div>
        <h1 className="h1">{title}</h1>
        <p className="body muted" style={{ margin: 0, maxWidth: 300 }}>{text}</p>
        <div className="dots" aria-label={`Pantalla ${i + 1} de 3`}>{SLIDES.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
      </div>
      <div className="footer">
        <Button onClick={() => (i < 2 ? setI(i + 1) : done())}>{i < 2 ? 'Siguiente' : 'Empezar'}</Button>
      </div>
    </Screen>
  )
}

export function Welcome({ direction }) {
  const { backend } = useApp()
  return (
    <Screen surface direction={direction}>
      <div className="content centered" style={{ gap: 16 }}>
        <AppLogo size={84} />
        <h1 className="h1">Bienvenido a Presupuestito</h1>
        <p className="body muted" style={{ margin: 0, maxWidth: 300 }}>Armá, guardá y compartí tus presupuestos desde el celular.</p>
        <div className="row" style={{ gap: 20, paddingTop: 24 }}>
          {[['description', 'Calcula solo'], ['share', 'PDF por WhatsApp'], ['edit', 'Fácil de editar']].map(([ic, l]) => (
            <div key={l} className="stack-8" style={{ alignItems: 'center' }}>
              <Round icon={ic} size={64} />
              <span className="caption muted">{l}</span>
            </div>
          ))}
        </div>
        {backend.mode === 'demo' && <span className="demo-tag">Modo demo: los datos se guardan en este dispositivo</span>}
      </div>
      <div className="footer">
        <Button onClick={() => navigate('/registro')}>Crear cuenta</Button>
        <Button variant="secondary" onClick={() => navigate('/ingresar')}>Ya tengo cuenta: Ingresar</Button>
      </div>
    </Screen>
  )
}

export function Login({ direction }) {
  const { backend } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!EMAIL_RE.test(email.trim())) return setError('Revisá el email: parece incompleto.')
    if (!password) return setError('Ingresá tu contraseña.')
    setLoading(true)
    try {
      await backend.auth.signIn({ email: email.trim(), password })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }
  const google = async () => {
    setError('')
    try {
      await backend.auth.signInWithGoogle()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Screen surface direction={direction}>
      <AppBar title="Ingresar" />
      <form className="content" style={{ gap: 20, paddingTop: 28 }} onSubmit={submit} noValidate>
        <div className="stack">
          <h1 className="h1">¡Hola de nuevo!</h1>
          <span className="small muted">Ingresá con tu email.</span>
        </div>
        <Field label="Email" id="email">
          <input id="email" type="email" inputMode="email" autoComplete="email" placeholder="juan@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Contraseña" id="password">
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="right"><button type="button" className="link" onClick={() => navigate('/recuperar')}>¿Olvidaste tu contraseña?</button></div>
        {error && <div className="alert err" role="alert">{error}</div>}
        <div className="grow" />
        <Button type="submit" loading={loading}>Ingresar</Button>
        <Button type="button" variant="secondary" onClick={google}>Continuar con Google</Button>
        <div className="center small">¿No tenés cuenta? <button type="button" className="link" onClick={() => navigate('/registro', { replace: true })}>Crear cuenta</button></div>
      </form>
    </Screen>
  )
}

export function Register({ direction }) {
  const { backend } = useApp()
  const [step, setStep] = useState(1)
  const [f, setF] = useState({ full_name: '', email: '', password: '', trade: '', business_name: '', phone: '' })
  const [touched, setTouched] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [taken, setTaken] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const touch = (k) => () => setTouched({ ...touched, [k]: true })

  const errs = {
    full_name: f.full_name.trim().length < 2 ? 'Escribí tu nombre y apellido.' : '',
    email: !EMAIL_RE.test(f.email.trim()) ? (f.email.includes('@') ? 'Revisá el email: falta el dominio.' : 'Revisá el email: falta la @.') : '',
    ...(taken && f.email.trim().toLowerCase() === taken ? { email: 'Este email ya está registrado. Probá ingresar.' } : {}),
    password: !passwordOk(f.password) ? 'Usá al menos 8 caracteres, con letras y números.' : '',
  }
  const step1Ok = !errs.full_name && !errs.email && !errs.password

  const submit = async () => {
    setError('')
    if (!f.trade) return setError('Elegí a qué te dedicás.')
    setLoading(true)
    try {
      const res = await backend.auth.signUp({
        email: f.email.trim(),
        password: f.password,
        meta: { full_name: f.full_name.trim(), trade: f.trade, business_name: f.business_name.trim() || f.full_name.trim(), phone: f.phone.trim() },
      })
      if (res.needsConfirmation) setSentTo(f.email.trim())
    } catch (err) {
      if (err.taken || /registrad|already registered/i.test(err.message)) {
        setTaken(f.email.trim().toLowerCase()); setTouched({ ...touched, email: true }); setStep(1)
      } else setError(err.message)
    }
    setLoading(false)
  }

  if (sentTo) {
    return (
      <Screen surface direction={direction}>
        <div className="content centered" style={{ gap: 16 }}>
          <Round icon="mail" size={120} />
          <h1 className="h1">Revisá tu email</h1>
          <p className="body muted" style={{ margin: 0 }}>Te mandamos un enlace a <b>{sentTo}</b> para confirmar tu cuenta. Abrilo desde este celular y listo.</p>
        </div>
        <div className="footer"><Button onClick={() => navigate('/ingresar', { replace: true })}>Ir a ingresar</Button></div>
      </Screen>
    )
  }

  return (
    <Screen surface direction={direction}>
      <AppBar title="Crear cuenta" onBack={step === 2 ? () => setStep(1) : undefined} />
      <div className="content">
        <div className="stack-8">
          <span className="small muted" style={{ fontWeight: 600 }}>Paso {step} de 2 · {step === 1 ? 'Tus datos' : 'Tu oficio'}</span>
          <div className="progress2"><i className="on" /><i className={step === 2 ? 'on' : ''} /></div>
        </div>
        {step === 1 ? (
          <>
            <Field label="Nombre y apellido" id="name" error={touched.full_name && errs.full_name}>
              <input id="name" autoComplete="name" placeholder="Ej.: Carlos Gómez" value={f.full_name} onChange={set('full_name')} onBlur={touch('full_name')} />
            </Field>
            <Field label="Email" id="remail" error={touched.email && errs.email}>
              <input id="remail" type="email" inputMode="email" autoComplete="email" placeholder="carlos@gmail.com" value={f.email} onChange={set('email')} onBlur={touch('email')} />
            </Field>
            <Field label="Contraseña" id="rpass" error={touched.password && errs.password}>
              <PasswordInput id="rpass" autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={f.password} onChange={set('password')} />
            </Field>
            {passwordOk(f.password) && <span className="ok-msg">✓ Al menos 8 caracteres, con letras y números</span>}
          </>
        ) : (
          <>
            <h2 className="h3">¿A qué te dedicás?</h2>
            <div className="chips wrap">
              {TRADES.map((t) => <Chip key={t} on={f.trade === t} onClick={() => setF({ ...f, trade: t })}>{t}</Chip>)}
            </div>
            <Field label="Nombre para el presupuesto" id="biz" hint="Puede ser tu nombre o el de tu negocio.">
              <input id="biz" placeholder="Ej.: Pinturas Gómez" value={f.business_name} onChange={set('business_name')} />
            </Field>
            <Field label="Teléfono de contacto" id="phone">
              <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="299 400-0000" value={f.phone} onChange={set('phone')} />
            </Field>
            <span className="caption muted">Estos datos aparecen en el encabezado del PDF.</span>
          </>
        )}
        {error && <div className="alert err" role="alert">{error}</div>}
      </div>
      <div className="footer">
        {step === 1 ? (
          <>
            <Button disabled={!step1Ok} onClick={() => setStep(2)}>Continuar</Button>
            <span className="caption muted center">{step1Ok ? 'Datos completos: ya podés continuar.' : 'El botón se activa cuando los datos son válidos.'}</span>
          </>
        ) : (
          <Button loading={loading} onClick={submit}>Crear cuenta</Button>
        )}
      </div>
    </Screen>
  )
}

export function Recover({ direction }) {
  const { backend } = useApp()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!EMAIL_RE.test(email.trim())) return setError('Revisá el email: parece incompleto.')
    setLoading(true)
    try {
      await backend.auth.resetPassword(email.trim())
      setSent(true)
    } catch (err) {
      if (err.taken || /registrad|already registered/i.test(err.message)) {
        setTaken(f.email.trim().toLowerCase()); setTouched({ ...touched, email: true }); setStep(1)
      } else setError(err.message)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <Screen surface direction={direction}>
        <AppBar title="Recuperar contraseña" />
        <div className="content centered" style={{ gap: 16 }}>
          <Round icon="mail" size={120} />
          <h1 className="h1">Revisá tu email</h1>
          <p className="body muted" style={{ margin: 0 }}>
            Si hay una cuenta con <b>{email}</b>, te llega un enlace para crear una contraseña nueva. Abrilo desde este celular.
          </p>
          {backend.mode === 'demo' && <span className="demo-tag">En modo demo no se envían emails</span>}
        </div>
        <div className="footer"><Button onClick={() => navigate('/ingresar', { replace: true })}>Volver a ingresar</Button></div>
      </Screen>
    )
  }

  return (
    <Screen surface direction={direction}>
      <AppBar title="Recuperar contraseña" />
      <form className="content" style={{ paddingTop: 32 }} onSubmit={submit} noValidate>
        <Round icon="help" size={96} />
        <h1 className="h1">¿Olvidaste tu contraseña?</h1>
        <p className="body muted" style={{ margin: 0 }}>Te mandamos un enlace a tu email para que crees una nueva.</p>
        <Field label="Email" id="remail2" error={error}>
          <input id="remail2" type="email" inputMode="email" autoComplete="email" placeholder="juan@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <div className="grow" />
        <Button type="submit" loading={loading}>Enviar enlace</Button>
      </form>
    </Screen>
  )
}

// Resultado de abrir el enlace del email (verificar cuenta o enlace vencido)
export function EmailLinkResult({ direction }) {
  const { session, emailLink, setEmailLink } = useApp()
  const ok = emailLink?.ok
  const isRecovery = emailLink?.type === 'recovery'
  const go = () => setEmailLink(null) // App redirige a Inicio o a Ingresar

  return (
    <Screen surface direction={direction}>
      <div className="content centered" style={{ gap: 16 }}>
        {ok ? (
          <>
            <Round icon="check_circle" size={120} bg="var(--ok-bg)" color="var(--ok)" />
            <h1 className="h1">¡Tu cuenta está verificada!</h1>
            <p className="body muted" style={{ margin: 0 }}>Ya podés armar tu primer presupuesto y mandarlo por WhatsApp.</p>
          </>
        ) : (
          <>
            <Round icon="error" size={120} bg="var(--err-bg)" color="var(--err)" />
            <h1 className="h1">El enlace no es válido</h1>
            <p className="body muted" style={{ margin: 0 }}>
              {isRecovery
                ? 'Puede que haya vencido o que ya lo hayas usado. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".'
                : 'Puede que haya vencido o que ya lo hayas usado. Si ya verificaste tu cuenta, ingresá con tu email y contraseña.'}
            </p>
          </>
        )}
      </div>
      <div className="footer">
        <Button onClick={go}>{session ? 'Empezar' : 'Ir a ingresar'}</Button>
      </div>
    </Screen>
  )
}

export function NewPassword({ direction }) {
  const { backend, setRecovery } = useApp()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!passwordOk(p1)) return setError('Usá al menos 8 caracteres, con letras y números.')
    if (p1 !== p2) return setError('Las contraseñas no coinciden.')
    setLoading(true)
    try {
      await backend.auth.updatePassword(p1)
      setDone(true)
    } catch (err) {
      if (err.taken || /registrad|already registered/i.test(err.message)) {
        setTaken(f.email.trim().toLowerCase()); setTouched({ ...touched, email: true }); setStep(1)
      } else setError(err.message)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <Screen surface direction={direction}>
        <div className="content centered" style={{ gap: 16 }}>
          <Round icon="check_circle" size={120} bg="var(--ok-bg)" color="var(--ok)" />
          <h1 className="h1">Contraseña actualizada</h1>
          <p className="body muted" style={{ margin: 0 }}>Ya podés usar tu nueva contraseña.</p>
        </div>
        <div className="footer">
          <Button onClick={() => { setRecovery(false); navigate('/inicio', { replace: true }) }}>Ir al inicio</Button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen surface direction={direction}>
      <AppBar title="Nueva contraseña" back={false} />
      <form className="content" onSubmit={submit} noValidate>
        <p className="body muted" style={{ margin: 0 }}>Elegí una contraseña nueva para tu cuenta.</p>
        <Field label="Nueva contraseña" id="np1">
          <PasswordInput id="np1" autoComplete="new-password" value={p1} onChange={(e) => setP1(e.target.value)} />
        </Field>
        <Field label="Repetir contraseña" id="np2">
          <PasswordInput id="np2" autoComplete="new-password" value={p2} onChange={(e) => setP2(e.target.value)} />
        </Field>
        {error && <div className="alert err" role="alert">{error}</div>}
        <div className="grow" />
        <Button type="submit" loading={loading}>Guardar contraseña</Button>
      </form>
    </Screen>
  )
}
