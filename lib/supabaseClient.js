import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

// Helper to detect obvious placeholder values (non-blocking, advisory only)
const looksLikePlaceholder = (key) => {
  if (!key || typeof key !== 'string') return true
  const trimmed = key.trim().toLowerCase()
  return trimmed.length < 20 || 
         trimmed.includes('your-') || 
         trimmed.includes('example') ||
         trimmed === 'placeholder' ||
         trimmed.startsWith('replace')
}

// Diagnostic logging (only in development, never logs full keys)
const logDiagnostics = () => {
  if (process.env.NODE_ENV !== 'development') return
  
  console.log('[Supabase Config Diagnostics]')
  console.log('URL present:', !!supabaseUrl, supabaseUrl ? `(${supabaseUrl.substring(0, 30)}...)` : '(missing)')
  console.log('Anon key present:', !!supabaseAnonKey, supabaseAnonKey ? `(length: ${supabaseAnonKey.length})` : '(missing)')
  console.log('Service key present:', !!supabaseServiceKey, supabaseServiceKey ? `(length: ${supabaseServiceKey.length})` : '(missing)')
  
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.warn('⚠️  URL should start with https://')
  }
  if (supabaseAnonKey && looksLikePlaceholder(supabaseAnonKey)) {
    console.warn('⚠️  Anon key looks like a placeholder (should be a long JWT token)')
  }
  if (supabaseServiceKey && looksLikePlaceholder(supabaseServiceKey)) {
    console.warn('⚠️  Service key looks like a placeholder (should be a long JWT token)')
  }
}

logDiagnostics()

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create clients - trim whitespace from keys to handle common copy-paste issues
const trimmedAnonKey = supabaseAnonKey?.trim()
const trimmedServiceKey = supabaseServiceKey?.trim()

export const supabase = createClient(
  supabaseUrl?.trim(),
  trimmedAnonKey || '',
  {
    auth: {
      persistSession: false
    }
  }
)

// Service role client for server-side operations
// Always create if URL and key exist - let Supabase validate the key when used
export const supabaseAdmin = (supabaseUrl?.trim() && trimmedServiceKey)
  ? createClient(supabaseUrl.trim(), trimmedServiceKey, {
      auth: {
        persistSession: false
      }
    })
  : null

// Helper to check if admin client is available
export const isSupabaseAdminAvailable = () => {
  if (!supabaseAdmin) {
    if (!supabaseServiceKey) {
      console.warn('Supabase admin client not available: SUPABASE_SERVICE_KEY is missing from .env.local')
    } else if (looksLikePlaceholder(supabaseServiceKey)) {
      console.warn('Supabase admin client not available: SUPABASE_SERVICE_KEY appears to be a placeholder')
    } else if (!supabaseUrl) {
      console.warn('Supabase admin client not available: NEXT_PUBLIC_SUPABASE_URL is missing')
    } else {
      console.warn('Supabase admin client not available: Configuration issue')
    }
    return false
  }
  return true
}
