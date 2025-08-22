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
  console.log('Required variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestData() {
  console.log('🚀 Creating test data for Go3net HR Management System...')
  
  try {
    // Test database connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message)
      process.exit(1)
    }
    
    console.log('✅ Database connection successful')
    
    // Create admin user
    const adminEmail = 'admin@test.com'
    const adminPassword = 'Admin123!'
    const hashedPassword = await hashPassword(adminPassword)
    
    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single()
    
    let adminId = existingAdmin?.id
    
    if (!adminId) {
      // Create admin user
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .insert({
          email: adminEmail,
          full_name: 'Test Admin',
          password_hash: hashedPassword,
          employee_id: 'ADMIN001',
          hire_date: new Date().toISOString().split('T')[0],
          account_status: 'active',
          status: 'active'
        })
        .select()
        .single()
      
      if (adminError) {
        console.error('❌ Failed to create admin user:', adminError.message)
        process.exit(1)
      }
      
      adminId = adminUser.id
      console.log('✅ Admin user created successfully')
      
      // Assign admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: adminId,
          role_name: 'hr-admin',
          permissions: ['*'],
          is_active: true
        })
      
      if (roleError) {
        console.error('❌ Failed to assign admin role:', roleError.message)
        process.exit(1)
      }
      
      console.log('✅ Admin role assigned successfully')
    } else {
      console.log('ℹ️ Admin user already exists')
    }
    
    // Create test employee
    const employeeEmail = 'employee@test.com'
    const employeePassword = 'Employee123!'
    const employeeHashedPassword = await hashPassword(employeePassword)
    
    // Check if employee already exists
    const { data: existingEmployee } = await supabase
      .from('users')
      .select('id')
      .eq('email', employeeEmail)
      .single()
    
    let employeeId = existingEmployee?.id
    let employeeDbId: string | undefined
    
    if (!employeeId) {
      // Create employee user
      const { data: employeeUser, error: employeeError } = await supabase
        .from('users')
        .insert({
          email: employeeEmail,
          full_name: 'Test Employee',
          password_hash: employeeHashedPassword,
          employee_id: 'EMP001',
          hire_date: new Date().toISOString().split('T')[0],
          account_status: 'active',
          status: 'active'
        })
        .select()
        .single()
      
      if (employeeError) {
        console.error('❌ Failed to create employee user:', employeeError.message)
        process.exit(1)
      }
      
      employeeId = employeeUser.id
      console.log('✅ Employee user created successfully')
      
      // Assign employee role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: employeeId,
          role_name: 'employee',
          permissions: ['profile.read', 'profile.update'],
          is_active: true
        })
      
      if (roleError) {
        console.error('❌ Failed to assign employee role:', roleError.message)
        process.exit(1)
      }
      
      console.log('✅ Employee role assigned successfully')
      
      // Create employee record in employees table
      const { data: employeeRecord, error: employeeRecordError } = await supabase
        .from('employees')
        .insert({
          user_id: employeeId,
          employee_id: 'EMP001',
          full_name: 'Test Employee',
          email: employeeEmail,
          hire_date: new Date().toISOString().split('T')[0],
          employment_status: 'active',
          salary: 50000,
          created_by: adminId
        })
        .select()
        .single()
      
      if (employeeRecordError) {
        console.error('❌ Failed to create employee record:', employeeRecordError.message)
        process.exit(1)
      }
      
      employeeDbId = employeeRecord.id
      console.log('✅ Employee record created successfully')
    } else {
      console.log('ℹ️ Employee user already exists')
      
      // Get employee record
      const { data: employeeRecord } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', employeeId)
        .single()
      
      employeeDbId = employeeRecord?.id
    }
    
    // Create test payroll period
    const periodStartDate = new Date()
    periodStartDate.setDate(1) // First day of current month
    
    const periodEndDate = new Date(periodStartDate)
    periodEndDate.setMonth(periodEndDate.getMonth() + 1)
    periodEndDate.setDate(0) // Last day of current month
    
    const { data: existingPeriod } = await supabase
      .from('payroll_periods')
      .select('id')
      .eq('name', `Payroll ${periodStartDate.toLocaleString('default', { month: 'long' })} ${periodStartDate.getFullYear()}`)
      .single()
    
    let periodId = existingPeriod?.id
    
    if (!periodId) {
      // Create payroll period
      const { data: period, error: periodError } = await supabase
        .from('payroll_periods')
        .insert({
          name: `Payroll ${periodStartDate.toLocaleString('default', { month: 'long' })} ${periodStartDate.getFullYear()}`,
          start_date: periodStartDate.toISOString().split('T')[0],
          end_date: periodEndDate.toISOString().split('T')[0],
          status: 'draft',
          created_by: adminId
        })
        .select()
        .single()
      
      if (periodError) {
        console.error('❌ Failed to create payroll period:', periodError.message)
        process.exit(1)
      }
      
      periodId = period.id
      console.log('✅ Payroll period created successfully')
    } else {
      console.log('ℹ️ Payroll period already exists')
    }
    
    console.log('\n🎉 TEST DATA CREATION SUCCESSFUL!\n')
    console.log('=' .repeat(50))
    console.log('📧 Admin Email:', adminEmail)
    console.log('🔑 Admin Password:', adminPassword)
    console.log('\n📧 Employee Email:', employeeEmail)
    console.log('🔑 Employee Password:', employeePassword)
    console.log('\n📅 Payroll Period ID:', periodId)
    console.log('=' .repeat(50))
    console.log('\n⚠️  IMPORTANT: Use these credentials for testing only!')
    
  } catch (error) {
    console.error('❌ Error during test data creation:', error)
    process.exit(1)
  }
}

// Run the script
createTestData()
  .then(() => {
    console.log('\n✨ Test data creation complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })