import dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../config/database';
import { hashPassword } from './password';

export async function ensureSuperAdminExists() {
  console.log('🔍 Checking for super admin user...');
  
  try {
    // Check if super admin user exists
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@go3net.com');
    
    if (userError) {
      console.error('❌ Error checking user:', userError);
      return false;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ Super admin user not found. Creating...');
      
      // Create super admin user
      const hashedPassword = await hashPassword('Admin123!');
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            email: 'admin@go3net.com',
            password_hash: hashedPassword,
            full_name: 'Super Administrator',
            employee_id: 'ADMIN001',
            hire_date: new Date().toISOString().split('T')[0],
            status: 'active',
            account_status: 'active',
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (createError) {
        console.error('❌ Error creating super admin:', createError);
        return false;
      }
      
      // Create super-admin role for the new user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: newUser[0].id,
            role_name: 'super-admin',
            permissions: ['*'], // All permissions
            assigned_by: newUser[0].id,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      
      if (roleError) {
        console.error('❌ Error creating super admin role:', roleError);
        return false;
      }
      
      console.log('✅ Super admin user created:', newUser[0]);
      return true;
    } else {
      console.log('✅ Super admin user found:', users[0]);
      
      // Update password if needed
      const hashedPassword = await hashPassword('Admin123!');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          status: 'active',
          account_status: 'active',
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', 'admin@go3net.com');
      
      if (updateError) {
        console.error('❌ Error updating super admin user:', updateError);
        return false;
      }
      
      // Check and update user role
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', users[0].id)
        .eq('role_name', 'super-admin')
        .eq('is_active', true);
      
      if (roleCheckError) {
        console.error('❌ Error checking user role:', roleCheckError);
        return false;
      }
      
      if (!existingRole || existingRole.length === 0) {
        // Create super-admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([
            {
              user_id: users[0].id,
              role_name: 'super-admin',
              permissions: ['*'], // All permissions
              assigned_by: users[0].id,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
        
        if (roleError) {
          console.error('❌ Error creating super admin role:', roleError);
          return false;
        }
        
        console.log('✅ Super admin role created');
      } else {
        console.log('✅ Super admin role already exists');
      }
      
      console.log('✅ Super admin user updated with correct password and role');
      return true;
    }
  } catch (error) {
    console.error('❌ Database debug error:', error);
    return false;
  }
}

export async function testDatabaseConnections() {
  console.log('🔍 Testing database connections...');
  
  try {
    // Test users table
    const { count: userCount, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (userError) {
      console.error('❌ Users table error:', userError);
    } else {
      console.log('✅ Users table accessible, count:', userCount);
    }
    
    // Test departments table
    const { count: deptCount, error: deptError } = await supabase
      .from('departments')
      .select('*', { count: 'exact', head: true });
    
    if (deptError) {
      console.error('❌ Departments table error:', deptError);
    } else {
      console.log('✅ Departments table accessible, count:', deptCount);
    }
    
    // Test time_entries table
    const { count: timeCount, error: timeError } = await supabase
      .from('time_entries')
      .select('*', { count: 'exact', head: true });
    
    if (timeError) {
      console.error('❌ Time entries table error:', timeError);
    } else {
      console.log('✅ Time entries table accessible, count:', timeCount);
    }
    
    // Test locations table
    const { count: locationCount, error: locationError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true });
    
    if (locationError) {
      console.error('❌ Locations table error:', locationError);
    } else {
      console.log('✅ Locations table accessible, count:', locationCount);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection test error:', error);
    return false;
  }
}

export async function createSampleData() {
  console.log('🔍 Creating sample data...');
  
  try {
    // Create sample departments if none exist
    const { count: deptCount } = await supabase
      .from('departments')
      .select('*', { count: 'exact', head: true });
    
    if (!deptCount || deptCount === 0) {
      console.log('📝 Creating sample departments...');
      
      const sampleDepartments = [
        { name: 'Engineering', description: 'Software development and technical operations', is_active: true },
        { name: 'Human Resources', description: 'Employee management and organizational development', is_active: true },
        { name: 'Marketing', description: 'Brand promotion and customer acquisition', is_active: true },
        { name: 'Sales', description: 'Revenue generation and client relations', is_active: true },
        { name: 'Finance', description: 'Financial planning and accounting', is_active: true },
        { name: 'Operations', description: 'Business operations and process management', is_active: true },
        { name: 'Customer Support', description: 'Customer service and technical support', is_active: true },
        { name: 'Legal', description: 'Legal compliance and contract management', is_active: true }
      ];
      
      const { error: deptError } = await supabase
        .from('departments')
        .insert(sampleDepartments);
      
      if (deptError) {
        console.error('❌ Error creating departments:', deptError);
      } else {
        console.log('✅ Sample departments created');
      }
    }
    
    // Create sample locations if none exist
    const { count: locationCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true });
    
    if (!locationCount || locationCount === 0) {
      console.log('📝 Creating sample locations...');
      
      const sampleLocations = [
        {
          name: 'Lagos HQ',
          address: 'Victoria Island, Lagos, Nigeria',
          latitude: 6.4281,
          longitude: 3.4219,
          radius: 100,
          is_active: true,
          is_default: true
        },
        {
          name: 'Abuja Branch',
          address: 'Wuse 2, Abuja, Nigeria',
          latitude: 9.0579,
          longitude: 7.4951,
          radius: 100,
          is_active: true,
          is_default: false
        },
        {
          name: 'Port Harcourt Office',
          address: 'GRA, Port Harcourt, Nigeria',
          latitude: 4.8156,
          longitude: 7.0498,
          radius: 100,
          is_active: true,
          is_default: false
        },
        {
          name: 'Remote Work',
          address: 'Various Locations',
          latitude: 0,
          longitude: 0,
          radius: 0,
          is_active: true,
          is_default: false
        }
      ];
      
      const { error: locationError } = await supabase
        .from('locations')
        .insert(sampleLocations);
      
      if (locationError) {
        console.error('❌ Error creating locations:', locationError);
      } else {
        console.log('✅ Sample locations created');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Sample data creation error:', error);
    return false;
  }
}

// Run all setup functions
export async function setupDatabase() {
  console.log('🚀 Setting up database for super admin functionality...');
  
  const steps = [
    { name: 'Test database connections', fn: testDatabaseConnections },
    { name: 'Ensure super admin exists', fn: ensureSuperAdminExists },
    { name: 'Create sample data', fn: createSampleData }
  ];
  
  for (const step of steps) {
    console.log(`\n📋 ${step.name}...`);
    const success = await step.fn();
    if (!success) {
      console.error(`❌ Failed: ${step.name}`);
      return false;
    }
  }
  
  console.log('\n✅ Database setup completed successfully!');
  console.log('🔐 Super admin credentials:');
  console.log('   Email: admin@go3net.com');
  console.log('   Password: Admin123!');
  
  return true;
}

// If this file is run directly
if (require.main === module) {
  setupDatabase().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}