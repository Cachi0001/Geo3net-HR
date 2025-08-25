const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseServiceKey ? 'Present' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAttendanceReport() {
  try {
    console.log('🔍 Testing attendance report data enrichment...');
    
    // Test the enhanced query structure
    const today = new Date().toISOString().split('T')[0];
    
    const { data: attendanceRecords, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        users!inner(id, full_name, email),
        employees!inner(employee_number, user_id, department_id),
        departments(name)
      `)
      .gte('date', today)
      .lte('date', today)
      .limit(5);

    if (error) {
      console.error('❌ Error fetching attendance records:', error);
      return;
    }

    console.log(`✅ Found ${attendanceRecords?.length || 0} attendance records for today`);
    
    if (attendanceRecords && attendanceRecords.length > 0) {
      console.log('\n📋 Sample attendance record:');
      const sample = attendanceRecords[0];
      console.log({
        id: sample.id,
        employee_id: sample.employee_id,
        employeeName: sample.users?.full_name,
        employeeNumber: sample.employees?.employee_number,
        department: sample.departments?.name,
        date: sample.date,
        status: sample.status,
        check_in_time: sample.check_in_time,
        check_out_time: sample.check_out_time
      });
    }

    // Test time entries with location data
    console.log('\n🔍 Testing time entries with location data...');
    
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select(`
        *,
        users!inner(id, full_name, email),
        employees!inner(employee_number, user_id, department_id),
        departments(name)
      `)
      .gte('check_in_time', `${today}T00:00:00`)
      .lte('check_in_time', `${today}T23:59:59`)
      .limit(5);

    if (timeError) {
      console.error('❌ Error fetching time entries:', timeError);
      return;
    }

    console.log(`✅ Found ${timeEntries?.length || 0} time entries for today`);
    
    if (timeEntries && timeEntries.length > 0) {
      console.log('\n📋 Sample time entry:');
      const sample = timeEntries[0];
      console.log({
        id: sample.id,
        employee_id: sample.employee_id,
        employeeName: sample.users?.full_name,
        employeeNumber: sample.employees?.employee_number,
        department: sample.departments?.name,
        check_in_time: sample.check_in_time,
        check_out_time: sample.check_out_time,
        check_in_location: sample.check_in_location,
        check_out_location: sample.check_out_location,
        status: sample.status
      });
    }

    // Test API endpoint directly
    console.log('\n🔍 Testing attendance report API endpoint...');
    
    try {
      const response = await fetch(`http://localhost:5004/api/time-tracking/admin/report?startDate=${today}&endDate=${today}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response:', {
          success: data.success,
          recordCount: data.data?.records?.length || 0,
          summary: data.data?.summary
        });
        
        if (data.data?.records?.length > 0) {
          console.log('\n📋 Sample API record:');
          const sample = data.data.records[0];
          console.log({
            employeeName: sample.employeeName,
            employeeNumber: sample.employeeNumber,
            department: sample.department,
            checkInLocation: sample.checkInLocation,
            checkOutLocation: sample.checkOutLocation
          });
        }
      } else {
        console.error('❌ API Error:', response.status, response.statusText);
      }
    } catch (apiError) {
      console.error('❌ API Request failed:', apiError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAttendanceReport();