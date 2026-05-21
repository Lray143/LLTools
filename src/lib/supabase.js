import { createClient } from '@supabase/supabase-js'

// These values come from your .env file
// Never hardcode them directly — .env is in .gitignore
// so they never get pushed to GitHub
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)