const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSuperAdminLogin() {
  console.log('🔍 Testing super admin login...');
  
  try {
    // Check if super admin user exists
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@go3net.com');
    
    if (userError) {
      console.error('❌ Error checking user:', userError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ Super admin user not found. Creating...');
      
      // Create super admin user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            email: 'admin@go3net.com',
            password_hash: hashedPassword,
            full_name: 'Super Administrator',
            role: 'super-admin',
            status: 'active',
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (createError) {
        console.error('❌ Error creating super admin:', createError);
        return;
      }
      
      console.log('✅ Super admin user created:', newUser[0]);
    } else {
      console.log('✅ Super admin user found:', users[0]);
      
      // Update password if needed
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          role: 'super-admin',
          status: 'active',
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', 'admin@go3net.com');
      
      if (updateError) {
        console.error('❌ Error updating super admin:', updateError);
        return;
      }
      
      console.log('✅ Super admin user updated with correct password and role');
    }
    
    // Test dashboard endpoints
    console.log('\n🔍 Testing dashboard endpoints...');
    
    // Test super admin dashboard endpoint
    const response = await fetch('http://localhost:5003/api/dashboard/super-admin', {
      headers: {
        'Authorization': 'Bearer test-token' // This would need a real token
      }
    });
    
    console.log('📊 Dashboard endpoint status:', response.status);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testSuperAdminLogin();