#!/usr/bin/env ts-node

// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
import path from 'path'

const envPath = path.join(__dirname, '..', '.env')
console.log('Loading .env from:', envPath)
dotenv.config({ path: envPath })

// Now import services that depend on environment variables
import { supabase } from '../src/config/database'

async function findSuperAdmin() {
  console.log('🔍 Looking for existing super admin account...\n')
  
  try {
    const { data: superAdmins, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        created_at,
        user_roles!fk_user_roles_user!inner(role_name, is_active)
      `)
      .eq('user_roles.role_name', 'super-admin')
      .eq('user_roles.is_active', true)

    if (error) {
      console.error('❌ Error finding super admin:', error)
      return
    }

    if (superAdmins && superAdmins.length > 0) {
      console.log(`✅ Found ${superAdmins.length} super admin account(s):`)
      superAdmins.forEach((admin, index) => {
        console.log(`\n--- Super Admin ${index + 1} ---`)
        console.log('📧 Email:', admin.email)
        console.log('👤 Full Name:', admin.full_name)
        console.log('🆔 ID:', admin.id)
        console.log('📅 Created:', admin.created_at)
      })
      console.log('\n💡 You can use any of these emails to log in.')
      console.log('🔑 If you forgot the password, you can reset it using the reset-admin-password.js script.')
    } else {
      console.log('❌ No super admin account found. System needs initialization.')
    }
    
  } catch (error) {
    console.error('❌ Error during search:', error)
  }
}

findSuperAdmin()
  .then(() => {
    console.log('\n🏁 Search completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })