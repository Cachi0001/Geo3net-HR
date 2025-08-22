import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  },
  global: {
    headers: {
      'Connection': 'keep-alive'
    }
  }
})

export const testConnection = async () => {
  try {
    console.log('Testing database connection...')
    // Use a simple query that doesn't require specific tables
    const { data, error } = await supabase.rpc('version')
    
    if (error && error.message !== 'function version() does not exist') {
      // If RPC fails, try a simple select
      console.log('RPC failed, trying table query...')
      const { error: tableError } = await supabase.from('users').select('id').limit(1)
      if (tableError) {
        throw tableError
      }
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (error: any) {
    console.error('❌ Database connection failed:', {
      message: error?.message || 'Unknown error',
      details: error?.stack || error?.toString(),
      hint: error?.hint || '',
      code: error?.code || ''
    })
    // Don't fail startup for database connection issues
    console.log('⚠️  Server will continue running without database connectivity check')
    return false
  }
}