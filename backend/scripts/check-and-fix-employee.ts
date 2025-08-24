#!/usr/bin/env ts-node

// Load environment variables FIRST
import dotenv from 'dotenv'
import path from 'path'

const envPath = path.join(__dirname, '..', '.env')
console.log('Loading .env from:', envPath)
dotenv.config({ path: envPath })

// Import after env is loaded
import { supabase } from '../src/config/database'

async function checkAndFixEmployee() {
  console.log('🔍 Checking employee records...')
  
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, employee_id')
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
      return
    }
    
    console.log(`📊 Found ${users?.length || 0} users`)
    
    // Get all employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, user_id, employee_id, full_name')
    
    if (employeesError) {
      console.error('❌ Error fetching employees:', employeesError.message)
      return
    }
    
    console.log(`📊 Found ${employees?.length || 0} employee records`)
    
    // Find users without employee records
    const usersWithoutEmployees = users?.filter(user => 
      !employees?.some(emp => emp.user_id === user.id)
    ) || []
    
    console.log(`🔍 Found ${usersWithoutEmployees.length} users without employee records`)
    
    // Create missing employee records
    for (const user of usersWithoutEmployees) {
      console.log(`🔧 Creating employee record for: ${user.full_name} (${user.email})`)
      
      const { error: createError } = await supabase
        .from('employees')
        .insert({
          user_id: user.id,
          employee_id: user.employee_id,
          full_name: user.full_name,
          email: user.email,
          hire_date: new Date().toISOString().split('T')[0],
          employment_status: 'active',
          created_by: user.id // Self-created for now
        })
      
      if (createError) {
        console.error(`❌ Failed to create employee record for ${user.full_name}:`, createError.message)
      } else {
        console.log(`✅ Employee record created for ${user.full_name}`)
      }
    }
    
    console.log('\n✅ Employee check and fix completed!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkAndFixEmployee().then(() => {
  console.log('🏁 Script completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})