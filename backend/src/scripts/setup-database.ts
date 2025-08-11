import { supabase } from '../config/database'
import fs from 'fs'
import path from 'path'

export const setupDatabase = async () => {
  try {
    console.log('Setting up database schema...')
    
    const schemaPath = path.join(__dirname, '../../database/schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    const { error } = await supabase.rpc('exec_sql', { sql: schema })
    
    if (error) {
      console.error('Database setup failed:', error)
      throw error
    }
    
    console.log('Database schema created successfully!')
    return true
  } catch (error) {
    console.error('Error setting up database:', error)
    throw error
  }
}

if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}