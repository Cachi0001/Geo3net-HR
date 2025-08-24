#!/usr/bin/env ts-node

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { hashPassword } from '../src/utils/password'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createEmployees() {
  console.log('🚀 Creating test employees...')
  
  try {
    // Get admin user ID for created_by field
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'kayode@go3net.com.ng')
      .single()
    
    const adminId = adminUser?.id
    if (!adminId) {
      console.error('❌ Admin user not found. Please ensure kayode@go3net.com.ng exists.')
      process.exit(1)
    }
    
    // Create test employees
    const employees = [
      {
        email: 'john.doe@test.com',
        full_name: 'John Doe',
        employee_id: 'EMP001',
        salary: 75000
      },
      {
        email: 'jane.smith@test.com',
        full_name: 'Jane Smith',
        employee_id: 'EMP002',
        salary: 65000
      },
      {
        email: 'mike.johnson@test.com',
        full_name: 'Mike Johnson',
        employee_id: 'EMP003',
        salary: 55000
      }
    ]
    
    for (const emp of employees) {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', emp.email)
        .single()
      
      let userId = existingUser?.id
      
      if (!userId) {
        // Create user
        const hashedPassword = await hashPassword('Employee123!')
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: emp.email,
            full_name: emp.full_name,
            password_hash: hashedPassword,
            employee_id: emp.employee_id,
            hire_date: new Date().toISOString().split('T')[0],
            account_status: 'active',
            status: 'active'
          })
          .select()
          .single()
        
        if (userError) {
          console.error(`❌ Failed to create user ${emp.full_name}:`, userError.message)
          continue
        }
        
        userId = newUser.id
        console.log(`✅ User created: ${emp.full_name}`)
        
        // Assign employee role
        await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role_name: 'employee',
            permissions: ['profile.read', 'profile.update'],
            is_active: true
          })
      }
      
      // Check if employee record exists
      const { data: existingEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userId)
        .single()
      
      if (!existingEmployee) {
        // Create employee record
        const { error: empError } = await supabase
          .from('employees')
          .insert({
            user_id: userId,
            employee_id: emp.employee_id,
            full_name: emp.full_name,
            email: emp.email,
            hire_date: new Date().toISOString().split('T')[0],
            employment_status: 'active',
            salary: emp.salary,
            created_by: adminId
          })
        
        if (empError) {
          console.error(`❌ Failed to create employee record for ${emp.full_name}:`, empError.message)
        } else {
          console.log(`✅ Employee record created: ${emp.full_name}`)
        }
      } else {
        console.log(`ℹ️ Employee record already exists: ${emp.full_name}`)
      }
    }
    
    console.log('🎉 Employee creation completed!')
    
  } catch (error) {
    console.error('❌ Error creating employees:', error)
    process.exit(1)
  }
}

createEmployees()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })