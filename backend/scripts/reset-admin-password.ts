// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
import path from 'path'

const envPath = path.join(__dirname, '..', '.env')
console.log('Loading .env from:', envPath)
dotenv.config({ path: envPath })

// Now import services that depend on environment variables
import { supabase } from '../src/config/database'
import { hashPassword } from '../src/utils/password'

async function resetAdminPassword() {
  console.log('🔑 Resetting admin password...\n')
  
  const email = 'admin@go3net.com'
  const newPassword = 'Admin123!'
  
  try {
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword)
    
    // Update the user's password
    const { data, error } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
    
    if (error) {
      console.error('❌ Error updating password:', error)
      return
    }
    
    if (data && data.length > 0) {
      console.log('✅ Password reset successful!')
      console.log('📧 Email:', email)
      console.log('🔑 New Password:', newPassword)
      console.log('\n💡 You can now log in with these credentials.')
    } else {
      console.log('❌ No user found with email:', email)
    }
    
  } catch (error) {
    console.error('❌ Error during password reset:', error)
  }
}

resetAdminPassword()
  .then(() => {
    console.log('\n🏁 Password reset completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })