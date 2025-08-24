#!/usr/bin/env ts-node

// Load environment variables FIRST
import dotenv from 'dotenv'
import path from 'path'

const envPath = path.join(__dirname, '..', '.env')
console.log('Loading .env from:', envPath)
dotenv.config({ path: envPath })

// Import after env is loaded
import { supabase } from '../src/config/database'

async function verifySpecificEmployee() {
  const userId = '6557ba97-11de-478b-96f0-75a4da4db358'
  console.log(`🔍 Checking employee record for user: ${userId}`)
  
  try {
    // Check user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, employee_id')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      console.log('❌ User not found:', userError?.message)
      return
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      employeeId: user.employee_id
    })
    
    // Check employee record
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, user_id, employee_id, full_name, email')
      .eq('user_id', userId)
      .single()
    
    if (employeeError || !employee) {
      console.log('❌ Employee record not found:', employeeError?.message)
      
      // Try to create it
      console.log('🔧 Creating employee record...')
      const { data: newEmployee, error: createError } = await supabase
        .from('employees')
        .insert({
          user_id: user.id,
          employee_id: user.employee_id,
          full_name: user.full_name,
          email: user.email,
          hire_date: new Date().toISOString().split('T')[0],
          employment_status: 'active',
          created_by: user.id
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Failed to create employee record:', createError.message)
      } else {
        console.log('✅ Employee record created:', newEmployee)
      }
    } else {
      console.log('✅ Employee record found:', {
        id: employee.id,
        userId: employee.user_id,
        employeeId: employee.employee_id,
        fullName: employee.full_name,
        email: employee.email
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

verifySpecificEmployee().then(() => {
  console.log('🏁 Verification completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Verification failed:', error)
  process.exit(1)
})