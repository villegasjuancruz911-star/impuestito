// Elige el backend: Supabase si hay credenciales, si no el modo demo local.
import { createSupabaseBackend } from './supabase.js'
import { createLocalBackend } from './local.js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const backend = url && key ? createSupabaseBackend(url, key) : createLocalBackend()
