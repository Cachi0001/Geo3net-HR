require('dotenv').config();
const { supabase } = require('./dist/config/database');

async function checkSchema() {
  try {
    console.log('🔍 Checking leave_balances table schema...');
    
    // Get one record to see the actual schema
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying leave_balances:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Sample record from leave_balances:');
      console.log(JSON.stringify(data[0], null, 2));
      console.log('\n📋 Available columns:', Object.keys(data[0]));
    } else {
      console.log('⚠️ No records found in leave_balances table');
      
      // Try to get table structure by attempting to insert and seeing the error
      const { error: insertError } = await supabase
        .from('leave_balances')
        .insert({})
        .select();
      
      if (insertError) {
        console.log('📋 Table structure info from insert error:', insertError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
  
  process.exit(0);
}

checkSchema();