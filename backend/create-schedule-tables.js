const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function createScheduleTables() {
  try {
    console.log('Creating employee_schedules table...');
    
    // Create employee_schedules table
    const { error: scheduleError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.employee_schedules (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
          title text NOT NULL,
          description text,
          start_time timestamptz NOT NULL,
          end_time timestamptz NOT NULL,
          date date NOT NULL,
          type text NOT NULL DEFAULT 'work' CHECK (type IN ('work', 'meeting', 'break', 'training', 'other')),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `
    });

    if (scheduleError) {
      console.error('Error creating employee_schedules table:', scheduleError);
    } else {
      console.log('employee_schedules table created successfully');
    }

    console.log('Creating meetings table...');
    
    // Create meetings table
    const { error: meetingError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.meetings (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          title text NOT NULL,
          description text,
          start_time timestamptz NOT NULL,
          end_time timestamptz NOT NULL,
          meeting_type text NOT NULL DEFAULT 'general' CHECK (meeting_type IN ('general', 'team', 'one-on-one', 'client', 'training', 'review')),
          attendees jsonb NOT NULL DEFAULT '[]',
          location text,
          meeting_link text,
          created_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `
    });

    if (meetingError) {
      console.error('Error creating meetings table:', meetingError);
    } else {
      console.log('meetings table created successfully');
    }

    // Create indexes
    console.log('Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_employee_schedules_employee_id ON public.employee_schedules(employee_id);',
      'CREATE INDEX IF NOT EXISTS idx_employee_schedules_date ON public.employee_schedules(date);',
      'CREATE INDEX IF NOT EXISTS idx_employee_schedules_start_time ON public.employee_schedules(start_time);',
      'CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON public.meetings(start_time);',
      'CREATE INDEX IF NOT EXISTS idx_meetings_attendees ON public.meetings USING GIN(attendees);'
    ];

    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSql });
      if (indexError) {
        console.error('Error creating index:', indexError);
      }
    }

    console.log('Indexes created successfully');

    // Enable RLS
    console.log('Enabling Row Level Security...');
    
    const rlsCommands = [
      'ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;'
    ];

    for (const rlsSql of rlsCommands) {
      const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSql });
      if (rlsError) {
        console.error('Error enabling RLS:', rlsError);
      }
    }

    console.log('Row Level Security enabled successfully');

    // Test table access
    console.log('Testing table access...');
    
    const { data: scheduleData, error: scheduleTestError } = await supabase
      .from('employee_schedules')
      .select('*')
      .limit(1);

    const { data: meetingData, error: meetingTestError } = await supabase
      .from('meetings')
      .select('*')
      .limit(1);

    if (scheduleTestError) {
      console.error('Error accessing employee_schedules table:', scheduleTestError);
    } else {
      console.log('employee_schedules table is accessible');
    }

    if (meetingTestError) {
      console.error('Error accessing meetings table:', meetingTestError);
    } else {
      console.log('meetings table is accessible');
    }

    console.log('\nSchedule tables setup completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the migration
createScheduleTables();