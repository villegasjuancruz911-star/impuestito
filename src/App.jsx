// Navegación y guardias de sesión
import { useEffect } from 'react'
import { useApp } from './state.jsx'
import { navigate, useRoute } from './lib/router.js'
import { BottomNav, Toast } from './components/ui.jsx'
import { EmailLinkResult, Login, NewPassword, Onboarding, Recover, Register, Splash, Welcome } from './screens/Access.jsx'
import { Accessibility, BudgetDetail, Budgets, Clients, Home, Profile, ProfileEdit } from './screens/Main.jsx'
import { BudgetEditor, Success } from './screens/Editor.jsx'

const PUBLIC = {
  '/onboarding': Onboarding,
  '/bienvenida': Welcome,
  '/ingresar': Login,
  '/registro': Register,
  '/recuperar': Recover,
}
const PRIVATE = {
  '/inicio': Home,
  '/presupuestos': Budgets,
  '/presupuesto/:id': BudgetDetail,
  '/nuevo': BudgetEditor,
  '/editar/:id': BudgetEditor,
  '/listo/:id': Success,
  '/perfil': Profile,
  '/perfil/editar': ProfileEdit,
  '/perfil/accesibilidad': Accessibility,
  '/clientes': Clients,
  '/nueva-contrasena': NewPassword,
}

export default function App() {
  const { session, recovery, emailLink, toast, notify } = useApp()
  const route = useRoute()
  const loading = session === undefined

  // Redirecciones según haya sesión o no
  const target = (() => {
    if (loading) return null
    if (emailLink) return route.pattern === '/cuenta-verificada' ? null : '/cuenta-verificada'
    if (route.pattern === '/cuenta-verificada') return session ? '/inicio' : '/ingresar'
    if (recovery) return route.pattern === '/nueva-contrasena' ? null : '/nueva-contrasena'
    if (session) return PRIVATE[route.pattern] ? null : '/inicio'
    if (PUBLIC[route.pattern]) return null
    return localStorage.getItem('presufacil-onboarded') ? '/bienvenida' : '/onboarding'
  })()

  useEffect(() => {
    if (target) navigate(target, { replace: true })
  }, [target])

  let content
  if (loading || target) content = <Splash />
  else {
    const Screen = route.pattern === '/cuenta-verificada' ? EmailLinkResult : (session ? PRIVATE : PUBLIC)[route.pattern]
    content = <Screen key={route.path + JSON.stringify(route.query)} params={route.params} query={route.query} direction={route.direction} />
  }

  // Barra inferior en todas las pantallas con sesión, salvo nueva contraseña
  const showNav = !loading && !target && session && PRIVATE[route.pattern] && route.pattern !== '/nueva-contrasena'
  const p = route.pattern
  const active = p === '/inicio' ? 'inicio' : /^\/(presupuesto|editar|listo)/.test(p) ? 'presupuestos' : /^\/(perfil|clientes)/.test(p) ? 'perfil' : ''

  return (
    <div className={`app ${showNav ? 'with-nav' : ''}`}>
      {content}
      {showNav && <BottomNav active={active} path={route.path} />}
      <Toast message={toast} onDone={() => notify('')} />
    </div>
  )
}
