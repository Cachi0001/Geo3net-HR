const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function debugTimeEntries() {
  try {
    console.log('🔍 Checking time_entries table...');
    
    // Get all time entries
    const { data: allEntries, error: allError } = await supabase
      .from('time_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allError) {
      console.error('❌ Error fetching all entries:', allError);
    } else {
      console.log(`📊 Total entries found: ${allEntries?.length || 0}`);
      if (allEntries && allEntries.length > 0) {
        console.log('📋 Recent entries:');
        allEntries.forEach((entry, index) => {
          console.log(`  ${index + 1}. ID: ${entry.id}`);
          console.log(`     Employee: ${entry.employee_id}`);
          console.log(`     Check-in: ${entry.check_in_time}`);
          console.log(`     Check-out: ${entry.check_out_time || 'Not checked out'}`);
          console.log(`     Status: ${entry.status}`);
          console.log(`     Created: ${entry.created_at}`);
          console.log('     ---');
        });
      }
    }
    
    // Check for specific employee
    const employeeId = '6557ba97-11de-478b-96f0-75a4da4db358';
    console.log(`\n🔍 Checking entries for employee: ${employeeId}`);
    
    const { data: employeeEntries, error: empError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .order('check_in_time', { ascending: false });
    
    if (empError) {
      console.error('❌ Error fetching employee entries:', empError);
    } else {
      console.log(`📊 Entries for employee: ${employeeEntries?.length || 0}`);
      if (employeeEntries && employeeEntries.length > 0) {
        employeeEntries.forEach((entry, index) => {
          console.log(`  ${index + 1}. Check-in: ${entry.check_in_time}`);
          console.log(`     Check-out: ${entry.check_out_time || 'Not checked out'}`);
          console.log(`     Status: ${entry.status}`);
        });
      }
    }
    
    // Check date range (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`\n🔍 Checking entries for date range: ${startDate} to ${endDate}`);
    
    const { data: rangeEntries, error: rangeError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('check_in_time', startDate)
      .lte('check_in_time', endDate)
      .order('check_in_time', { ascending: false });
    
    if (rangeError) {
      console.error('❌ Error fetching range entries:', rangeError);
    } else {
      console.log(`📊 Entries in date range: ${rangeEntries?.length || 0}`);
      if (rangeEntries && rangeEntries.length > 0) {
        rangeEntries.forEach((entry, index) => {
          console.log(`  ${index + 1}. ${entry.check_in_time} - ${entry.status}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugTimeEntries();