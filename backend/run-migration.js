require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running schedule tables migration...');
    
    const migrationPath = path.join(__dirname, 'database', 'migrations', '001_create_schedule_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Creating employee_schedules table...');
    
    // Create employee_schedules table
    const { error: scheduleError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS employee_schedules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          type VARCHAR(50) DEFAULT 'event',
          status VARCHAR(20) DEFAULT 'scheduled',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id)
        );
      `
    });
    
    if (scheduleError) {
      console.error('❌ Error creating employee_schedules table:', scheduleError);
    } else {
      console.log('✅ employee_schedules table created successfully');
    }
    
    console.log('📝 Creating meetings table...');
    
    // Create meetings table
    const { error: meetingError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS meetings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE NOT NULL,
          meeting_type VARCHAR(50) DEFAULT 'meeting',
          location VARCHAR(255),
          meeting_link VARCHAR(500),
          attendees JSONB DEFAULT '[]'::jsonb,
          organizer_id UUID NOT NULL REFERENCES users(id),
          status VARCHAR(20) DEFAULT 'scheduled',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id)
        );
      `
    });
    
    if (meetingError) {
      console.error('❌ Error creating meetings table:', meetingError);
    } else {
      console.log('✅ meetings table created successfully');
    }
    
    console.log('📝 Creating indexes...');
    
    // Create indexes
    const indexes = [
      {
        name: 'idx_employee_schedules_employee_date',
        sql: 'CREATE INDEX IF NOT EXISTS idx_employee_schedules_employee_date ON employee_schedules(employee_id, date);'
      },
      {
        name: 'idx_employee_schedules_date_time',
        sql: 'CREATE INDEX IF NOT EXISTS idx_employee_schedules_date_time ON employee_schedules(date, start_time);'
      },
      {
        name: 'idx_meetings_start_time',
        sql: 'CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);'
      },
      {
        name: 'idx_meetings_attendees',
        sql: 'CREATE INDEX IF NOT EXISTS idx_meetings_attendees ON meetings USING GIN(attendees);'
      },
      {
        name: 'idx_meetings_organizer',
        sql: 'CREATE INDEX IF NOT EXISTS idx_meetings_organizer ON meetings(organizer_id);'
      }
    ];
    
    for (const index of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', {
        sql_query: index.sql
      });
      
      if (indexError) {
        console.error(`❌ Error creating index ${index.name}:`, indexError);
      } else {
        console.log(`✅ Index ${index.name} created successfully`);
      }
    }
    
    console.log('📝 Adding sample data...');
    
    // Get a user ID for sample data
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('status', 'active')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.log('⚠️ No active users found, skipping sample data insertion');
    } else {
      const userId = users[0].id;
      const today = new Date().toISOString().split('T')[0];
      
      // Insert sample schedule
      const { error: sampleError1 } = await supabase
        .from('employee_schedules')
        .insert({
          employee_id: userId,
          title: 'Daily Standup',
          description: 'Team daily standup meeting',
          date: today,
          start_time: '09:00:00',
          end_time: '09:30:00',
          type: 'meeting'
        });
      
      if (sampleError1) {
        console.log('⚠️ Sample schedule data already exists or error:', sampleError1.message);
      } else {
        console.log('✅ Sample schedule data inserted');
      }
      
      // Insert sample meeting
      const { error: sampleError2 } = await supabase
        .from('meetings')
        .insert({
          title: 'Project Review',
          description: 'Weekly project review session',
          start_time: `${today}T14:00:00`,
          end_time: `${today}T15:00:00`,
          meeting_type: 'review',
          organizer_id: userId,
          attendees: JSON.stringify([userId])
        });
      
      if (sampleError2) {
        console.log('⚠️ Sample meeting data already exists or error:', sampleError2.message);
      } else {
        console.log('✅ Sample meeting data inserted');
      }
    }
    
    console.log('🎉 Migration completed!');
    
    // Test the tables by checking if they exist
    console.log('🔍 Verifying tables...');
    
    const { data: scheduleTest, error: scheduleTestError } = await supabase
      .from('employee_schedules')
      .select('count')
      .limit(1);
      
    const { data: meetingTest, error: meetingTestError } = await supabase
      .from('meetings')
      .select('count')
      .limit(1);
    
    if (!scheduleTestError) {
      console.log('✅ employee_schedules table is accessible');
    } else {
      console.log('❌ employee_schedules table error:', scheduleTestError.message);
    }
    
    if (!meetingTestError) {
      console.log('✅ meetings table is accessible');
    } else {
      console.log('❌ meetings table error:', meetingTestError.message);
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

runMigration();