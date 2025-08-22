const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('🔧 Creating test user...');
    
    const email = 'test@admin.com';
    const password = 'TestAdmin123!';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      return;
    }
    
    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: email,
        full_name: 'Test Admin User',
        password_hash: hashedPassword,
        employee_id: 'TEST001',
        hire_date: new Date().toISOString().split('T')[0],
        account_status: 'active',
        status: 'active'
      })
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Failed to create user:', userError.message);
      return;
    }
    
    // Assign super-admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role_name: 'super-admin',
        permissions: ['*'],
        is_active: true,
        assigned_by: user.id
      });
    
    if (roleError) {
      console.error('❌ Failed to assign role:', roleError.message);
      return;
    }
    
    console.log('✅ Test user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role: super-admin');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestUser();