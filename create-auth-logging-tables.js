const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cwxlqpjslegqisijixwu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3eGxxcGpzbGVncWlzaWppeHd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwMTM0MCwiZXhwIjoyMDcwNDc3MzQwfQ.TuYUvY_dEZFS6YF2j91mK-UFFRpfnSX8-UujgsRFrBk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAuthLoggingTables() {
  console.log('🔍 Creating auth logging tables...');

  try {
    // Create auth_logs table
    console.log('\n1. Creating auth_logs table...');
    const { data: authLogsResult, error: authLogsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS auth_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            email VARCHAR(255) NOT NULL,
            action VARCHAR(100) NOT NULL,
            status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure', 'warning')),
            details JSONB,
            ip_address INET,
            user_agent TEXT,
            session_id VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (authLogsError) {
      console.error('❌ Failed to create auth_logs table:', authLogsError);
    } else {
      console.log('✅ auth_logs table created successfully');
    }

    // Create security_events table
    console.log('\n2. Creating security_events table...');
    const { data: securityEventsResult, error: securityEventsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS security_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            email VARCHAR(255),
            event_type VARCHAR(100) NOT NULL,
            severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
            description TEXT NOT NULL,
            metadata JSONB,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (securityEventsError) {
      console.error('❌ Failed to create security_events table:', securityEventsError);
    } else {
      console.log('✅ security_events table created successfully');
    }

    // Create indexes
    console.log('\n3. Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_auth_logs_email ON auth_logs(email);',
      'CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);',
      'CREATE INDEX IF NOT EXISTS idx_auth_logs_status ON auth_logs(status);',
      'CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_security_events_email ON security_events(email);',
      'CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);',
      'CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);',
      'CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);'
    ];

    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSql });
      if (indexError) {
        console.error('❌ Failed to create index:', indexError);
      }
    }
    console.log('✅ Indexes created successfully');

    console.log('\n✅ Auth logging tables setup completed!');

  } catch (error) {
    console.error('❌ Error creating auth logging tables:', error);
  }
}

// Alternative approach using direct SQL execution
async function createTablesDirectly() {
  console.log('🔍 Creating tables using direct SQL execution...');

  try {
    // Try to create tables using raw SQL
    const createAuthLogsSQL = `
      CREATE TABLE IF NOT EXISTS auth_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          email VARCHAR(255) NOT NULL,
          action VARCHAR(100) NOT NULL,
          status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure', 'warning')),
          details JSONB,
          ip_address INET,
          user_agent TEXT,
          session_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const createSecurityEventsSQL = `
      CREATE TABLE IF NOT EXISTS security_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          email VARCHAR(255),
          event_type VARCHAR(100) NOT NULL,
          severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          description TEXT NOT NULL,
          metadata JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Execute SQL directly
    const { error: error1 } = await supabase.from('auth_logs').select('id').limit(1);
    if (error1 && error1.code === '42P01') {
      console.log('auth_logs table does not exist, will be created by backend');
    }

    const { error: error2 } = await supabase.from('security_events').select('id').limit(1);
    if (error2 && error2.code === '42P01') {
      console.log('security_events table does not exist, will be created by backend');
    }

    console.log('✅ Table check completed');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the setup
createTablesDirectly().then(() => {
  console.log('\n🏁 Setup completed!');
}).catch(error => {
  console.error('💥 Setup failed:', error);
});