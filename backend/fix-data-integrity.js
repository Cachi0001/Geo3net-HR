const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDataIntegrity() {
  console.log('🔍 Checking for data integrity issues...');
  
  try {
    // Find employees with user_id that don't exist in users table
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, full_name, email, user_id')
      .not('user_id', 'is', null);
    
    if (employeesError) {
      console.error('❌ Error fetching employees:', employeesError);
      return;
    }
    
    console.log(`📊 Found ${employees.length} employees with user_id`);
    
    const issues = [];
    
    for (const employee of employees) {
      // Check if the user_id exists in users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', employee.user_id)
        .single();
      
      if (userError && userError.code === 'PGRST116') {
        // User doesn't exist
        issues.push(employee);
        console.log(`❌ Data integrity issue found:`, {
          employeeId: employee.id,
          employeeName: employee.full_name,
          employeeEmail: employee.email,
          missingUserId: employee.user_id
        });
      }
    }
    
    if (issues.length === 0) {
      console.log('✅ No data integrity issues found!');
      return;
    }
    
    console.log(`🔧 Found ${issues.length} data integrity issues. Fixing...`);
    
    // Option 1: Set user_id to null for employees with missing users
    for (const employee of issues) {
      console.log(`🔧 Fixing employee: ${employee.full_name}`);
      
      const { error: updateError } = await supabase
        .from('employees')
        .update({ user_id: null })
        .eq('id', employee.id);
      
      if (updateError) {
        console.error(`❌ Failed to fix employee ${employee.full_name}:`, updateError);
      } else {
        console.log(`✅ Fixed employee ${employee.full_name} - set user_id to null`);
      }
    }
    
    console.log('✅ Data integrity fix completed!');
    
  } catch (error) {
    console.error('❌ Error during data integrity fix:', error);
  }
}

// Run the fix
fixDataIntegrity().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});