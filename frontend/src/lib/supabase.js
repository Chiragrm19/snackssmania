import { createClient } from '@supabase/supabase-js'

// Always ensure the app connects to the new active Supabase project
const NEW_SUPABASE_URL = 'https://myumvjyzfhwpseulejll.supabase.co'
const NEW_SUPABASE_KEY = 'sb_publishable_iNk0m1yk9BC10TWXd54lhw_nYkOKE-l'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('myumvjyzfhwpseulejll') 
  ? import.meta.env.VITE_SUPABASE_URL 
  : NEW_SUPABASE_URL

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_URL?.includes('myumvjyzfhwpseulejll')
  ? import.meta.env.VITE_SUPABASE_ANON_KEY 
  : NEW_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
