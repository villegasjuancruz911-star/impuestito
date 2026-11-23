// Estado global: sesión, perfil del trabajador y avisos
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { backend } from './lib/backend/index.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = cargando
  const [profile, setProfile] = useState(null)
  const [toast, setToast] = useState('')
  const [recovery, setRecovery] = useState(false)
  const [emailLink, setEmailLink] = useState(null) // resultado del enlace del email: { type, ok }

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await backend.getProfile())
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const link = await backend.auth.consumeEmailLink()
      // sin chequear "alive": el enlace se consume una sola vez y su resultado no se puede perder
      if (link) {
        if (link.type === 'recovery' && link.ok) setRecovery(true)
        else setEmailLink(link)
      }
      const s = await backend.auth.getSession()
      if (alive) setSession(s)
    })()
    const off = backend.auth.onChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      setSession(s)
    })
    return () => {
      alive = false
      off()
    }
  }, [])

  useEffect(() => {
    if (session) loadProfile()
    else setProfile(null)
  }, [session, loadProfile])

  const value = useMemo(() => ({
    backend,
    session,
    profile,
    setProfile,
    reloadProfile: loadProfile,
    recovery,
    setRecovery,
    emailLink,
    setEmailLink,
    toast,
    notify: setToast,
  }), [session, profile, loadProfile, recovery, emailLink, toast])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}

// Carga de datos con estado de carga y error
export function useLoad(fn, deps) {
  const [state, setState] = useState({ loading: true, data: null, error: null })
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      setState({ loading: false, data: await fn(), error: null })
    } catch (e) {
      setState({ loading: false, data: null, error: e.message || 'No se pudo cargar.' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => {
    run()
  }, [run])
  return { ...state, reload: run }
}
