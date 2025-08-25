const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugSpecificEmployee() {
  console.log('🔍 Debugging specific employee: CALEB KELECHI ONYEMECHI');
  
  try {
    // Find the specific employee
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .ilike('full_name', '%CALEB%');
    
    if (employeeError) {
      console.error('❌ Error finding employees:', employeeError);
      return;
    }
    
    if (!employees || employees.length === 0) {
      console.log('❌ No employees found');
      return;
    }
    
    console.log(`📋 Found ${employees.length} employees with CALEB in name`);
    
    for (const employee of employees) {
      console.log('\n📋 Employee:', {
        id: employee.id,
        full_name: employee.full_name,
        email: employee.email,
        user_id: employee.user_id,
        employment_status: employee.employment_status
      });
      
      // Check if the user_id exists in users table
      if (employee.user_id) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', employee.user_id)
          .single();
        
        if (userError) {
          console.error('❌ User lookup error:', userError);
          if (userError.code === 'PGRST116') {
            console.log('💥 FOUND THE ISSUE: user_id exists in employees but not in users table!');
            console.log('🔧 Fixing by setting user_id to null...');
            
            const { error: updateError } = await supabase
              .from('employees')
              .update({ user_id: null })
              .eq('id', employee.id);
            
            if (updateError) {
              console.error('❌ Failed to fix employee:', updateError);
            } else {
              console.log('✅ Fixed employee - set user_id to null');
            }
          }
        } else {
          console.log('✅ User exists:', {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            status: user.status
          });
        }
      } else {
        console.log('ℹ️ Employee has no user_id (this is fine)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Run the debug
debugSpecificEmployee().then(() => {
  console.log('🏁 Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});