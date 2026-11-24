// Backend de demostración: guarda todo en el navegador (localStorage).
// Se usa cuando no hay datos de Supabase configurados, para probar la app sin servidor.

const KEY = 'presufacil-demo-db'
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))
const now = () => new Date().toISOString()

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null
  } catch {
    return null
  }
}

export function createLocalBackend() {
  let db = load() || { users: [], session: null, profiles: {}, clients: [], budgets: [], items: [] }
  const listeners = new Set()
  const save = () => localStorage.setItem(KEY, JSON.stringify(db))
  const emit = (event) => listeners.forEach((cb) => cb(event, session()))
  const session = () => {
    if (!db.session) return null
    const u = db.users.find((x) => x.id === db.session)
    return u ? { user: { id: u.id, email: u.email } } : null
  }
  const uid = () => {
    if (!db.session) throw new Error('Tu sesión venció. Volvé a ingresar.')
    return db.session
  }
  const mine = (rows) => rows.filter((r) => r.user_id === db.session)

  return {
    mode: 'demo',

    auth: {
      async getSession() {
        return session()
      },
      onChange(cb) {
        listeners.add(cb)
        return () => listeners.delete(cb)
      },
      async signUp({ email, password, meta }) {
        await delay()
        const e = email.trim().toLowerCase()
        if (db.users.some((u) => u.email === e)) throw Object.assign(new Error('Este email ya está registrado. Probá ingresar.'), { taken: true })
        const id = uuid()
        db.users.push({ id, email: e, password })
        db.profiles[id] = { id, full_name: meta.full_name || '', trade: meta.trade || '', business_name: meta.business_name || '', phone: meta.phone || '' }
        db.session = id
        save()
        emit('SIGNED_IN')
        return { needsConfirmation: false }
      },
      async signIn({ email, password }) {
        await delay()
        const u = db.users.find((x) => x.email === email.trim().toLowerCase() && x.password === password)
        if (!u) throw new Error('El email o la contraseña no son correctos.')
        db.session = u.id
        save()
        emit('SIGNED_IN')
      },
      async signInWithGoogle() {
        throw new Error('El ingreso con Google funciona cuando la app está conectada a Supabase.')
      },
      async resetPassword(email) {
        await delay()
        if (!db.users.some((u) => u.email === email.trim().toLowerCase())) return
      },
      async updatePassword(password) {
        await delay()
        const u = db.users.find((x) => x.id === uid())
        u.password = password
        save()
      },
      async consumeEmailLink() {
        return null // en modo demo no hay emails
      },
      async signOut() {
        db.session = null
        save()
        emit('SIGNED_OUT')
      },
    },

    async getProfile() {
      await delay(60)
      const id = uid()
      return db.profiles[id] || { id, full_name: '', trade: '', business_name: '', phone: '' }
    },

    async updateProfile(patch) {
      await delay()
      const id = uid()
      db.profiles[id] = { ...db.profiles[id], ...patch, id }
      save()
      return db.profiles[id]
    },

    async listBudgets() {
      await delay(80)
      return mine(db.budgets).sort((a, b) => b.created_at.localeCompare(a.created_at))
    },

    async getBudget(id) {
      await delay(60)
      const b = mine(db.budgets).find((x) => x.id === id)
      if (!b) return null
      return { ...b, items: db.items.filter((i) => i.budget_id === id).sort((a, c) => a.position - c.position) }
    },

    async saveBudget(budget) {
      await delay()
      const user_id = uid()
      let client_id = budget.client_id || null
      const name = (budget.client_name || '').trim()
      const phone = (budget.client_phone || '').trim()
      if (!client_id && name) {
        const found = mine(db.clients).find((c) => c.name.toLowerCase() === name.toLowerCase())
        if (found) client_id = found.id
        else {
          client_id = uuid()
          db.clients.push({ id: client_id, user_id, name, phone, created_at: now() })
        }
      }
      const client = db.clients.find((c) => c.id === client_id)
      if (client && phone) client.phone = phone
      const total = budget.items.reduce((a, it) => a + Number(it.quantity) * Number(it.unit_price), 0)
      let row
      if (budget.id) {
        row = mine(db.budgets).find((x) => x.id === budget.id)
        if (!row) throw new Error('No se encontró el presupuesto')
        Object.assign(row, {
          client_id, client_name: name, client_phone: phone, description: budget.description || '',
          status: budget.status || row.status, validity_days: Number(budget.validity_days) || 15, total, updated_at: now(),
        })
        db.items = db.items.filter((i) => i.budget_id !== row.id)
      } else {
        const number = mine(db.budgets).reduce((m, b) => Math.max(m, b.number), 0) + 1
        row = {
          id: uuid(), user_id, number, client_id, client_name: name, client_phone: phone,
          description: budget.description || '', status: budget.status || 'borrador',
          validity_days: Number(budget.validity_days) || 15, total, created_at: now(), updated_at: now(),
        }
        db.budgets.push(row)
      }
      budget.items.forEach((it, position) => {
        db.items.push({
          id: uuid(), budget_id: row.id, user_id, kind: it.kind, description: it.description.trim(),
          quantity: Number(it.quantity), unit: it.unit || 'u', unit_price: Number(it.unit_price), position,
        })
      })
      save()
      return this.getBudget(row.id)
    },

    async setBudgetStatus(id, status) {
      await delay(60)
      const row = mine(db.budgets).find((x) => x.id === id)
      if (row) {
        row.status = status
        row.updated_at = now()
        save()
      }
      return row
    },

    async deleteBudget(id) {
      await delay(60)
      db.budgets = db.budgets.filter((b) => !(b.id === id && b.user_id === db.session))
      db.items = db.items.filter((i) => i.budget_id !== id)
      save()
    },

    async listClients() {
      await delay(60)
      return mine(db.clients).sort((a, b) => a.name.localeCompare(b.name))
    },
  }
}
