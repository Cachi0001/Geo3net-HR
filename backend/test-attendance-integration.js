const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testAttendanceIntegration() {
  try {
    console.log('🔍 Testing attendance integration...');

    // Check if time_entries table exists and has data
    console.log('\n📊 Checking time_entries table...');
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select('*')
      .limit(5);

    if (timeError) {
      console.error('❌ Error accessing time_entries:', timeError);
    } else {
      console.log(`✅ Time entries found: ${timeEntries?.length || 0}`);
      if (timeEntries && timeEntries.length > 0) {
        console.log('📋 Sample time entry:');
        console.log(JSON.stringify(timeEntries[0], null, 2));
      }
    }

    // Check if attendance_records table exists and has data
    console.log('\n📊 Checking attendance_records table...');
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .limit(5);

    if (attendanceError) {
      console.error('❌ Error accessing attendance_records:', attendanceError);
    } else {
      console.log(`✅ Attendance records found: ${attendanceRecords?.length || 0}`);
      if (attendanceRecords && attendanceRecords.length > 0) {
        console.log('📋 Sample attendance record:');
        console.log(JSON.stringify(attendanceRecords[0], null, 2));
      }
    }

    // Check users table for active employees
    console.log('\n👥 Checking active users...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, employee_id, status')
      .eq('status', 'active')
      .limit(5);

    if (userError) {
      console.error('❌ Error accessing users:', userError);
    } else {
      console.log(`✅ Active users found: ${users?.length || 0}`);
      if (users && users.length > 0) {
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.full_name} (${user.employee_id}) - ${user.email}`);
        });
      }
    }

    // Test attendance summary query
    console.log('\n📈 Testing attendance summary query...');
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayAttendance, error: summaryError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('date', today);

    if (summaryError) {
      console.error('❌ Error getting today\'s attendance:', summaryError);
    } else {
      console.log(`✅ Today's attendance records: ${todayAttendance?.length || 0}`);
      
      if (todayAttendance && todayAttendance.length > 0) {
        const present = todayAttendance.filter(r => r.status === 'present').length;
        const late = todayAttendance.filter(r => r.status === 'late').length;
        const absent = todayAttendance.filter(r => r.status === 'absent').length;
        
        console.log(`  Present: ${present}, Late: ${late}, Absent: ${absent}`);
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testAttendanceIntegration();