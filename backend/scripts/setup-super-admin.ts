import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

import { supabase } from '../src/config/database'
import { hashPassword } from '../src/utils/password'
import { RoleService } from '../src/services/role.service'

const SUPER_ADMIN_EMAIL = 'admin@go3net.com'
const SUPER_ADMIN_PASSWORD = 'Admin123!'

async function setupSuperAdmin() {
  console.log('🚀 Setting up Super Admin with specified credentials...')
  
  try {
    const roleService = new RoleService()
    
    // Check if super admin already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', SUPER_ADMIN_EMAIL)
      .single()
    
    if (existingUser) {
      console.log('👤 Super admin user already exists, updating password...')
      
      // Update password
      const hashedPassword = await hashPassword(SUPER_ADMIN_PASSWORD)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          account_status: 'active',
          status: 'active',
          is_temporary_password: false,
          last_password_change: new Date().toISOString()
        })
        .eq('id', existingUser.id)
      
      if (updateError) {
        throw new Error(`Failed to update super admin password: ${updateError.message}`)
      }
      
      // Ensure super-admin role is assigned
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('role_name', 'super-admin')
        .eq('is_active', true)
        .single()
      
      if (!existingRole) {
        console.log('🔑 Assigning super-admin role...')
        const roleResult = await roleService.assignRole(
          existingUser.id,
          'super-admin',
          existingUser.id
        )
        
        if (!roleResult.success) {
          throw new Error(`Failed to assign super-admin role: ${roleResult.message}`)
        }
      }
      
      console.log('✅ Super admin updated successfully!')
    } else {
      console.log('👤 Creating new super admin user...')
      
      // Create new super admin user
      const hashedPassword = await hashPassword(SUPER_ADMIN_PASSWORD)
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: SUPER_ADMIN_EMAIL,
          full_name: 'System Administrator',
          password_hash: hashedPassword,
          employee_id: 'ADMIN001',
          hire_date: new Date().toISOString().split('T')[0],
          account_status: 'active',
          status: 'active',
          is_temporary_password: false,
          last_password_change: new Date().toISOString()
        })
        .select()
        .single()
      
      if (userError) {
        throw new Error(`Failed to create super admin user: ${userError.message}`)
      }
      
      console.log('🔑 Assigning super-admin role...')
      const roleResult = await roleService.assignRole(
        newUser.id,
        'super-admin',
        newUser.id
      )
      
      if (!roleResult.success) {
        throw new Error(`Failed to assign super-admin role: ${roleResult.message}`)
      }
      
      console.log('✅ Super admin created successfully!')
    }
    
    console.log('📧 Email:', SUPER_ADMIN_EMAIL)
    console.log('🔑 Password:', SUPER_ADMIN_PASSWORD)
    console.log('🎯 Role: super-admin')
    console.log('✨ Setup complete!')
    
  } catch (error) {
    console.error('❌ Error setting up super admin:', error)
    process.exit(1)
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupSuperAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Setup failed:', error)
      process.exit(1)
    })
}

export { setupSuperAdmin }