// Backend real: Supabase (Auth + Postgres con RLS)
import { createClient } from '@supabase/supabase-js'

export function createSupabaseBackend(url, key) {
  const sb = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
  })

  const mapSession = (session) => (session ? { user: { id: session.user.id, email: session.user.email } } : null)
  const check = ({ data, error }) => {
    if (error) throw new Error(translateError(error.message))
    return data
  }
  const uid = async () => {
    const { data } = await sb.auth.getSession()
    if (!data.session) throw new Error('Tu sesión venció. Volvé a ingresar.')
    return data.session.user.id
  }
  const appUrl = () => window.location.origin + window.location.pathname

  return {
    mode: 'supabase',

    auth: {
      async getSession() {
        const { data } = await sb.auth.getSession()
        return mapSession(data.session)
      },
      onChange(cb) {
        const { data } = sb.auth.onAuthStateChange((event, session) => cb(event, mapSession(session)))
        return () => data.subscription.unsubscribe()
      },
      async signUp({ email, password, meta }) {
        const data = check(await sb.auth.signUp({
          email,
          password,
          options: { data: meta, emailRedirectTo: appUrl() },
        }))
        // Supabase no avisa si el email ya existe: devuelve un usuario sin identidades
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw Object.assign(new Error('Este email ya está registrado. Probá ingresar.'), { taken: true })
        return { needsConfirmation: !data.session }
      },
      async signIn({ email, password }) {
        check(await sb.auth.signInWithPassword({ email, password }))
      },
      async signInWithGoogle() {
        check(await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: appUrl() } }))
      },
      async resetPassword(email) {
        check(await sb.auth.resetPasswordForEmail(email, { redirectTo: appUrl() }))
      },
      async updatePassword(password) {
        check(await sb.auth.updateUser({ password }))
      },
      async signOut() {
        await sb.auth.signOut()
      },
      // Enlaces de los emails (verificar cuenta y recuperar contraseña):
      // traen ?token_hash=...&type=... y se verifican acá, así funcionan
      // aunque el email se abra en otro navegador o en otro celular.
      async consumeEmailLink() {
        const q = new URLSearchParams(window.location.search)
        const token_hash = q.get('token_hash')
        const type = q.get('type')
        if (!token_hash || !type) return null
        window.history.replaceState(null, '', window.location.pathname + window.location.hash)
        const { error } = await sb.auth.verifyOtp({ token_hash, type })
        return { type, ok: !error }
      },
    },

    async getProfile() {
      const id = await uid()
      const data = check(await sb.from('profiles').select('*').eq('id', id).maybeSingle())
      return data || { id, full_name: '', trade: '', business_name: '', phone: '' }
    },

    async updateProfile(patch) {
      const id = await uid()
      const { full_name, trade, business_name, phone, logo = '' } = patch
      return check(await sb.from('profiles')
        .upsert({ id, full_name, trade, business_name, phone, logo })
        .select().single())
    },

    async listBudgets() {
      return check(await sb.from('budgets').select('*').order('created_at', { ascending: false }))
    },

    async getBudget(id) {
      const data = check(await sb.from('budgets').select('*, budget_items(*)').eq('id', id).maybeSingle())
      if (!data) return null
      const { budget_items: items = [], ...budget } = data
      return { ...budget, items: items.sort((a, b) => a.position - b.position) }
    },

    async saveBudget(budget) {
      const payload = {
        id: budget.id || null,
        client_id: budget.client_id || null,
        client_name: budget.client_name,
        client_phone: budget.client_phone,
        description: budget.description,
        status: budget.status,
        validity_days: budget.validity_days,
        items: budget.items.map(({ kind, description, quantity, unit, unit_price }) => ({
          kind, description, quantity: Number(quantity), unit, unit_price: Number(unit_price),
        })),
      }
      const id = check(await sb.rpc('save_budget', { p: payload }))
      return this.getBudget(id)
    },

    async setBudgetStatus(id, status) {
      return check(await sb.from('budgets').update({ status }).eq('id', id).select().single())
    },

    async deleteBudget(id) {
      check(await sb.from('budgets').delete().eq('id', id))
    },

    async listClients() {
      return check(await sb.from('clients').select('*').order('name'))
    },
  }
}

function translateError(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'El email o la contraseña no son correctos.'
  if (m.includes('email not confirmed')) return 'Todavía no confirmaste tu email. Revisá tu bandeja de entrada.'
  if (m.includes('user already registered')) return 'Este email ya está registrado. Probá ingresar.'
  if (m.includes('password should be at least')) return 'La contraseña tiene que tener al menos 8 caracteres.'
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Hiciste muchos intentos seguidos. Esperá un minuto y volvé a probar.'
  if (m.includes('provider is not enabled')) return 'El ingreso con Google todavía no está habilitado.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'No hay conexión. Revisá internet y volvé a intentar.'
  return msg || 'Algo salió mal. Volvé a intentar.'
}
