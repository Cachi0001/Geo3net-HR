require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLogin() {
  try {
    console.log('🔍 Checking all users...');
    
    // Check all users first
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('id, email, employee_id, full_name')
      .limit(10);
    
    console.log('All users:', allUsers);
    
    // Check if admin user exists
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, password_hash, full_name, employee_id')
      .eq('email', 'admin@test.com');
    
    console.log('Admin query result:', { users, error });
    
    if (error) {
      console.log('❌ Query error:', error.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No admin user found, creating one...');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: 'admin@test.com',
          full_name: 'Test Admin',
          password_hash: hashedPassword,
          employee_id: 'ADMIN001',
          hire_date: new Date().toISOString().split('T')[0],
          account_status: 'active',
          status: 'active'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create user:', createError.message);
        return;
      }
      
      console.log('✅ Admin user created:', newUser.email);
      
      // Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: newUser.id,
          role_name: 'hr-admin',
          permissions: ['*'],
          is_active: true
        });
      
      if (roleError) {
        console.log('⚠️ Role assignment failed:', roleError.message);
      } else {
        console.log('✅ Role assigned successfully');
      }
      
      return;
    }
    
    const user = users[0];
    
    console.log('✅ User found:', user.email);
    
    // Test password
    const isValid = await bcrypt.compare('Admin123!', user.password_hash);
    console.log('🔐 Password valid:', isValid);
    
    if (!isValid) {
      console.log('🔧 Updating password...');
      const newHash = await bcrypt.hash('Admin123!', 12);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('❌ Failed to update password:', updateError.message);
      } else {
        console.log('✅ Password updated successfully');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();